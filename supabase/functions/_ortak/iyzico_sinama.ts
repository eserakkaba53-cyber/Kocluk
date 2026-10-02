// iyzico imza yardımcılarının öz sınaması. Ağ ve gizli anahtar gerekmez.
//   deno run supabase/functions/_ortak/iyzico_sinama.ts
//   node supabase/functions/_ortak/iyzico_sinama.ts        (Node 22.18+ / 24)
// Beklenen son satır: "iyzico imza sinamasi: TAMAM". Bir değer tutmazsa hata fırlatır.
import { fiyatYazisi, hmacHex, imzaDogru, yetkiBasligi, yetkiDizesi } from './iyzico.ts';

function esit(gelen: unknown, beklenen: unknown, ad: string) {
  if (gelen !== beklenen) throw new Error(`${ad}: ${gelen} !== ${beklenen}`);
}

// 1) HMAC-SHA256 hex: yanıt imzası sayfasındaki örnek (secretKey ve sonuç orada yazılı).
const DOK_GIZLI = 'sandbox-qaIiLIxhjMgx3LSKIVvp6j17NunHOFtD';
const DOK_IMZA = '836c3a6c8db86c81043f2ca74edb13518b54a813f454f8dd762f0dd658610173';
esit(await hmacHex(DOK_GIZLI, '22416032:TRY:basketId:conversationId:10.5:10.5'), DOK_IMZA, 'hmacHex');

// 2) Yanıt imzası: aynı örnek, fiyat "10.50" gelse de sondaki sıfır atılıp tutmalı.
esit(await imzaDogru([22416032, 'TRY', 'basketId', 'conversationId', fiyatYazisi('10.50'), fiyatYazisi(10.5)],
  DOK_IMZA, DOK_GIZLI), true, 'imzaDogru');
esit(await imzaDogru(['22416032', 'TRY', 'basketId', 'conversationId', '10.5', '10.6'],
  DOK_IMZA, DOK_GIZLI), false, 'imzaDogru (bozuk tutar)');

// 3) IYZWSv2 uçtan uca: resmî iyzipay-node birim sınaması (test/unit/UtilsTest.js).
//    Kitaplık gövdeyi JSON.stringify ile imzalar; "body" dizgesi tırnaklı imzalanır.
esit(await yetkiBasligi('api_key', 'secret_key', 'random_string', 'uri', JSON.stringify('body')),
  'IYZWSv2 YXBpS2V5OmFwaV9rZXkmcmFuZG9tS2V5OnJhbmRvbV9zdHJpbmcmc2lnbmF0dXJlOjAxNzUwODkyMWEyOWVlNTYwMWJjZDFmYmU4M2VmZDJlMmJlNDNhZjAyZWNlZmYzMGNmMmU5MWE1MzlhYWIzNTU=',
  'yetkiBasligi');

// 4) Başlığın birleştirme ve base64 adımı: kimlik doğrulama sayfasındaki iki örnek
//    (secretKey yayımlanmadığı için imzanın kendisi değil, başlığın kuruluşu sınanır).
esit(yetkiDizesi('sandbox-l9Md1Gj3IYcmu4NdaWxaSUoCoX7DC5RA', '123456789',
  '079df4b2426fc7f4208d8f22fbc0349794019f8ce2b0711de7808b4874f4e796'),
  'IYZWSv2 YXBpS2V5OnNhbmRib3gtbDlNZDFHajNJWWNtdTROZGFXeGFTVW9Db1g3REM1UkEmcmFuZG9tS2V5OjEyMzQ1Njc4OSZzaWduYXR1cmU6MDc5ZGY0YjI0MjZmYzdmNDIwOGQ4ZjIyZmJjMDM0OTc5NDAxOWY4Y2UyYjA3MTFkZTc4MDhiNDg3NGY0ZTc5Ng==',
  'yetkiDizesi (Bin Check örneği)');
esit(yetkiDizesi('sandbox-3uHv0LccjcWDyFHTvJpiACKPcJwbczmZ', '1722246017090123456789',
  '91e491486d3aa951b4f387cc93d67fc754c4729af95344b694435f56447819e9'),
  'IYZWSv2 YXBpS2V5OnNhbmRib3gtM3VIdjBMY2NqY1dEeUZIVHZKcGlBQ0tQY0p3YmN6bVomcmFuZG9tS2V5OjE3MjIyNDYwMTcwOTAxMjM0NTY3ODkmc2lnbmF0dXJlOjkxZTQ5MTQ4NmQzYWE5NTFiNGYzODdjYzkzZDY3ZmM3NTRjNDcyOWFmOTUzNDRiNjk0NDM1ZjU2NDQ3ODE5ZTk=',
  'yetkiDizesi (Postman örneği)');

// 5) Fiyat yazımı, sayfadaki "Trailing Zero" tablosu.
for (const [g, b] of [['10', '10'], ['10.0', '10'], ['10.5', '10.5'], ['10.50', '10.5'],
  ['10.510', '10.51'], ['10.5105', '10.5105'], ['10.51050', '10.5105']]) {
  esit(fiyatYazisi(g), b, `fiyatYazisi(${g})`);
}
esit(fiyatYazisi(449.0), '449', 'fiyatYazisi(449.0)');

console.log('iyzico imza sinamasi: TAMAM');
