/* Envanter denetimi.  Kullanım:  node kontrol.js
   Veri dosyalarını şemaya karşı tarar.  Hata varsa çıkış kodu 1. */

var hata = [], uyari = [];
function H(d, m) { hata.push(d + ': ' + m); }
function U(d, m) { uyari.push(d + ': ' + m); }

var YASAK = ['derinlemesine', 'benzersiz', 'eşsiz', 'büyüleyici', 'çığır açan',
  'kritik öneme sahip', 'hayati', 'kilit rol', 'dönüm noktası', 'mihenk taşı',
  'adeta', 'vurgulamaktadır', 'göz ardı edilmemelidir', 'günümüz dünyasında',
  'hızla değişen', 'dinamik', 'paradigma', 'holistik'];
var EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

function metinDenetle(d, etiket, s, maxKelime) {
  if (typeof s !== 'string' || !s.trim()) { H(d, etiket + ' boş'); return; }
  if (s.indexOf('—') >= 0) H(d, etiket + ' uzun tire içeriyor: ' + s);
  if (EMOJI.test(s)) H(d, etiket + ' emoji içeriyor: ' + s);
  /* Yasaklı kelime kelime başında aranır, yoksa "aerodinamik" içindeki
     "dinamik" gibi masum kökler uyarı üretiyor. */
  var kucuk = s.toLocaleLowerCase('tr');
  var HARF = /[a-zçğıîöşüâû]/;
  YASAK.forEach(function (y) {
    var i = kucuk.indexOf(y);
    while (i >= 0) {
      if (i === 0 || !HARF.test(kucuk[i - 1])) {
        U(d, etiket + ' yasaklı kelime "' + y + '": ' + s);
        return;
      }
      i = kucuk.indexOf(y, i + 1);
    }
  });
  if (maxKelime) {
    var k = s.trim().split(/\s+/).length;
    if (k > maxKelime) U(d, etiket + ' ' + k + ' kelime (tavan ' + maxKelime + '): ' + s);
  }
}

/* ---- Likert tipi: kişilik, ilgi, beceri ---- */
function likert(d, env, beklenenToplam, beklenenBoyut, beklenenTers) {
  if (!env) { H(d, 'dosya yüklenmedi ya da nesne yayımlamıyor'); return; }
  if (!Array.isArray(env.olcek) || env.olcek.length !== 5) H(d, 'olcek 5 basamak olmalı');
  if (!Array.isArray(env.boyutlar) || env.boyutlar.length !== beklenenBoyut)
    H(d, 'boyut sayısı ' + beklenenBoyut + ' olmalı, ' + (env.boyutlar || []).length + ' bulundu');

  var m = env.maddeler || [];
  if (m.length !== beklenenToplam) H(d, 'madde sayısı ' + beklenenToplam + ' olmalı, ' + m.length + ' bulundu');

  var kodlar = (env.boyutlar || []).map(function (b) { return b.k; });
  var sayac = {}, ters = {}, metinler = {};
  kodlar.forEach(function (k) { sayac[k] = 0; ters[k] = 0; });

  m.forEach(function (x, i) {
    if (x.n !== i + 1) H(d, (i + 1) + '. maddenin n değeri ' + x.n);
    if (kodlar.indexOf(x.b) < 0) { H(d, 'madde ' + x.n + ' tanımsız boyut "' + x.b + '"'); return; }
    sayac[x.b]++;
    if (x.t === true) ters[x.b]++;
    else if (x.t !== false) H(d, 'madde ' + x.n + ' t alanı true/false değil');
    metinDenetle(d, 'madde ' + x.n, x.m, 15);
    var anahtar = (x.m || '').toLocaleLowerCase('tr').replace(/[^\wçğıöşü ]/g, '').trim();
    if (metinler[anahtar]) H(d, 'madde ' + x.n + ' ile ' + metinler[anahtar] + ' aynı metin');
    else metinler[anahtar] = x.n;
    if (/\?\s*$/.test(x.m || '')) H(d, 'madde ' + x.n + ' soru işaretiyle bitiyor');
    if (i > 0 && m[i - 1].b === x.b) U(d, 'madde ' + x.n + ' bir öncekiyle aynı boyut (' + x.b + ')');
  });

  kodlar.forEach(function (k) {
    var bek = beklenenToplam / beklenenBoyut;
    if (sayac[k] !== bek) H(d, 'boyut ' + k + ' madde sayısı ' + sayac[k] + ', beklenen ' + bek);
    if (beklenenTers !== null && ters[k] !== beklenenTers)
      H(d, 'boyut ' + k + ' ters madde sayısı ' + ters[k] + ', beklenen ' + beklenenTers);
  });

  (env.boyutlar || []).forEach(function (b) {
    metinDenetle(d, 'boyut ' + b.k + ' aciklama', b.aciklama);
  });
}

