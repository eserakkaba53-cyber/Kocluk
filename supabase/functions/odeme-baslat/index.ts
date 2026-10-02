// odeme-baslat: panel paket seçince çağırır, iyzico ortak ödeme sayfasının adresini döner.
// Dağıtım (JWT doğrulamalı): npx supabase functions deploy odeme-baslat --project-ref hdcxmunvkxkffnsewfgp
//
// İstek:  POST { "paket": "koc" }   Authorization: Bearer <koçun oturum JWT'si>
// Yanıt:  { ok: true, url, odeme_id }  ya da  { ok: false, hata }
//
// Tutarı istemci göndermez: odeme_hazirla (SQL) koçun JWT'siyle çağrılır, ödeyeni
// auth.uid(), tutarı paket_fiyat belirler. Geçersiz ya da süresi dolmuş JWT'yi
// PostgREST reddeder; bu yüzden ağ geçidinin JWT denetimi kapatılsa da (yeni
// anahtarlara geçişte gerekecek) kimse başkası adına ödeme açamaz.
import { cfBaslatImzaAlanlari, CF_BASLAT, imzaDogru, iyzico, type IyzicoYanit } from '../_ortak/iyzico.ts';
import { cors, json, odemeGuncelle, ortam, rpc, sb } from '../_ortak/supabase.ts';

// iyzico alıcıdan kimlik no, telefon ve adres ister. Biyoser bunları toplamıyor
// (dijital hizmet, kargo yok). Aşağıdaki yer tutucular CANLIYA GEÇMEDEN iyzico'ya
// onaylatılmalı (OKU-odeme.md, açık sorular).
const KIMLIK_YER_TUTUCU = '11111111111';   // GİB'in kimlik no vermeyen bireysel alıcı için kabul ettiği değer
const GSM_YER_TUTUCU = '+905000000000';    // koçun telefonu yoksa ya da cep numarası değilse
const ADRES_YER_TUTUCU = 'Dijital hizmet, adres alınmadı';
const SEHIR_YER_TUTUCU = 'Istanbul';
const ULKE = 'Turkey';
const SOYAD_YER_TUTUCU = '-';              // ad tek kelimeyse

type Hazirlik = {
  odeme_id: string; koc_id: string; paket: string; paket_adi: string;
  tutar: string; eposta: string | null; ad: string | null; telefon: string | null;
};

