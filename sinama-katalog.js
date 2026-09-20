/* Test katalogunun sayfalamasi.  node sinama-katalog.js
   PostgREST tek istekte en cok 1000 satir donuyor; katalogda 1032 test var.
   katalogCek() sayfa sayfa cekip hepsini toplamali, tekrar etmemeli,
   atlamamali ve bos yanitta durmali. Fonksiyon sayfadan cikarilip burada
   calistiriliyor, kod kopyalanmiyor. */

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var KOK = process.env.KOK || __dirname;
var sayfa = fs.readFileSync(path.join(KOK, 'test-katalogu.html'), 'utf8').split('\r\n').join('\n');

function govde(ad) {
  var i = sayfa.indexOf('\nfunction ' + ad + '(');
  assert.ok(i >= 0, ad + ' bulunamadi');
  var son = sayfa.indexOf('\n}\n', i);
  assert.ok(son > i, ad + ' sonu bulunamadi');
  return sayfa.slice(i + 1, son + 3);
}
function sabit(ad) {
  var i = sayfa.indexOf('\nvar ' + ad + ' =');
  assert.ok(i >= 0, ad + ' bulunamadi');
  return sayfa.slice(i + 1, sayfa.indexOf('\n', i + 1));
}

/* --- sunucu taklidi: kac satir varsa Range'e gore parca dondurur --- */
function kur(toplam, opts) {
  opts = opts || {};
  var istekler = [];
  var satirlar = [];
  for (var n = 0; n < toplam; n++) satirlar.push({ id: 's' + n, ad: 'Test ' + n });

  var kap = {
    console: console,
    AYAR: { url: 'https://ornek', key: 'anon' },
    JWT: 'jwt',
    oturumSil: function () {},
    Error: Error, isNaN: isNaN, parseInt: parseInt, Promise: Promise,
    fetch: function (u, o) {
      var r = /items?=?|/.test('') , araligi = o.headers.Range.split('-');
      var bas = +araligi[0], son = +araligi[1];
      istekler.push(bas + '-' + son);
      var parca = satirlar.slice(bas, son + 1);
      if (opts.bosDondur && istekler.length >= opts.bosDondur) parca = [];
      var crToplam = opts.toplamGizle ? '*' : String(toplam);
      return Promise.resolve({
        ok: true, status: 206,
        headers: { get: function () { return bas + '-' + (bas + parca.length - 1) + '/' + crToplam; } },
        json: function () { return Promise.resolve(parca); }
      });
    }
  };
  vm.createContext(kap);
  vm.runInContext(sabit('SAYFA_BOY'), kap);
  vm.runInContext(govde('katalogCek'), kap);
  return { kap: kap, istekler: istekler };
}

var kal = 0;
function bak(ad, kosul, ek) {
  if (kosul) { console.log('  [gecti] ' + ad); return; }
  kal++; console.log('  [KALDI] ' + ad + (ek !== undefined ? '  -> ' + JSON.stringify(ek) : ''));
}

function calistir(toplam, opts) {
  var o = kur(toplam, opts);
  return vm.runInContext('katalogCek()', o.kap).then(function (g) {
    return { sonuc: g, istekler: o.istekler };
  });
}

(async function () {
  console.log('1) 1032 kayit: hepsi gelir, tekrar yok');
  var a = await calistir(1032);
  bak('1032 satir geldi', a.sonuc.length === 1032, a.sonuc.length);
  bak('iki istek atildi', a.istekler.length === 2, a.istekler);
  bak('aralıklar dogru', a.istekler.join(',') === '0-999,1000-1999', a.istekler);
  var kimlik = {}, tekrar = 0;
  a.sonuc.forEach(function (x) { if (kimlik[x.id]) tekrar++; kimlik[x.id] = 1; });
  bak('tekrar eden kayit yok', tekrar === 0, tekrar);
  bak('sonuncu kayit yerinde', a.sonuc[1031].id === 's1031', a.sonuc[1031]);

  console.log('2) Tam 1000 kayit: fazladan istek atilmaz');
  var b = await calistir(1000);
  bak('1000 satir', b.sonuc.length === 1000, b.sonuc.length);
  bak('tek istek', b.istekler.length === 1, b.istekler);

  console.log('3) Bos katalog');
  var c = await calistir(0);
  bak('0 satir', c.sonuc.length === 0);
  bak('tek istek', c.istekler.length === 1, c.istekler);

  console.log('4) Toplam okunamazsa bos parcada durur (sonsuz dongu olmaz)');
  var d = await calistir(2500, { toplamGizle: true, bosDondur: 4 });
  bak('istek sayisi sinirli', d.istekler.length <= 4, d.istekler.length);

  console.log('5) Siralama id ile kesinlestirildi');
  bak('order icinde id.asc var', sayfa.indexOf('order=unite.asc,konu.asc,ad.asc,id.asc') > 0);

  console.log('');
  console.log(kal ? ('BASARISIZ — ' + kal + ' denetim kaldi') : 'TAMAM — sayfalama butun kayitlari topluyor');
  process.exit(kal ? 1 : 0);
})();
