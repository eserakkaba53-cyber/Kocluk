// odeme-baslat ve odeme-bildirim akış sınaması: gerçek index.ts dosyaları Node 22.18+/24'te,
// sahte iyzico ve sahte Supabase (PostgREST + Auth) ile çalışır. Ağ ve anahtar gerekmez.
//   node supabase/functions/_ortak/akis_sinama.mjs
// Son satır "AKIS SINAMASI: TAMAM" olmalı. Sahte iyzico her isteğin IYZWSv2 başlığını yeniden
// hesaplayıp karşılaştırır, sorgu yanıtlarını gerçek iyzico gibi imzalar (449.0 -> "449").
// odeme_onayla burada sahtedir; SQL'in kendisi ODEME-iyzico-kurulum.sql içindeki testle sınanır.
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

const KOK = new URL('../', import.meta.url).href;   // supabase/functions/
const SB = 'https://proje.supabase.co';
const IYZ = 'https://sandbox-api.iyzipay.com';
const API = 'sandbox-api-anahtar', GIZLI = 'sandbox-gizli-anahtar';
const ANON = 'eyJanon', SERVIS = 'eyJservis';
Object.assign(process.env, {
  SUPABASE_URL: SB, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SERVIS,
  IYZICO_API_KEY: API, IYZICO_SECRET_KEY: GIZLI, IYZICO_BASE_URL: IYZ + '/',
});
const isleyiciler = [];
globalThis.Deno = { env: { get: (k) => process.env[k] }, serve: (h) => { isleyiciler.push(h); } };

// Günlükte jeton ya da anahtar geçmesin diye her satır toplanır.
const gunluk = [];
for (const d of ['log', 'error']) console[d] = (...a) => gunluk.push(a.join(' '));

const hmac = (k, v) => createHmac('sha256', k).update(v).digest('hex');
const KOCLAR = {
  'aaaaaaaa-0000-4000-8000-000000000001': { ad: '  Ayşe Nur  Yılmaz ', telefon: '0532 123 45 67', eposta: 'ayse@ornek.com' },
  'aaaaaaaa-0000-4000-8000-000000000002': { ad: 'Mehmet', telefon: '', eposta: 'm@ornek.com' },
};
const FIYAT = { ogrenci: '99.00', koc: '449.00', sinif: '2999.00' };
const AD = { ogrenci: 'Koçsuz Öğrenci Paketi', koc: 'Öğretmen Paketi', sinif: 'Sınıf Paketi' };
const db = new Map();
let sayac = 0, iyzicoSorgu = 0, onaylaCagri = [], sonBaslatIstegi = null;
let sorguYaniti = null;            // (satir, istek) => ham JSON metni | 'AG_HATASI'
let hazirlaRet = null;             // doluysa odeme_hazirla bunu döner

function sbBasliklariniDenetle(h, kullaniciAdina) {
  if (kullaniciAdina) {
    assert.equal(h.get('apikey'), process.env.SUPABASE_PUBLISHABLE_KEYS ? 'sb_publishable_x' : ANON);
  } else if (process.env.SUPABASE_SECRET_KEYS) {
    assert.equal(h.get('apikey'), 'sb_secret_x');
    assert.equal(h.get('Authorization'), null, 'yeni gizli anahtar Bearer ile gitmemeli');
  } else {
    assert.equal(h.get('apikey'), SERVIS);
    assert.equal(h.get('Authorization'), `Bearer ${SERVIS}`);
  }
}

