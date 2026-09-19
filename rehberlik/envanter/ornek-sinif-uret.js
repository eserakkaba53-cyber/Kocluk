/* Örnek sınıfı üretir.  node ornek-sinif-uret.js  →  ornek-sinif.sql
   Rehber öğretmen ve yönetici panele ilk girdiğinde boş tablo görmesin,
   sistemin ne gösterdiğini gerçek verilerle anlasın diye.
   Rastgelelik tohumlu: aynı betik hep aynı sınıfı üretir. */

require('./veri/kisilik.js');
require('./veri/ilgi.js');
require('./veri/degerler.js');
require('./veri/beceri.js');
require('./veri/yetenek.js');

var fs = require('fs');

/* Tohumlu üreteç. Math.random kullanılsaydı her çalıştırmada başka bir
   sınıf çıkar, sql dosyası boşuna değişirdi. */
var tohum = 20260919;
function rast() {
  tohum = (tohum * 1103515245 + 12345) % 2147483648;
  return tohum / 2147483648;
}
function arasinda(a, b) { return a + Math.floor(rast() * (b - a + 1)); }
function sec(dizi) { return dizi[Math.floor(rast() * dizi.length)]; }

/* Sekiz eğilim. Her öğrenci birine oturuyor, üstüne gürültü biniyor,
   böylece sınıf tek tip çıkmıyor. */
var EGILIMLER = [
  { ad: 'sayisal',  ilgi: ['I', 'R'], kisilik: ['S', 'A'],  beceri: ['SAY', 'DIJ'], yetenek: ['SAY', 'MAN'] },
  { ad: 'saglik',   ilgi: ['I', 'S'], kisilik: ['S', 'U'],  beceri: ['SAY', 'SOZ'], yetenek: ['SAY', 'VER'] },
  { ad: 'sozel',    ilgi: ['A', 'S'], kisilik: ['A', 'U'],  beceri: ['SOZ', 'TAS'], yetenek: ['SOZ', 'VER'] },
  { ad: 'sosyal',   ilgi: ['S', 'E'], kisilik: ['D', 'U'],  beceri: ['SOZ', 'LID'], yetenek: ['SOZ', 'MAN'] },
  { ad: 'girisim',  ilgi: ['E', 'C'], kisilik: ['D', 'S'],  beceri: ['LID', 'SAY'], yetenek: ['VER', 'MAN'] },
  { ad: 'tasarim',  ilgi: ['A', 'R'], kisilik: ['A', 'DD'], beceri: ['TAS', 'TEK'], yetenek: ['UZM', 'SOZ'] },
  { ad: 'teknik',   ilgi: ['R', 'C'], kisilik: ['S', 'DD'], beceri: ['TEK', 'DIJ'], yetenek: ['UZM', 'SAY'] },
  { ad: 'duzen',    ilgi: ['C', 'I'], kisilik: ['S', 'U'],  beceri: ['SAY', 'DIJ'], yetenek: ['VER', 'MAN'] }
];

var ADLAR = [
  ['Elif', 'Yalçın'], ['Mert', 'Kaya'], ['Zeynep', 'Aydın'], ['Kerem', 'Doğan'],
  ['Azra', 'Çelik'], ['Barış', 'Şahin'], ['Nisa', 'Korkmaz'], ['Emir', 'Yıldız'],
  ['Defne', 'Arslan'], ['Ali', 'Polat'], ['İrem', 'Koç'], ['Yusuf', 'Erdem'],
  ['Selin', 'Tunç'], ['Kaan', 'Bulut'], ['Ece', 'Sarı'], ['Poyraz', 'Güneş'],
  ['Melis', 'Aksoy'], ['Deniz', 'Ertaş']
];

function likertCevap(env, yuksek) {
  var c = {};
  env.maddeler.forEach(function (m) {
    var taban = yuksek.indexOf(m.b) >= 0 ? 4 : 2;
    var v = Math.max(1, Math.min(5, taban + arasinda(0, 1)));
    c[m.n] = m.t ? 6 - v : v;
  });
  return c;
}

