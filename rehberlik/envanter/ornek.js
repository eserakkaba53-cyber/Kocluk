/* Uçtan uca sınama ve gösterim.  node ornek.js
   Üç örnek öğrenci profili üretip beş envanteri doldurur, bölüm önerisini basar.
   Amaç: gerçek veri dosyalarıyla zincirin çalıştığını ve önerinin profile
   uyduğunu görmek.  Sonuç saçmalarsa ağırlıklar ya da veri yanlıştır. */

var assert = require('assert');
require('./veri/kisilik.js');
require('./veri/ilgi.js');
require('./veri/degerler.js');
require('./veri/beceri.js');
require('./veri/yetenek.js');
require('./veri/bolumler.js');
require('./puanlama.js');

var ENV = {
  kisilik: global.ENV_KISILIK, ilgi: global.ENV_ILGI, deger: global.ENV_DEGER,
  beceri: global.ENV_BECERI, yetenek: global.ENV_YETENEK
};

/* Bir arketipten cevap üretir.  yuksek listesindeki boyutlara 5, ötekilere 3
   verir; ters maddede tersini yapar ki profil bozulmasın.  Ötekilere 2 vermek
   gerçekçi değildi: kimse beş kişilik boyutunun üçünden sıfır almaz. */
function likertDoldur(env, yuksek) {
  var c = {};
  env.maddeler.forEach(function (m) {
    var hedef = yuksek.indexOf(m.b) >= 0 ? 5 : 3;
    c[m.n] = m.t ? 6 - hedef : hedef;
  });
  return c;
}

/* Yetenek: güçlü alanda sekiz sorunun sekizi doğru, zayıf alanda ikisi doğru. */
function yetenekDoldur(env, guclu) {
  var c = {}, sayac = {};
  env.maddeler.forEach(function (m) {
    sayac[m.b] = (sayac[m.b] || 0) + 1;
    var dogruYap = guclu.indexOf(m.b) >= 0 ? true : sayac[m.b] <= 2;
    c[m.n] = dogruYap ? m.d : (m.d + 1) % 5;
  });
  return c;
}

/* Değer sıralaması: tercih edilen değerler başa, kalanlar sabit sırayla arkaya. */
function degerDoldur(env, tercih) {
  var hepsi = env.boyutlar.map(function (b) { return b.k; });
  var sira = tercih.concat(hepsi.filter(function (k) { return tercih.indexOf(k) < 0; }));
  var c = {};
  env.turlar.forEach(function (t) { c[t.n] = sira.slice(); });
  return c;
}

var ARKETIPLER = [
  { ad: 'Sayısal ve teknik eğilimli öğrenci',
    ilgi: ['I', 'R'], kisilik: ['S', 'A'], beceri: ['SAY', 'TEK', 'DIJ'],
    yetenek: ['SAY', 'MAN', 'UZM'], deger: ['BAS', 'BAG'] },
  { ad: 'Sözel ve sosyal eğilimli öğrenci',
    ilgi: ['S', 'E'], kisilik: ['D', 'U'], beceri: ['SOZ', 'LID'],
    yetenek: ['SOZ', 'VER'], deger: ['ILI', 'GUV'] },
  { ad: 'Sanatsal ve tasarım eğilimli öğrenci',
    ilgi: ['A', 'I'], kisilik: ['A', 'D'], beceri: ['TAS', 'SOZ'],
    yetenek: ['UZM', 'SOZ'], deger: ['BAG', 'TAN'] }
];

ARKETIPLER.forEach(function (a) {
  var profil = global.PUANLAMA.profilCikar(ENV, {
    kisilik: likertDoldur(ENV.kisilik, a.kisilik),
    ilgi: likertDoldur(ENV.ilgi, a.ilgi),
    beceri: likertDoldur(ENV.beceri, a.beceri),
    yetenek: yetenekDoldur(ENV.yetenek, a.yetenek),
    deger: degerDoldur(ENV.deger, a.deger)
  });

  assert.strictEqual(profil.eksikEnvanter.length, 0, 'envanterin biri işlenmedi');
  assert.ok(profil.hollandKodu.length === 3, 'Holland kodu üç harf olmalı');

  var oneri = global.PUANLAMA.bolumOner(global.ENV_BOLUMLER, profil, 8, 3);

  console.log('\n=== ' + a.ad + ' ===');
  console.log('Holland kodu: ' + profil.hollandKodu + '  (tutarlılık ' + profil.tutarlilik + '/3)');
  console.log('Yetenek: ' + Object.keys(profil.yetenek).map(function (k) {
    return k + ' ' + profil.yetenek[k];
  }).join('  '));
  console.log('Yetenek testi: ' + profil.ham.yetenek.dogru + '/' + profil.ham.yetenek.soru + ' doğru');
  oneri.liste.forEach(function (b, i) {
    console.log('  ' + String(i + 1).padStart(2) + '. ' + String(b.uyum).padStart(3) + '  ' +
      b.puan.padEnd(4) + ' ' + b.holland + '  ' + b.ad);
  });
  oneri.liste.forEach(function (b) {
    b.gerekce.notlar.forEach(function (n) { console.log('  [' + b.ad + '] ' + n); });
  });

  /* Öneri profile uymalı: ilk sıradaki bölümün Holland kodunun ilk harfi
     öğrencinin ilk iki tipinden biri olmalı. */
  var ilk = oneri.liste[0];
  assert.ok(profil.hollandKodu.slice(0, 2).indexOf(ilk.holland[0]) >= 0,
    a.ad + ' için ilk öneri profile uymuyor: ' + ilk.ad + ' (' + ilk.holland + ')');
});

/* Hiç envanter doldurulmadığında çökmemeli, hepsi 50 sayılmalı. */
var bos = global.PUANLAMA.profilCikar(ENV, {});
assert.strictEqual(bos.eksikEnvanter.length, 5);
assert.strictEqual(global.PUANLAMA.bolumOner(global.ENV_BOLUMLER, bos, 5).liste.length, 5);

console.log('\nuçtan uca sınama geçti.');