globalThis.fetch = async (adres, init = {}) => {
  const u = new URL(adres), h = new Headers(init.headers), govde = init.body;
  if (u.origin === IYZ) {
    assert.ok(!u.pathname.startsWith('//'), 'taban adresin sonundaki / ayıklanmalı');
    const rnd = h.get('x-iyzi-rnd');
    const imza = hmac(GIZLI, rnd + u.pathname + govde);
    assert.equal(h.get('Authorization'), 'IYZWSv2 ' + Buffer.from(`apiKey:${API}&randomKey:${rnd}&signature:${imza}`).toString('base64'));
    const istek = JSON.parse(govde);
    if (u.pathname === '/payment/iyzipos/checkoutform/initialize/auth/ecom') {
      sonBaslatIstegi = istek;
      const token = 'tok-' + istek.conversationId;
      return Response.json({ status: 'success', conversationId: istek.conversationId, token,
        paymentPageUrl: 'https://sandbox-cpp.iyzipay.com?token=' + token + '&lang=tr',
        signature: hmac(GIZLI, `${istek.conversationId}:${token}`) });
    }
    if (u.pathname === '/payment/iyzipos/checkoutform/auth/ecom/detail') {
      iyzicoSorgu++;
      const satir = [...db.values()].find((r) => r.token === istek.token);
      assert.equal(istek.conversationId, satir.id, 'sorguda conversationId = ödeme no');
      const metin = sorguYaniti(satir, istek);
      if (metin === 'AG_HATASI') throw new TypeError('fetch failed');
      return new Response(metin, { status: 200, headers: { 'content-type': 'application/json' } });
    }
  }
  if (u.origin === SB) {
    if (globalThis.sbKopuk) throw new TypeError('fetch failed');
    if (u.pathname === '/auth/v1/user') {
      sbBasliklariniDenetle(h, true);
      const m = /^Bearer jwt-(.+)$/.exec(h.get('Authorization') ?? '');
      return m ? Response.json({ id: m[1] }) : Response.json({ msg: 'invalid JWT' }, { status: 401 });
    }
    if (u.pathname === '/rest/v1/rpc/odeme_hazirla') {
      sbBasliklariniDenetle(h, true);
      const m = /^Bearer jwt-(.+)$/.exec(h.get('Authorization') ?? '');
      if (!m) return Response.json({ message: 'JWT expired' }, { status: 401 });
      if (hazirlaRet) return Response.json(hazirlaRet);
      const { p_paket } = JSON.parse(govde);
      if (!FIYAT[p_paket]) return Response.json({ ok: false, hata: 'Bu paket çevrim içi satılmıyor.' });
      const id = `bbbbbbbb-0000-4000-8000-${String(++sayac).padStart(12, '0')}`;
      db.set(id, { id, koc_id: m[1], paket: p_paket, tutar: FIYAT[p_paket], para: 'TRY', durum: 'bekliyor', token: null, hata: null, lisans_sonraki: null });
      const k = KOCLAR[m[1]];
      return Response.json({ ok: true, odeme_id: id, koc_id: m[1], paket: p_paket, paket_adi: AD[p_paket],
        tutar: FIYAT[p_paket], eposta: k.eposta, ad: k.ad, telefon: k.telefon });
    }
    if (u.pathname === '/rest/v1/rpc/odeme_onayla') {
      sbBasliklariniDenetle(h, false);
      const a = JSON.parse(govde);
      onaylaCagri.push(a);
      const r = db.get(a.p_odeme);
      if (r.durum === 'odendi') return Response.json({ ok: true, zaten: true, paket: r.paket, lisans_bitis: r.lisans_sonraki });
      if (r.durum !== 'bekliyor' || Number(a.p_tutar) !== Number(r.tutar) || a.p_para !== r.para) {
        r.durum = 'basarisiz'; return Response.json({ ok: false, hata: 'Tahsil edilen tutar kayıttakiyle aynı değil.' });
      }
      Object.assign(r, { durum: 'odendi', lisans_sonraki: '2027-10-02', saglayici_odeme_id: a.p_saglayici_odeme_id });
      return Response.json({ ok: true, paket: r.paket, lisans_bitis: '2027-10-02' });
    }
    if (u.pathname === '/rest/v1/odemeler') {
      sbBasliklariniDenetle(h, false);
      const esit = (alan) => u.searchParams.get(alan)?.replace(/^eq\./, '');
      const uyan = [...db.values()].filter((r) =>
        (!esit('id') || r.id === esit('id')) && (!esit('token') || r.token === esit('token')) &&
        (!esit('durum') || r.durum === esit('durum')));
      if (init.method === 'GET') return Response.json(uyan);
      if (init.method === 'PATCH') { for (const r of uyan) Object.assign(r, JSON.parse(govde)); return new Response(null, { status: 204 }); }
    }
  }
  throw new Error('beklenmeyen istek ' + (init.method ?? 'GET') + ' ' + adres);
};

await import(KOK + 'odeme-baslat/index.ts');
await import(KOK + 'odeme-bildirim/index.ts');
const [baslat, bildirim] = isleyiciler;
const K1 = 'aaaaaaaa-0000-4000-8000-000000000001', K2 = 'aaaaaaaa-0000-4000-8000-000000000002';

