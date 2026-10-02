// odeme-bildirim: iyzico dönüşü (callback) ve panelin "kontrol" isteği.
//
// DAĞITIM HER SEFERİNDE --no-verify-jwt İLE: iyzico'nun dönüşü tarayıcının
// oturumsuz form POST'udur; JWT denetimi açılırsa her dönüş 401 alır ve
// ödemesi alınmış koçun lisansı ancak "kontrol" ile açılır.
//   npx supabase functions deploy odeme-bildirim --no-verify-jwt --project-ref hdcxmunvkxkffnsewfgp
//
// 1) iyzico dönüşü: tarayıcı callbackUrl'e `token` POST eder. Gönderilen hiçbir
//    alana güvenilmez; jeton yalnız satırı bulmak ve iyzico'ya sormak için
//    kullanılır. Sonuç iyzico'nun sorgu API'sinden okunur, yanıt imzası
//    doğrulanır, tutar ve para birimini odeme_onayla satır kilidi altında
//    karşılaştırır. Her yol 303 ile panele döner:
//      <panel>?odeme=<id>&durum=basarili | basarisiz | bekliyor
//    bekliyor: sonuç belirsiz (iyzico'ya ulaşılamadı, 3DS sürüyor, iyzico
//    incelemesinde). Panel kullanıcıya yeniden ödeme yaptırmamalı, "kontrol"
//    ile sormalı.
// 2) Kontrol: GET/POST ?kontrol=<odeme_id> + Authorization: Bearer <koçun JWT'si>.
//    Tarayıcısı dönüşten önce kapanan koç panele girince hâlâ "bekliyor" olan
//    ödemesi saklı jetonla yeniden sorulur. Ağ geçidi JWT denetlemediği için
//    JWT burada Auth sunucusuna doğrulatılır; yalnız ödemenin sahibi sorabilir.
//    Yanıt: { ok, durum: basarili | basarisiz | bekliyor, paket, lisans_bitis, hata }
//
// Günlüğe yalnız ödeme no ve sonuç yazılır; jeton, kart bilgisi, anahtar yazılmaz.
import { cfSonucImzaAlanlari, CF_SORGULA, imzaDogru, iyzico, type IyzicoYanit } from '../_ortak/iyzico.ts';
import { cors, json, kullanici, odemeGuncelle, rpc, sb } from '../_ortak/supabase.ts';

// Testte ODEME_DONUS_ADRESI=http://localhost:8901 verilebilir; canlıda tanımlanmaz.
const DONUS = (Deno.env.get('ODEME_DONUS_ADRESI') ?? 'https://biyoser.com.tr').replace(/\/+$/, '');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Satir = {
  id: string; koc_id: string; paket: string; durum: string;
  token: string | null; hata: string | null; lisans_sonraki: string | null;
};
type Sonuc = { durum: 'basarili' | 'basarisiz' | 'bekliyor'; paket?: string; lisans_bitis?: string | null; hata?: string | null };

const PANEL_DURUMU: Record<string, Sonuc['durum']> = { odendi: 'basarili', basarisiz: 'basarisiz', bekliyor: 'bekliyor' };

/** Koçsuz öğrenci paketini öğrenci paneli satar, ötekileri koç paneli. */
function panele(odeme: string | null, durum: Sonuc['durum'], paket?: string): Response {
  const sayfa = paket === 'ogrenci' ? 'ogrenci-sunucu.html' : 'kocluk-sunucu.html';
  const q = new URLSearchParams(odeme ? { odeme, durum } : { durum });
  return new Response(null, { status: 303, headers: { Location: `${DONUS}/${sayfa}?${q}` } });
}

async function satirBul(filtre: string): Promise<Satir | null> {
  const r = await sb(`/rest/v1/odemeler?${filtre}&select=id,koc_id,paket,durum,token,hata,lisans_sonraki`, { method: 'GET' });
  if (!r.ok) throw new Error(`odemeler okunamadi http=${r.durum}`);
  return Array.isArray(r.veri) && r.veri.length ? r.veri[0] as Satir : null;
}

