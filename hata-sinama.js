/* node hata-sinama.js
   hata.js'i ağa çıkmadan sınar: maskeleme, gürültü filtreleri, sayfa
   başına 5 kayıt ve aynı hatanın bir kez gönderilmesi. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const giden = [], dinleyici = {};
const ctx = {
  location: { pathname: '/kocluk-sunucu.html' },
  navigator: { userAgent: 'Deneme Tarayıcı' },
  addEventListener: (ad, f) => { dinleyici[ad] = f; },
  fetch: (u, a) => { giden.push(JSON.parse(a.body)); return Promise.resolve({}); },
  JSON, String, Promise
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/hata.js', 'utf8'), ctx);
const hata = (message, filename, stack) =>
  dinleyici.error({ message, filename: filename || 'https://biyoser.com.tr/kocluk-sunucu.html', lineno: 12, colno: 3,
                    error: stack ? { stack } : null });
const ret = r => dinleyici.unhandledrejection({ reason: r });

hata('x is not defined ali@ornek.com', '', 'at f (https://biyoser.com.tr/a.js?access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdef)');
assert.strictEqual(giden.length, 1);
assert.strictEqual(giden[0].p_sayfa, '/kocluk-sunucu.html');
assert.strictEqual(giden[0].p_kaynak, '/kocluk-sunucu.html:12:3', 'kaynakta alan adı yok');
assert.match(giden[0].p_mesaj, /\[e-posta\]/);
assert.ok(!/ali@ornek/.test(JSON.stringify(giden[0])), 'e-posta gitmez');
assert.ok(!/eyJ/.test(giden[0].p_yigin), 'jeton gitmez');

hata('x is not defined ali@ornek.com');                       // aynı hata ikinci kez gitmez
hata('Script error.');                                         // ayrıntısız
hata('boom', 'chrome-extension://abc/inject.js');              // eklenti
ret(new TypeError('Failed to fetch'));                         // ağ kopması
ret({ name: 'AbortError', message: 'The user aborted a request.' });
assert.strictEqual(giden.length, 1, 'gürültü atlanır');

ret(new Error('Kayıt bulunamadı'));
assert.strictEqual(giden[1].p_mesaj, 'Yakalanmamış: Kayıt bulunamadı');
for (let i = 0; i < 10; i++) hata('hata ' + i);
assert.strictEqual(giden.length, 5, 'sayfa başına en çok 5 kayıt');
console.log('hata.js: 11 denetim geçti');