/* ---- Sıralama tipi: meslek değerleri ---- */
function siralama(d, env) {
  if (!env) { H(d, 'dosya yüklenmedi'); return; }
  var kodlar = (env.boyutlar || []).map(function (b) { return b.k; });
  if (kodlar.length !== 6) H(d, 'boyut sayısı 6 olmalı, ' + kodlar.length + ' bulundu');
  var t = env.turlar || [];
  if (t.length !== 5) H(d, 'tur sayısı 5 olmalı, ' + t.length + ' bulundu');
  var gorulen = {};
  t.forEach(function (tur, i) {
    if (tur.n !== i + 1) H(d, (i + 1) + '. turun n değeri ' + tur.n);
    metinDenetle(d, 'tur ' + tur.n + ' yonerge', tur.yonerge);
    var s = tur.secenekler || [];
    if (s.length !== 6) { H(d, 'tur ' + tur.n + ' seçenek sayısı ' + s.length); return; }
    var bu = {};
    s.forEach(function (x) {
      if (kodlar.indexOf(x.b) < 0) H(d, 'tur ' + tur.n + ' tanımsız boyut "' + x.b + '"');
      if (bu[x.b]) H(d, 'tur ' + tur.n + ' boyut ' + x.b + ' iki kez geçiyor');
      bu[x.b] = 1;
      metinDenetle(d, 'tur ' + tur.n + ' seçenek', x.m, 14);
      var a = (x.m || '').toLocaleLowerCase('tr').trim();
      if (gorulen[a]) H(d, 'tur ' + tur.n + ' ifadesi tur ' + gorulen[a] + ' ile aynı: ' + x.m);
      else gorulen[a] = tur.n;
    });
    var uz = s.map(function (x) { return (x.m || '').length; });
    if (Math.max.apply(null, uz) > 2.2 * Math.min.apply(null, uz))
      U(d, 'tur ' + tur.n + ' seçenek uzunlukları çok farklı');
  });
}

/* ---- Yetenek testi ---- */
function yetenek(d, env) {
  if (!env) { H(d, 'dosya yüklenmedi'); return; }
  var m = env.maddeler || [];
  if (m.length !== 40) H(d, 'soru sayısı 40 olmalı, ' + m.length + ' bulundu');
  var alanlar = ['SOZ', 'SAY', 'MAN', 'UZM', 'VER'];
  var HARF = ['A', 'B', 'C', 'D', 'E'];
  var sayac = {}, harf = [0, 0, 0, 0, 0], ardisik = 0, oncekiD = -1;
  alanlar.forEach(function (a) { sayac[a] = 0; });

  m.forEach(function (x, i) {
    var e = 'soru ' + x.n;
    if (x.n !== i + 1) H(d, (i + 1) + '. sorunun n değeri ' + x.n);
    if (alanlar.indexOf(x.b) < 0) { H(d, e + ' tanımsız alan "' + x.b + '"'); return; }
    sayac[x.b]++;
    metinDenetle(d, e + ' kök', x.s);
    if (!Array.isArray(x.sec) || x.sec.length !== 5) H(d, e + ' seçenek sayısı 5 değil');
    else {
      var gorulen = {};
      x.sec.forEach(function (o, j) {
        metinDenetle(d, e + ' seçenek ' + HARF[j], String(o));
        var a = String(o).toLocaleLowerCase('tr').trim();
        if (gorulen[a]) H(d, e + ' seçenek ' + HARF[j] + ' ile ' + gorulen[a] + ' aynı');
        else gorulen[a] = HARF[j];
      });
    }
    if (!(x.d >= 0 && x.d <= 4)) H(d, e + ' doğru cevap indeksi geçersiz: ' + x.d);
    else {
      harf[x.d]++;
      if (x.d === oncekiD) ardisik++; else ardisik = 1;
      oncekiD = x.d;
      if (ardisik >= 3) U(d, e + ' ile birlikte üç soru üst üste ' + HARF[x.d]);
    }
    if (!(x.z >= 1 && x.z <= 5)) H(d, e + ' zorluk 1-5 aralığında değil: ' + x.z);
    metinDenetle(d, e + ' açıklama', x.ac);
    if (x.b === 'UZM' && !x.g) U(d, e + ' uzamsal ama çizim tarifi (g) yok');
    if (x.b === 'VER' && !x.tablo) U(d, e + ' veri yorumlama ama tablo alanı yok');
  });

  alanlar.forEach(function (a) {
    if (sayac[a] !== 8) H(d, 'alan ' + a + ' soru sayısı ' + sayac[a] + ', beklenen 8');
  });
  harf.forEach(function (v, i) {
    if (v < 5 || v > 11) U(d, 'doğru cevap ' + HARF[i] + ' ' + v + ' kez, dengeli değil');
  });
}