function gsm(tel: string | null): string {
  let d = (tel ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('90')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^5\d{9}$/.test(d) ? `+90${d}` : GSM_YER_TUTUCU;
}

Deno.serve(async (req: Request) => {
  const c = cors(req);
  try {
    return await baslat(req, c);
  } catch (e) {   // ağ ya da eksik ortam değişkeni: yanıt yine CORS başlıklı ve Türkçe olsun
    console.error(`odeme-baslat beklenmeyen hata: ${e instanceof Error ? e.message : 'bilinmiyor'}`);
    return json({ ok: false, hata: 'Ödeme sayfası açılamadı. Birazdan yeniden dene.' }, 502, c);
  }
});

async function baslat(req: Request, c: Record<string, string>): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: c });
  if (req.method !== 'POST') return json({ ok: false, hata: 'Yalnız POST.' }, 405, c);
  const yetki = req.headers.get('Authorization');
  if (!yetki?.startsWith('Bearer ')) return json({ ok: false, hata: 'Önce giriş yapmalısın.' }, 401, c);

  let paket = '';
  try { paket = String((await req.json())?.paket ?? ''); } catch { /* boş paket SQL'de reddedilir */ }

  // 1) Ödeme kaydı ve tutar: sunucuda, koçun kendi yetkisiyle.
  const h = await rpc('odeme_hazirla', { p_paket: paket }, yetki);
  if (!h.ok) {
    console.error(`odeme-baslat odeme_hazirla http=${h.durum}`);
    return h.durum === 401
      ? json({ ok: false, hata: 'Oturumun sona ermiş. Yeniden giriş yap.' }, 401, c)
      : json({ ok: false, hata: 'Ödeme hazırlanamadı. Birazdan yeniden dene.' }, 502, c);
  }
  if (!h.veri?.ok) return json({ ok: false, hata: h.veri?.hata ?? 'Ödeme hazırlanamadı.' }, 400, c);
  const o = h.veri as Hazirlik;
  if (!/^\d+\.\d{2}$/.test(o.tutar)) {   // savunma: tutar SQL'den "449.00" biçiminde gelir
    console.error(`odeme-baslat ${o.odeme_id} tutar bicimi bozuk`);
    return json({ ok: false, hata: 'Ödeme hazırlanamadı.' }, 500, c);
  }

  // 2) iyzico ödeme formu (CF-Initialize).
  const adSoyad = (o.ad ?? '').trim().replace(/\s+/g, ' ') || 'Biyoser Kullanıcısı';
  const bosluk = adSoyad.lastIndexOf(' ');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const adres = { contactName: adSoyad, city: SEHIR_YER_TUTUCU, country: ULKE, address: ADRES_YER_TUTUCU };
  const istek = {
    locale: 'tr',
    conversationId: o.odeme_id,
    basketId: o.odeme_id,
    price: o.tutar,
    paidPrice: o.tutar,
    currency: 'TRY',
    // PRODUCT: tek seferlik ürün/hizmet satışı, iyzico'nun varsayılanı. SUBSCRIPTION
    // abonelik ücretleri (yinelenen tahsilat) içindir; burada ödeme bir kez alınır,
    // kart saklanmaz, yenileme yok. LISTING ilan ücretleri içindir.
    paymentGroup: 'PRODUCT',
    enabledInstallments: [1],
    callbackUrl: `${ortam('SUPABASE_URL')}/functions/v1/odeme-bildirim`,
    buyer: {
      id: o.koc_id,
      name: bosluk > 0 ? adSoyad.slice(0, bosluk) : adSoyad,
      surname: bosluk > 0 ? adSoyad.slice(bosluk + 1) : SOYAD_YER_TUTUCU,
      identityNumber: KIMLIK_YER_TUTUCU,
      email: o.eposta,
      gsmNumber: gsm(o.telefon),
      registrationAddress: ADRES_YER_TUTUCU,
      city: SEHIR_YER_TUTUCU,
      country: ULKE,
      ...(ip ? { ip } : {}),
    },
    // Tüm kalemler VIRTUAL olunca teslimat adresi zorunlu değil; şemada yine
    // "required" yazdığı için fatura adresinin aynısı gönderilir.
    shippingAddress: adres,
    billingAddress: adres,
    basketItems: [{
      id: o.paket,
      name: `Biyoser ${o.paket_adi} (1 yıl)`,
      category1: 'Yazılım',
      itemType: 'VIRTUAL',
      price: o.tutar,
    }],
  };

  let y: IyzicoYanit;
  try {
    y = await iyzico(CF_BASLAT, istek);
  } catch {
    console.error(`odeme-baslat ${o.odeme_id} iyzico'ya ulasilamadi`);
    await odemeGuncelle(o.odeme_id, { hata: 'iyzico başlatma: bağlantı kurulamadı' });
    return json({ ok: false, hata: 'Ödeme sayfası açılamadı. Birazdan yeniden dene.' }, 502, c);
  }
  if (y.status !== 'success' || !y.token || !y.paymentPageUrl) {
    console.error(`odeme-baslat ${o.odeme_id} iyzico reddetti errorCode=${y.errorCode}`);
    await odemeGuncelle(o.odeme_id, { hata: `iyzico başlatma: ${y.errorMessage ?? y.errorCode ?? 'bilinmeyen hata'}` });
    return json({ ok: false, hata: 'Ödeme sayfası açılamadı. Birazdan yeniden dene.' }, 502, c);
  }
  if (!(await imzaDogru(cfBaslatImzaAlanlari(y), y.signature)) || y.conversationId !== o.odeme_id) {
    console.error(`odeme-baslat ${o.odeme_id} iyzico yanit imzasi tutmadi`);
    return json({ ok: false, hata: 'Ödeme sayfası açılamadı.' }, 502, c);
  }

  // 3) Jeton satıra yazılmadan adres verilmez: dönüşte satır jetonla bulunur.
  const t = await sb(`/rest/v1/odemeler?id=eq.${o.odeme_id}`, {
    method: 'PATCH', govde: { token: y.token }, basliklar: { Prefer: 'return=minimal' },
  });
  if (!t.ok) {
    console.error(`odeme-baslat ${o.odeme_id} token yazilamadi http=${t.durum}`);
    return json({ ok: false, hata: 'Ödeme sayfası açılamadı. Birazdan yeniden dene.' }, 502, c);
  }

  console.log(`odeme-baslat ${o.odeme_id} hazir paket=${o.paket}`);
  return json({ ok: true, url: y.paymentPageUrl, odeme_id: o.odeme_id }, 200, c);
}