function degerCevap(sirali) {
  var c = {};
  window_ENV_DEGER().turlar.forEach(function (t) {
    var s = sirali.slice();
    /* İki komşuyu yer değiştirerek turlar arasında küçük oynama bırakıyoruz,
       gerçek öğrenci de her turda birebir aynı sırayı vermiyor. */
    if (rast() < 0.5) {
      var i = arasinda(0, 4);
      var g = s[i]; s[i] = s[i + 1]; s[i + 1] = g;
    }
    c[t.n] = s;
  });
  return c;
}
function window_ENV_DEGER() { return global.ENV_DEGER; }

function yetenekCevap(guclu) {
  var c = {}, sayac = {};
  global.ENV_YETENEK.maddeler.forEach(function (m) {
    sayac[m.b] = (sayac[m.b] || 0) + 1;
    var tavan = guclu.indexOf(m.b) >= 0 ? arasinda(5, 8) : arasinda(1, 4);
    c[m.n] = sayac[m.b] <= tavan ? m.d : (m.d + 1) % 5;
  });
  return c;
}

var DEGER_SIRALARI = [
  ['BAS', 'BAG', 'TAN', 'KOS', 'GUV', 'ILI'],
  ['ILI', 'GUV', 'BAS', 'KOS', 'TAN', 'BAG'],
  ['KOS', 'GUV', 'ILI', 'BAS', 'BAG', 'TAN'],
  ['TAN', 'BAS', 'BAG', 'KOS', 'ILI', 'GUV'],
  ['BAG', 'BAS', 'KOS', 'TAN', 'ILI', 'GUV']
];

function q(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }

var uretilen = [];
var satirlar = [];
satirlar.push('-- Örnek sınıf. ornek-sinif-uret.js tarafından üretildi, elle düzenleme.');
satirlar.push('-- kurulum.sql çalıştırıldıktan SONRA bir kez çalıştır.');
satirlar.push('-- Bu öğrencilerin giriş hesabı yoktur, yalnız panelde görünürler.');
satirlar.push('');
satirlar.push('do $$');
satirlar.push('declare');
satirlar.push('  ok uuid;');
satirlar.push('  og uuid;');
satirlar.push('begin');
satirlar.push("  select id into ok from reh_okullar where demo limit 1;");
satirlar.push('  if not found then');
satirlar.push("    raise exception 'Örnek okul yok. Önce kurulum.sql çalıştırılmalı.';");
satirlar.push('  end if;');
satirlar.push('');
satirlar.push('  -- Tekrar çalıştırılırsa eski örnek öğrenciler temizlenir.');
satirlar.push('  delete from reh_profiller where demo and okul_id = ok;');
satirlar.push('');

ADLAR.forEach(function (ad, i) {
  var e = EGILIMLER[i % EGILIMLER.length];
  var okulNo = String(101 + i);

  /* Sınıfın üçte biri eksik bırakıyor: panel gerçekte de böyle görünecek. */
  var durum = i % 6 === 2 ? 'yarim' : (i % 6 === 5 ? 'baslamadi' : 'tam');

  var cevaplar = { bitti: {} };

  if (durum !== 'baslamadi') {
    cevaplar.kisilik = likertCevap(global.ENV_KISILIK, e.kisilik);
    cevaplar.ilgi    = likertCevap(global.ENV_ILGI, e.ilgi);
    cevaplar.beceri  = likertCevap(global.ENV_BECERI, e.beceri);
    cevaplar.deger   = degerCevap(sec(DEGER_SIRALARI));
    cevaplar.bitti.kisilik = true;
    cevaplar.bitti.ilgi = true;
    cevaplar.bitti.beceri = true;
    cevaplar.bitti.deger = true;
  }

  if (durum === 'tam') {
    cevaplar.yetenek = yetenekCevap(e.yetenek);
    cevaplar.bitti.yetenek = true;
  } else if (durum === 'yarim') {
    /* Yetenek testine başlamış, on soruda kalmış. */
    var y = {};
    global.ENV_YETENEK.maddeler.slice(0, arasinda(6, 14)).forEach(function (m) {
      y[m.n] = rast() < 0.6 ? m.d : (m.d + 1) % 5;
    });
    cevaplar.yetenek = y;
    delete cevaplar.bitti.deger;
  }

  uretilen.push({ ad: ad[0] + ' ' + ad[1],
    cevaplar: durum === 'baslamadi' ? null : cevaplar });

  satirlar.push('  insert into reh_profiller (rol, ad_soyad, okul_id, sinif, sube, okul_no, onayli, demo)');
  satirlar.push("  values ('ogrenci', " + q(ad[0] + ' ' + ad[1]) + ', ok, 11, ' + q('A') +
    ', ' + q(okulNo) + ', true, true) returning id into og;');

  if (durum === 'baslamadi') {
    satirlar.push('  -- ' + ad[0] + ' henüz hiçbir envantere başlamadı.');
  } else {
    satirlar.push('  insert into reh_envanter_yanitlari (ogrenci_id, cevaplar, guncellendi)');
    satirlar.push('  values (og, ' + q(JSON.stringify(cevaplar)) + "::jsonb, now() - interval '" +
      arasinda(1, 20) + " days');");
  }
  satirlar.push('');
});