const baslatIstegi = (paket, jwt, koken = 'https://biyoser.com.tr') => new Request(SB + '/functions/v1/odeme-baslat', {
  method: 'POST', headers: { Origin: koken, 'Content-Type': 'application/json', ...(jwt ? { Authorization: 'Bearer ' + jwt } : {}) },
  body: JSON.stringify({ paket }),
});
const donus = (token) => new Request(SB + '/functions/v1/odeme-bildirim', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: token === undefined ? '' : new URLSearchParams({ token }).toString(),
});
const kontrolIstegi = (id, jwt) => new Request(SB + '/functions/v1/odeme-bildirim?kontrol=' + id, {
  method: 'GET', headers: { Origin: 'http://localhost:8901', ...(jwt ? { Authorization: 'Bearer ' + jwt } : {}) },
});
const basari = (over = {}) => (satir) => {
  const y = { status: 'success', paymentStatus: 'SUCCESS', fraudStatus: 1, paymentId: '24681357', currency: 'TRY',
    basketId: satir.id, conversationId: satir.id, token: satir.token, binNumber: '55287900', lastFourDigits: '0008', ...over };
  const fiyat = over.paidPrice ?? satir.tutar;                 // iyzico JSON'da 449.0 gibi döner
  const ham = { ...y, paidPrice: '@P', price: '@P' };
  const imza = over.signature ?? hmac(GIZLI, [y.paymentStatus, y.paymentId, y.currency, y.basketId, y.conversationId,
    String(Number(fiyat)), String(Number(fiyat)), y.token].join(':'));
  return JSON.stringify({ ...ham, signature: imza }).replaceAll('"@P"', Number(fiyat).toFixed(1));
};
const yeniOdeme = async (paket = 'koc', jwt = 'jwt-' + K1) => {
  const r = await baslat(baslatIstegi(paket, jwt));
  assert.equal(r.status, 200);
  return (await r.json()).odeme_id;
};
const yer = (r) => new URL(r.headers.get('Location'));
let n = 0; const tamam = (ad) => console.info(String(++n).padStart(2) + '. ' + ad);

// ── odeme-baslat ──
{
  const r = await baslat(new Request(SB + '/functions/v1/odeme-baslat', { method: 'OPTIONS', headers: { Origin: 'https://www.biyoser.com.tr' } }));
  assert.equal(r.status, 204); assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://www.biyoser.com.tr');
  const r2 = await baslat(new Request(SB + '/functions/v1/odeme-baslat', { method: 'OPTIONS', headers: { Origin: 'https://kotu.example' } }));
  assert.equal(r2.headers.get('Access-Control-Allow-Origin'), null);
  tamam('CORS: izinli kökene izin, ötekine yok');
}
{
  assert.equal((await baslat(baslatIstegi('koc', null))).status, 401);
  assert.equal((await baslat(baslatIstegi('koc', 'bozuk'))).status, 401);
  tamam('JWT yoksa ya da geçersizse 401');
}
{
  const r = await baslat(baslatIstegi('okul', 'jwt-' + K1));
  assert.equal(r.status, 400); assert.equal((await r.json()).hata, 'Bu paket çevrim içi satılmıyor.');
  hazirlaRet = { ok: false, hata: 'Mevcut paketin daha geniş. Süren bitince daha küçük pakete geçebilirsin.' };
  const r2 = await baslat(baslatIstegi('ogrenci', 'jwt-' + K1));
  assert.equal((await r2.json()).hata, hazirlaRet.hata); hazirlaRet = null;
  tamam('SQL reddi (satılmayan paket, küçük pakete geçiş) Türkçe iletilir');
}
{
  globalThis.sbKopuk = true;
  const r = await baslat(baslatIstegi('koc', 'jwt-' + K1));
  globalThis.sbKopuk = false;
  assert.equal(r.status, 502); assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://biyoser.com.tr');
  assert.equal((await r.json()).hata, 'Ödeme sayfası açılamadı. Birazdan yeniden dene.');
  globalThis.sbKopuk = true;
  const r2 = await bildirim(donus('tok-herhangi'));
  globalThis.sbKopuk = false;
  assert.equal(r2.headers.get('Location'), 'https://biyoser.com.tr/kocluk-sunucu.html?durum=bekliyor');
  tamam('Supabase\'e ulaşılamazsa: başlatma 502 + CORS, dönüş "bekliyor"');
}
let A;
{
  const r = await baslat(baslatIstegi('koc', 'jwt-' + K1));
  const j = await r.json();
  assert.equal(r.status, 200); assert.equal(j.ok, true); A = j.odeme_id;
  assert.equal(j.url, `https://sandbox-cpp.iyzipay.com?token=tok-${A}&lang=tr`);
  assert.equal(db.get(A).token, 'tok-' + A, 'jeton satıra yazıldı');
  const i = sonBaslatIstegi;
  assert.deepEqual([i.price, i.paidPrice, i.currency, i.locale, i.paymentGroup], ['449.00', '449.00', 'TRY', 'tr', 'PRODUCT']);
  assert.deepEqual(i.enabledInstallments, [1]);
  assert.equal(i.conversationId, A); assert.equal(i.basketId, A);
  assert.equal(i.callbackUrl, SB + '/functions/v1/odeme-bildirim');
  assert.deepEqual(i.basketItems, [{ id: 'koc', name: 'Biyoser Öğretmen Paketi (1 yıl)', category1: 'Yazılım', itemType: 'VIRTUAL', price: '449.00' }]);
  assert.deepEqual([i.buyer.id, i.buyer.name, i.buyer.surname, i.buyer.gsmNumber, i.buyer.identityNumber, i.buyer.email],
    [K1, 'Ayşe Nur', 'Yılmaz', '+905321234567', '11111111111', 'ayse@ornek.com']);
  assert.equal(i.billingAddress.contactName, 'Ayşe Nur Yılmaz');
  tamam('Başlatma: tutar sunucudan, imzalı istek, jeton satırda, adres döndü');
}
{
  const r = await baslat(baslatIstegi('sinif', 'jwt-' + K2));
  assert.equal(r.status, 200);
  assert.deepEqual([sonBaslatIstegi.buyer.name, sonBaslatIstegi.buyer.surname, sonBaslatIstegi.buyer.gsmNumber, sonBaslatIstegi.price],
    ['Mehmet', '-', '+905000000000', '2999.00']);
  tamam('Tek kelimelik ad ve telefonsuz koç: yer tutucular');
}