/* ---- Bölüm tablosu ---- */
function bolumler(d, env) {
  if (!env) { H(d, 'dosya yüklenmedi'); return; }
  var b = env.bolumler || [];
  if (b.length < 70) H(d, 'bölüm sayısı ' + b.length + ', en az 70 olmalı');
  var puanlar = ['SAY', 'EA', 'SOZ', 'DIL', 'TYT', 'OZEL'];
  var yAlan = ['SOZ', 'SAY', 'MAN', 'UZM', 'VER'];
  var bAlan = ['SAY', 'SOZ', 'TEK', 'TAS', 'LID', 'DIJ'];
  var dAlan = ['BAS', 'BAG', 'TAN', 'ILI', 'GUV', 'KOS'];
  var kAlan = ['D', 'U', 'S', 'DD', 'A'];
  var kodlar = {}, adlar = {};

  b.forEach(function (x) {
    var e = x.kod || x.ad || '(kodsuz)';
    if (kodlar[x.kod]) H(d, 'kod iki kez geçiyor: ' + x.kod);
    kodlar[x.kod] = 1;
    if (adlar[x.ad]) H(d, 'ad iki kez geçiyor: ' + x.ad);
    adlar[x.ad] = 1;
    if (puanlar.indexOf(x.puan) < 0) H(d, e + ' puan türü geçersiz: ' + x.puan);
    if (!/^[RIASEC]{3}$/.test(x.holland || '')) H(d, e + ' Holland kodu geçersiz: ' + x.holland);
    else if (new Set(x.holland.split('')).size !== 3) H(d, e + ' Holland kodunda harf tekrarı: ' + x.holland);
    yAlan.forEach(function (a) {
      var v = (x.yetenek || {})[a];
      if (!(v >= 1 && v <= 5)) H(d, e + ' yetenek.' + a + ' geçersiz: ' + v);
    });
    bAlan.forEach(function (a) {
      var v = (x.beceri || {})[a];
      if (!(v >= 1 && v <= 5)) H(d, e + ' beceri.' + a + ' geçersiz: ' + v);
    });
    if (!Array.isArray(x.deger) || x.deger.length !== 2) H(d, e + ' deger tam iki kod olmalı');
    else x.deger.forEach(function (v) { if (dAlan.indexOf(v) < 0) H(d, e + ' geçersiz değer kodu: ' + v); });
    Object.keys(x.kisilik || {}).forEach(function (k) {
      if (kAlan.indexOf(k) < 0) H(d, e + ' geçersiz kişilik kodu: ' + k);
      else if (!(x.kisilik[k] >= 1 && x.kisilik[k] <= 5)) H(d, e + ' kisilik.' + k + ' geçersiz');
    });
    metinDenetle(d, e + ' isler', x.isler);
    metinDenetle(d, e + ' not', x.not);
    var yd = yAlan.map(function (a) { return (x.yetenek || {})[a]; });
    if (new Set(yd).size === 1) U(d, e + ' yetenek ağırlıkları hepsi aynı, ayırt etmiyor');
  });
}

/* ---- Çalıştır ---- */
function yukle(yol) {
  try { require(yol); }
  catch (e) { H(yol, 'yüklenemedi: ' + e.message); }
}

['./veri/kisilik.js', './veri/ilgi.js', './veri/degerler.js',
  './veri/beceri.js', './veri/yetenek.js', './veri/bolumler.js'].forEach(yukle);

likert('kisilik', global.ENV_KISILIK, 70, 5, 6);
likert('ilgi', global.ENV_ILGI, 48, 6, 0);
/* Beceri envanterinde ters madde yok: ölçek "yapabilirim" diyor, kaçınma
   davranışını bu ölçekle sormak iki yönlü okunuyordu.  Onun yerine her
   boyutta temelden ileriye giden zorluk basamağı var. */
likert('beceri', global.ENV_BECERI, 30, 6, 0);
siralama('degerler', global.ENV_DEGER);
yetenek('yetenek', global.ENV_YETENEK);
bolumler('bolumler', global.ENV_BOLUMLER);

uyari.forEach(function (u) { console.log('UYARI  ' + u); });
hata.forEach(function (h) { console.log('HATA   ' + h); });
console.log('\n' + hata.length + ' hata, ' + uyari.length + ' uyarı.');
process.exit(hata.length ? 1 : 0);
