/* Misafir kipinin yerel deposu.  node sinama-misafir.js
   Kayit olmadan verilen cevaplar tarayicida saklaniyor ve sayfa tazelenince
   geri geliyor mu? Fonksiyonlar uygulama.js'ten cikarilip burada calistiriliyor,
   boylece kod kopyalanmiyor ve sinama gercek kodu olcuyor. */

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var KOK = process.env.KOK || __dirname;
var src = fs.readFileSync(path.join(KOK, 'uygulama.js'), 'utf8').split('\r\n').join('\n');

/* Ust duzey tanimlar IIFE icinde ama sutun 0'da; "\nfunction ad(" ile bulunup
   sutun 0'daki "}" ile bitiriliyor. */
function govde(ad) {
  var i = src.indexOf('\nfunction ' + ad + '(');
  assert.ok(i >= 0, ad + ' bulunamadi');
  var son = src.indexOf('\n}\n', i);
  assert.ok(son > i, ad + ' sonu bulunamadi');
  return src.slice(i + 1, son + 3);
}
/* Tek satirlik sabit. Satir sonuna kadar alinir: satirin sonunda yorum
   olabiliyor (var X = false;  /* aciklama *(/) ve ";\n" arayan bir surum
   sonraki fonksiyonun ortasina kadar yutuyordu. */
function sabit(ad) {
  var i = src.indexOf('\nvar ' + ad + ' =');
  assert.ok(i >= 0, ad + ' bulunamadi');
  var son = src.indexOf('\n', i + 1);
  return src.slice(i + 1, son);
}

/* --- tarayici taklidi --- */
var depo = {};
var kap = {
  console: console,
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(depo, k) ? depo[k] : null; },
    setItem: function (k, v) { depo[k] = String(v); },
    removeItem: function (k) { delete depo[k]; }
  },
  JSON: JSON,
  Object: Object,
  D: { cevaplar: {}, bitti: {}, yetenek_baslangic: null },
  ENVANTERLER: [{ k: 'kisilik' }, { k: 'ilgi' }, { k: 'deger' }, { k: 'beceri' }, { k: 'yetenek' }]
};
vm.createContext(kap);
[sabit('MISAFIR_ANAHTAR'), sabit('MISAFIR_YAZILAMIYOR'),
 govde('paketle'), govde('yukle'),
 govde('misafirYaz'), govde('misafirOku'), govde('misafirSil'), govde('misafirDolu')]
  .forEach(function (k) { vm.runInContext(k, kap); });

var kal = 0;
function bak(ad, kosul, ek) {
  if (kosul) { console.log('  [gecti] ' + ad); return; }
  kal++; console.log('  [KALDI] ' + ad + (ek !== undefined ? '  -> ' + JSON.stringify(ek) : ''));
}

console.log('1) Bos baslangicta depo bos sayilir');
bak('misafirDolu false', vm.runInContext('misafirDolu()', kap) === false);

console.log('2) Verilen cevap tarayiciya yaziliyor');
vm.runInContext("D.cevaplar = { kisilik: { 1: 3, 2: 5 }, ilgi: {}, deger: {}, beceri: {}, yetenek: {} };" +
                "D.bitti = {}; D.yetenek_baslangic = null; misafirYaz();", kap);
bak('depoya yazildi', Object.keys(depo).length === 1);
bak('misafirDolu true', vm.runInContext('misafirDolu()', kap) === true);

console.log('3) Sayfa tazelenince cevaplar geri geliyor');
vm.runInContext("D.cevaplar = {}; D.bitti = {}; yukle(misafirOku() || {});", kap);
bak('kisilik 2 cevap', vm.runInContext('Object.keys(D.cevaplar.kisilik).length', kap) === 2);
bak('1. madde degeri 3', vm.runInContext('D.cevaplar.kisilik[1]', kap) === 3);
bak('bes anahtar da kuruldu', vm.runInContext('Object.keys(D.cevaplar).length', kap) === 5,
    vm.runInContext('Object.keys(D.cevaplar)', kap));

console.log('4) Yetenek sayaci da saklaniyor');
vm.runInContext("D.yetenek_baslangic = '2026-09-20T10:00:00.000Z'; misafirYaz();" +
                "D.yetenek_baslangic = null; yukle(misafirOku());", kap);
bak('sayac geri geldi', vm.runInContext('D.yetenek_baslangic', kap) === '2026-09-20T10:00:00.000Z');

console.log('5) Tek madde yokken bile sayac doluluk sayilir');
depo = {};
vm.runInContext("D.cevaplar = { kisilik: {}, ilgi: {}, deger: {}, beceri: {}, yetenek: {} };" +
                "D.bitti = {}; D.yetenek_baslangic = '2026-09-20T10:00:00.000Z'; misafirYaz();", kap);
bak('yalniz sayacla dolu', vm.runInContext('misafirDolu()', kap) === true);

console.log('6) Silme gercekten siliyor');
vm.runInContext('misafirSil()', kap);
bak('depo bos', Object.keys(depo).length === 0);
bak('misafirDolu false', vm.runInContext('misafirDolu()', kap) === false);

console.log('');
console.log(kal ? ('BASARISIZ — ' + kal + ' denetim kaldi') : 'TAMAM — misafir deposu yaziyor, geri yukluyor ve siliyor');
process.exit(kal ? 1 : 0);