// ── odeme-bildirim: iyzico dönüşü ──
{
  sorguYaniti = basari();
  const r = await bildirim(donus('tok-' + A));
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('Location'), `https://biyoser.com.tr/kocluk-sunucu.html?odeme=${A}&durum=basarili`);
  assert.equal(db.get(A).durum, 'odendi');
  assert.deepEqual(onaylaCagri.at(-1), { p_odeme: A, p_saglayici_odeme_id: '24681357', p_tutar: 449, p_para: 'TRY' });
  tamam('Başarılı dönüş: iyzico\'ya sorulur, imza (449.0 -> "449") tutar, lisans açılır, 303');
}
{
  const once = [iyzicoSorgu, onaylaCagri.length];
  const r = await bildirim(donus('tok-' + A));
  assert.equal(yer(r).searchParams.get('durum'), 'basarili');
  assert.deepEqual([iyzicoSorgu, onaylaCagri.length], once, 'ikinci POST iyzico\'ya ve onaya gitmez');
  tamam('Çift POST: ikinci kez işlenmez');
}
{
  const B = await yeniOdeme();
  sorguYaniti = basari({ signature: 'f'.repeat(64) });
  const r = await bildirim(donus('tok-' + B));
  assert.equal(yer(r).searchParams.get('durum'), 'bekliyor');
  assert.equal(db.get(B).durum, 'bekliyor'); assert.ok(!onaylaCagri.some((a) => a.p_odeme === B));
  tamam('Yanıt imzası tutmazsa lisans açılmaz, "bekliyor"');

  sorguYaniti = ((f) => (s, i) => f({ ...s, id: A }, i))(basari());   // başka sepetin geçerli imzalı sonucu
  const r2 = await bildirim(donus('tok-' + B));
  assert.equal(yer(r2).searchParams.get('durum'), 'bekliyor'); assert.equal(db.get(B).durum, 'bekliyor');
  tamam('Sepet no satırla tutmazsa açılmaz');

  sorguYaniti = () => JSON.stringify({ status: 'success', paymentStatus: 'FAILURE', errorCode: '10051', errorMessage: 'Kart limiti yetersiz' });
  const r3a = await bildirim(donus('tok-' + B));
  assert.equal(yer(r3a).searchParams.get('durum'), 'bekliyor'); assert.equal(db.get(B).hata, null);
  // OKU-odeme.md 5. soru: ilk imza denetimi ret dallarının altına taşınırsa bu beklenti 'basarisiz' olur.
  tamam('İmzasız FAILURE yanıtı: "bekliyor" (imza denetimi ret yolunu da kapsıyor)');

  sorguYaniti = basari({ paymentStatus: 'FAILURE', errorCode: '10051', errorMessage: 'Kart limiti yetersiz' });
  const r3 = await bildirim(donus('tok-' + B));
  assert.equal(yer(r3).searchParams.get('durum'), 'basarisiz');
  assert.equal(db.get(B).durum, 'bekliyor'); assert.equal(db.get(B).hata, 'iyzico: Kart limiti yetersiz');
  tamam('İmzalı FAILURE: panele "basarisiz", satır "bekliyor" + neden');

  sorguYaniti = basari({ fraudStatus: 0 });
  assert.equal(yer(await bildirim(donus('tok-' + B))).searchParams.get('durum'), 'bekliyor');
  sorguYaniti = () => 'AG_HATASI';
  assert.equal(yer(await bildirim(donus('tok-' + B))).searchParams.get('durum'), 'bekliyor');
  sorguYaniti = () => '<html>502</html>';
  assert.equal(yer(await bildirim(donus('tok-' + B))).searchParams.get('durum'), 'bekliyor');
  sorguYaniti = () => JSON.stringify({ status: 'failure', errorCode: '1', errorMessage: 'Sistem hatası' });
  assert.equal(yer(await bildirim(donus('tok-' + B))).searchParams.get('durum'), 'bekliyor');
  assert.equal(db.get(B).durum, 'bekliyor');
  tamam('İnceleme (fraudStatus 0), ağ hatası, HTML yanıt, sorgu hatası: "bekliyor"');

  sorguYaniti = basari({ paidPrice: '99.00' });
  const r4 = await bildirim(donus('tok-' + B));
  assert.equal(yer(r4).searchParams.get('durum'), 'basarisiz'); assert.equal(db.get(B).durum, 'basarisiz');
  assert.equal(onaylaCagri.at(-1).p_tutar, 99);
  tamam('Eksik tahsilat: odeme_onayla reddeder, "basarisiz"');
}
{
  const r = await bildirim(donus(undefined));
  assert.equal(r.headers.get('Location'), 'https://biyoser.com.tr/kocluk-sunucu.html?durum=basarisiz');
  const r2 = await bildirim(donus('tok-yok'));
  assert.equal(r2.headers.get('Location'), 'https://biyoser.com.tr/kocluk-sunucu.html?durum=basarisiz');
  tamam('Jetonsuz ya da bilinmeyen jeton: "basarisiz"');
}
{
  const C = await yeniOdeme('ogrenci');
  sorguYaniti = basari();
  const r = await bildirim(donus('tok-' + C));
  assert.equal(r.headers.get('Location'), `https://biyoser.com.tr/ogrenci-sunucu.html?odeme=${C}&durum=basarili`);
  tamam('Koçsuz öğrenci paketi öğrenci paneline döner');
}