/** "bekliyor" satırın sonucunu iyzico'ya sorar, ödendiyse lisansı açar. */
async function isle(s: Satir): Promise<Sonuc> {
  let y: IyzicoYanit;
  try {
    y = await iyzico(CF_SORGULA, { locale: 'tr', conversationId: s.id, token: s.token });
  } catch {
    console.error(`odeme-bildirim ${s.id} iyzico'ya ulasilamadi`);
    return { durum: 'bekliyor' };
  }
  if (y.status !== 'success') {   // sorgunun kendisi başarısız: ödeme olmuş olabilir
    console.error(`odeme-bildirim ${s.id} sorgu basarisiz errorCode=${y.errorCode}`);
    return { durum: 'bekliyor' };
  }
  if (!(await imzaDogru(cfSonucImzaAlanlari(y), y.signature)) || y.basketId !== s.id) {
    console.error(`odeme-bildirim ${s.id} imza ya da sepet no tutmadi`);
    return { durum: 'bekliyor' };
  }
  if (y.paymentStatus === 'FAILURE' || y.fraudStatus === -1) {
    // Satır "bekliyor" kalır (aynı formda yeniden denenebilir), neden yazılır.
    const hata = y.errorMessage ? `iyzico: ${y.errorMessage}` : 'Ödeme reddedildi.';
    await odemeGuncelle(s.id, { hata });
    console.log(`odeme-bildirim ${s.id} reddedildi errorCode=${y.errorCode} fraudStatus=${y.fraudStatus}`);
    return { durum: 'basarisiz', paket: s.paket, hata };
  }
  // fraudStatus 0: iyzico incelemesinde; doküman "1 olmadan teslim etme" diyor.
  if (y.paymentStatus !== 'SUCCESS' || y.fraudStatus !== 1) {
    console.log(`odeme-bildirim ${s.id} bekliyor paymentStatus=${y.paymentStatus} fraudStatus=${y.fraudStatus}`);
    return { durum: 'bekliyor', paket: s.paket };
  }
  // Lisans açan yol: yanıt imzası ve sepet no (= bizim ödeme no) tutmalı.
  if (!(await imzaDogru(cfSonucImzaAlanlari(y), y.signature)) || y.basketId !== s.id) {
    console.error(`odeme-bildirim ${s.id} imza ya da sepet no tutmadi`);
    return { durum: 'bekliyor', paket: s.paket };
  }

  // Tutar (paidPrice) ve para birimi odeme_onayla'da kayıttakiyle karşılaştırılır;
  // tutmazsa satır "basarisiz" olur ve hata sütununa iyzico ödeme no yazılır.
  const r = await rpc('odeme_onayla', {
    p_odeme: s.id, p_saglayici_odeme_id: String(y.paymentId), p_tutar: y.paidPrice, p_para: y.currency,
  });
  if (!r.ok) {
    console.error(`odeme-bildirim ${s.id} odeme_onayla http=${r.durum}`);
    return { durum: 'bekliyor', paket: s.paket };
  }
  if (!r.veri?.ok) {
    console.error(`odeme-bildirim ${s.id} onaylanmadi, elle incele`);
    return { durum: 'basarisiz', paket: s.paket, hata: r.veri?.hata ?? null };
  }
  console.log(`odeme-bildirim ${s.id} odendi paket=${r.veri.paket} bitis=${r.veri.lisans_bitis}`);
  return { durum: 'basarili', paket: r.veri.paket, lisans_bitis: r.veri.lisans_bitis };
}

async function kontrol(req: Request, id: string): Promise<Response> {
  const c = cors(req);
  const kim = await kullanici(req.headers.get('Authorization'));
  if (!kim) return json({ ok: false, hata: 'Önce giriş yapmalısın.' }, 401, c);
  const s = UUID.test(id) ? await satirBul(`id=eq.${id}`) : null;
  if (!s || s.koc_id !== kim) return json({ ok: false, hata: 'Ödeme bulunamadı.' }, 404, c);
  if (s.durum !== 'bekliyor' || !s.token) {
    return json({
      ok: true, durum: PANEL_DURUMU[s.durum], paket: s.paket, lisans_bitis: s.lisans_sonraki, hata: s.hata,
    }, 200, c);
  }
  return json({ ok: true, paket: s.paket, ...(await isle(s)) }, 200, c);
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });

  const kontrolId = url.searchParams.get('kontrol');
  if (kontrolId !== null) {
    try {
      return await kontrol(req, kontrolId);
    } catch (e) {
      console.error(`odeme-bildirim kontrol hatasi: ${e instanceof Error ? e.message : 'bilinmiyor'}`);
      return json({ ok: false, hata: 'Şu an kontrol edilemedi. Birazdan yeniden dene.' }, 502, cors(req));
    }
  }

  // iyzico dönüşü
  let token = url.searchParams.get('token') ?? '';
  if (!token && req.method === 'POST') {
    try { token = String((await req.formData()).get('token') ?? ''); } catch { /* jetonsuz */ }
  }
  if (!token) return panele(null, 'basarisiz');

  try {
    const s = await satirBul(`token=eq.${encodeURIComponent(token)}`);
    if (!s) {
      console.error('odeme-bildirim bilinmeyen jeton');
      return panele(null, 'basarisiz');
    }
    if (s.durum !== 'bekliyor') return panele(s.id, PANEL_DURUMU[s.durum], s.paket);   // çift POST, geri tuşu
    return panele(s.id, (await isle(s)).durum, s.paket);
  } catch (e) {
    console.error(`odeme-bildirim donus hatasi: ${e instanceof Error ? e.message : 'bilinmiyor'}`);
    return panele(null, 'bekliyor');
  }
});