satirlar.push('end $$;');
satirlar.push('');
satirlar.push("notify pgrst, 'reload schema';");

fs.writeFileSync('ornek-sinif.sql', satirlar.join('\n') + '\n', 'utf8');

/* Aynı sınıf deneme kipi için JavaScript olarak da yazılıyor. Tek üreteç,
   iki çıktı: SQL ile JS arasında veri farkı oluşmasın. */
fs.writeFileSync('veri/ornek-sinif.js',
  '/* Örnek sınıf. ornek-sinif-uret.js tarafından üretildi, elle düzenleme.\n' +
  '   Yalnız deneme kipinde kullanılır, Supabase kurulunca bu dosya okunmaz. */\n\n' +
  "var KOK = (typeof window !== 'undefined') ? window : global;\n\n" +
  'KOK.ORNEK_SINIF = ' + JSON.stringify(uretilen.map(function (o, i) {
    return {
      ogrenci_id: 'ornek-' + (101 + i),
      ad_soyad: o.ad, sinif: 11, sube: 'A', okul_no: String(101 + i),
      demo: true, cevaplar: o.cevaplar || {}, guncellendi: o.cevaplar ? true : null
    };
  }), null, 1) + ';\n', 'utf8');

var boyut = fs.statSync('ornek-sinif.sql').size;
console.log('ornek-sinif.sql yazıldı: ' + ADLAR.length + ' öğrenci, ' +
  Math.round(boyut / 1024) + ' KB\n');

/* Sınama: üretilen sınıf gerçekten çeşitli mi. Örnek sınıfta herkes aynı
   bölüme düşerse rehber öğretmene gösterecek bir şey kalmaz. */
require('./veri/bolumler.js');
require('./puanlama.js');
var assert = require('assert');

var ENV = { kisilik: global.ENV_KISILIK, ilgi: global.ENV_ILGI, deger: global.ENV_DEGER,
            beceri: global.ENV_BECERI, yetenek: global.ENV_YETENEK };

var kodlar = {}, ilkler = {}, tamSayi = 0;

uretilen.forEach(function (o) {
  if (!o.cevaplar || Object.keys(o.cevaplar.bitti || {}).length !== 5) return;
  tamSayi++;
  var gecen = { deger: o.cevaplar.deger };
  ['kisilik', 'ilgi', 'beceri', 'yetenek'].forEach(function (k) { gecen[k] = o.cevaplar[k]; });
  var p = global.PUANLAMA.profilCikar(ENV, gecen);
  var ilk = global.PUANLAMA.bolumOner(global.ENV_BOLUMLER, p, 1, 4).liste[0];
  kodlar[p.hollandKodu] = (kodlar[p.hollandKodu] || 0) + 1;
  ilkler[ilk.ad] = (ilkler[ilk.ad] || 0) + 1;
  console.log('  ' + o.ad + '  ' + p.hollandKodu + '  ' + ilk.uyum + '  ' + ilk.ad);
});

console.log('\n  ' + tamSayi + ' öğrenci beşini de bitirdi, ' +
  Object.keys(kodlar).length + ' farklı Holland kodu, ' +
  Object.keys(ilkler).length + ' farklı ilk bölüm.');

assert.ok(tamSayi >= 10, 'en az on öğrenci beş envanteri de bitirmiş olmalı');
assert.ok(Object.keys(kodlar).length >= 5, 'sınıf tek tip çıkmış');
assert.ok(Object.keys(ilkler).length >= 5, 'ilk bölüm önerileri dağılmıyor');
console.log('  örnek sınıf sınaması geçti.');