// ── odeme-bildirim: kontrol ──
{
  const D = await yeniOdeme();
  assert.equal((await bildirim(kontrolIstegi(D, null))).status, 401);
  assert.equal((await bildirim(kontrolIstegi(D, 'jwt-' + K2))).status, 404, 'başkasının ödemesi');
  assert.equal((await bildirim(kontrolIstegi('x,or(1=1)', 'jwt-' + K1))).status, 404, 'uuid olmayan no');
  sorguYaniti = basari();
  const r = await bildirim(kontrolIstegi(D, 'jwt-' + K1));
  assert.equal(r.status, 200); assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8901');
  assert.deepEqual(await r.json(), { ok: true, paket: 'koc', durum: 'basarili', lisans_bitis: '2027-10-02' });
  const once = iyzicoSorgu;
  const r2 = await bildirim(kontrolIstegi(D, 'jwt-' + K1));
  assert.equal((await r2.json()).durum, 'basarili'); assert.equal(iyzicoSorgu, once, 'ödenmiş satır iyzico\'ya sorulmaz');
  tamam('Kontrol: JWT ve sahiplik denetimi, bekleyen ödeme açılır, ödenmiş yeniden sorulmaz');
}

// ── yeni Supabase anahtarları (2026 sonu geçişi) ──
{
  process.env.SUPABASE_SECRET_KEYS = '{"default":"sb_secret_x"}';
  process.env.SUPABASE_PUBLISHABLE_KEYS = '{"default":"sb_publishable_x"}';
  const E = await yeniOdeme();
  sorguYaniti = basari();
  assert.equal(yer(await bildirim(donus('tok-' + E))).searchParams.get('durum'), 'basarili');
  delete process.env.SUPABASE_SECRET_KEYS; delete process.env.SUPABASE_PUBLISHABLE_KEYS;
  tamam('Yeni anahtarlar: yalnız apikey başlığı, Bearer yok');
}

// ── günlük ──
{
  const metin = gunluk.join('\n');
  for (const yasak of ['tok-', GIZLI, API, SERVIS, ANON, 'jwt-', '55287900', '0008', 'ayse@ornek.com', '0532'])
    assert.ok(!metin.includes(yasak), 'günlükte geçmemeli: ' + yasak);
  tamam(`Günlükte jeton, anahtar, kart, e-posta yok (${gunluk.length} satır)`);
}
console.info('\nAKIS SINAMASI: TAMAM\n--- örnek günlük ---\n' + gunluk.slice(0, 8).join('\n'));
