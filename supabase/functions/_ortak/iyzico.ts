// iyzico istemcisi: IYZWSv2 imzalı JSON POST ve yanıt imzası doğrulama.
// SDK yok; yalnız fetch ve Web Crypto. Deno'da ve Node 22.18+'da aynen çalışır
// (Deno'ya yalnız iyzico() içinde dokunulur, sınama dosyası onu çağırmaz).
//
// Kaynaklar (2 Eki 2026'da okundu):
//   Kimlik doğrulama, IYZWSv2 / HMACSHA256:
//     https://docs.iyzico.com/on-hazirliklar/kimlik-dogrulama/hmacsha256-kimlik-dogrulama
//     https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth
//   Ödeme formu başlatma (CF-Initialize):
//     https://docs.iyzico.com/odeme-metotlari/odeme-formu/cf-entegrasyonu/cf-baslatma
//   Ödeme formu sorgulama (CF-Retrieve) ve callback davranışı:
//     https://docs.iyzico.com/odeme-metotlari/odeme-formu/cf-entegrasyonu/cf-sorgulama
//   Yanıt imzasının doğrulanması:
//     https://docs.iyzico.com/en/advanced/response-signature-validation
//   Resmî Node kitaplığı, aynı algoritma (generateHashV2, calculateHmacSHA256Signature):
//     https://github.com/iyzico/iyzipay-node/blob/master/lib/utils.js
//
// Sınama: deno run supabase/functions/_ortak/iyzico_sinama.ts
//     ya da node supabase/functions/_ortak/iyzico_sinama.ts

export const CF_BASLAT = '/payment/iyzipos/checkoutform/initialize/auth/ecom';
export const CF_SORGULA = '/payment/iyzipos/checkoutform/auth/ecom/detail';

// deno-lint-ignore no-explicit-any
export type IyzicoYanit = Record<string, any>;

const utf8 = new TextEncoder();

/** HMAC-SHA256, küçük harf hex. İstek imzası da yanıt imzası da bunu kullanır. */
export async function hmacHex(anahtar: string, veri: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    'raw', utf8.encode(anahtar), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const imza = new Uint8Array(await crypto.subtle.sign('HMAC', k, utf8.encode(veri)));
  return Array.from(imza, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** "IYZWSv2 " + base64("apiKey:" + apiKey + "&randomKey:" + rnd + "&signature:" + imzaHex) */
export function yetkiDizesi(apiKey: string, rnd: string, imzaHex: string): string {
  return 'IYZWSv2 ' + btoa(`apiKey:${apiKey}&randomKey:${rnd}&signature:${imzaHex}`);
}

/** imza = HMACSHA256(randomKey + uri.path + request.body, secretKey). Gövde, gönderilen metnin AYNISI olmalı. */
export async function yetkiBasligi(
  apiKey: string, secretKey: string, rnd: string, yol: string, govde: string,
): Promise<string> {
  return yetkiDizesi(apiKey, rnd, await hmacHex(secretKey, rnd + yol + govde));
}

function gizli(ad: string): string {
  const v = Deno.env.get(ad);
  if (!v) throw new Error(`${ad} tanımlı değil`);
  return v;
}

/**
 * iyzico'ya imzalı POST. Hata durumunda da iyzico JSON döner
 * (status: "failure", errorCode, errorMessage). Ağ hatası ve JSON olmayan
 * yanıt istisna fırlatır; çağıran bunu "sonuç belirsiz" sayar.
 */
export async function iyzico(yol: string, istek: Record<string, unknown>): Promise<IyzicoYanit> {
  const govde = JSON.stringify(istek);
  const rnd = `${Date.now()}${crypto.getRandomValues(new Uint32Array(1))[0]}`;
  const yanit = await fetch(gizli('IYZICO_BASE_URL').replace(/\/+$/, '') + yol, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-iyzi-rnd': rnd,
      Authorization: await yetkiBasligi(gizli('IYZICO_API_KEY'), gizli('IYZICO_SECRET_KEY'), rnd, yol, govde),
    },
    body: govde,
    signal: AbortSignal.timeout(20_000),
  });
  return await yanit.json();
}

/** Yanıt imzasında fiyatların sondaki sıfırları atılır: "10.50" -> "10.5", 449.0 -> "449". */
export const fiyatYazisi = (x: unknown): string => String(Number(x));

/** Alanlar ":" ile birleşir, HMACSHA256(secretKey), hex; yanıttaki signature ile aynı olmalı. */
export async function imzaDogru(
  alanlar: unknown[], imza: unknown, secretKey: string = gizli('IYZICO_SECRET_KEY'),
): Promise<boolean> {
  return typeof imza === 'string' && imza === await hmacHex(secretKey, alanlar.join(':'));
}

/** CF-Initialize yanıt imzası alanları: conversationId, token */
export const cfBaslatImzaAlanlari = (y: IyzicoYanit): unknown[] => [y.conversationId, y.token];

/** CF-Retrieve yanıt imzası alanları: paymentStatus, paymentId, currency, basketId, conversationId, paidPrice, price, token */
export const cfSonucImzaAlanlari = (y: IyzicoYanit): unknown[] => [
  y.paymentStatus, y.paymentId, y.currency, y.basketId, y.conversationId,
  fiyatYazisi(y.paidPrice), fiyatYazisi(y.price), y.token,
];
