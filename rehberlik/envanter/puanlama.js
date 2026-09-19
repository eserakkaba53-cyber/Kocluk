/* Envanter puanlama ve bölüm eşleştirme.
   Tarayıcıda window.PUANLAMA, node'da global.PUANLAMA olarak açılır.
   Kendi sınaması var:  node puanlama.js  */

var KOK = (typeof window !== 'undefined') ? window : global;

/* Likert cevapları 1-5 gelir. Ters madde 6 - cevap olur.
   cevaplar: { maddeNo: 1..5 }.  Cevaplanmayan madde 3 sayılır ve eksik olarak raporlanır. */
function likert(env, cevaplar) {
  var sonuc = {}, eksik = [];
  env.boyutlar.forEach(function (b) { sonuc[b.k] = { ham: 0, sayi: 0, ad: b.ad }; });

  env.maddeler.forEach(function (m) {
    var c = cevaplar[m.n];
    if (c === undefined || c === null) { eksik.push(m.n); c = 3; }
    if (c < 1 || c > 5) throw new Error('madde ' + m.n + ' cevabı 1-5 dışında: ' + c);
    sonuc[m.b].ham += m.t ? 6 - c : c;
    sonuc[m.b].sayi++;
  });

  Object.keys(sonuc).forEach(function (k) {
    var s = sonuc[k];
    s.alt = s.sayi;          // hepsi 1 verilirse
    s.ust = s.sayi * 5;      // hepsi 5 verilirse
    s.yuzde = yuzdele(s.ham, s.alt, s.ust);
    s.duzey = duzey(s.yuzde);
  });
  return { boyut: sonuc, eksik: eksik };
}

/* Sıralama: her tur için öğrencinin 1. sıradan 6. sıraya dizdiği boyut kodları.
   siralamalar: { turNo: ['BAS','ILI',...] }.  1. sıra 6 puan, 6. sıra 1 puan. */
function deger(env, siralamalar) {
  var sonuc = {}, eksik = [];
  env.boyutlar.forEach(function (b) { sonuc[b.k] = { ham: 0, sayi: 0, ad: b.ad }; });

  env.turlar.forEach(function (tur) {
    var s = siralamalar[tur.n];
    if (!s) { eksik.push(tur.n); return; }
    if (s.length !== 6) throw new Error('tur ' + tur.n + ' sıralaması 6 öğe olmalı');
    var gorulen = {};
    s.forEach(function (kod, i) {
      if (!sonuc[kod]) throw new Error('tur ' + tur.n + ' tanımsız boyut: ' + kod);
      if (gorulen[kod]) throw new Error('tur ' + tur.n + ' boyut ' + kod + ' iki kez sıralanmış');
      gorulen[kod] = 1;
      sonuc[kod].ham += 6 - i;
      sonuc[kod].sayi++;
    });
  });

  var tamTur = env.turlar.length - eksik.length;
  Object.keys(sonuc).forEach(function (k) {
    var s = sonuc[k];
    s.alt = tamTur * 1;
    s.ust = tamTur * 6;
    s.yuzde = tamTur ? yuzdele(s.ham, s.alt, s.ust) : 50;
    s.duzey = duzey(s.yuzde);
  });
  return { boyut: sonuc, eksik: eksik };
}

/* Yetenek: cevaplar { soruNo: 0..4 }, boş bırakılan yanlış sayılır. */
function yetenek(env, cevaplar) {
  var sonuc = {}, bos = 0, dogruToplam = 0;
  env.boyutlar.forEach(function (b) { sonuc[b.k] = { dogru: 0, sayi: 0, ad: b.ad }; });

  env.maddeler.forEach(function (m) {
    var c = cevaplar[m.n];
    sonuc[m.b].sayi++;
    if (c === undefined || c === null) { bos++; return; }
    if (c === m.d) { sonuc[m.b].dogru++; dogruToplam++; }
  });

  Object.keys(sonuc).forEach(function (k) {
    var s = sonuc[k];
    s.yuzde = s.sayi ? Math.round(100 * s.dogru / s.sayi) : 0;
    s.duzey = duzey(s.yuzde);
  });
  return {
    boyut: sonuc, bos: bos,
    dogru: dogruToplam, soru: env.maddeler.length,
    yuzde: Math.round(100 * dogruToplam / env.maddeler.length)
  };
}

function yuzdele(ham, alt, ust) {
  if (ust === alt) return 50;
  return Math.round(100 * (ham - alt) / (ust - alt));
}

function duzey(y) {
  if (y >= 75) return 'yuksek';
  if (y >= 55) return 'ortaustu';
  if (y >= 35) return 'orta';
  return 'dusuk';
}

/* Holland kodu: en yüksek üç tip, büyükten küçüğe. */
function hollandKodu(ilgiSonuc) {
  return Object.keys(ilgiSonuc.boyut)
    .sort(function (a, b) { return ilgiSonuc.boyut[b].yuzde - ilgiSonuc.boyut[a].yuzde; })
    .slice(0, 3).join('');
}

/* Altıgen tutarlılığı. İlk iki harf komşuysa 3, bir atlamalıysa 2, karşıysa 1.
   Düşük tutarlılık ilgilerin dağınık olduğunu gösterir, öneriyi çürütmez. */
var HEXAGON = ['R', 'I', 'A', 'S', 'E', 'C'];
function tutarlilik(kod) {
  var a = HEXAGON.indexOf(kod[0]), b = HEXAGON.indexOf(kod[1]);
  if (a < 0 || b < 0) return null;
  var uzaklik = Math.min(Math.abs(a - b), 6 - Math.abs(a - b));
  return uzaklik === 1 ? 3 : uzaklik === 2 ? 2 : 1;
}

/* Bir ağırlık tablosuna göre ağırlıklı ortalama yüzde. */
function agirlikli(agirliklar, yuzdeler) {
  var pay = 0, payda = 0;
  Object.keys(agirliklar).forEach(function (k) {
    var w = agirliklar[k];
    if (yuzdeler[k] === undefined) return;
    pay += w * yuzdeler[k];
    payda += w;
  });
  return payda ? pay / payda : 50;
}

function yuzdeHarita(sonuc) {
  var y = {};
  Object.keys(sonuc.boyut).forEach(function (k) { y[k] = sonuc.boyut[k].yuzde; });
  return y;
}

/* Bölüm uyumu.  Dört bileşen, toplam 100.
   İlgi 35, yetenek 25, beceri 25, değer 15.  Kişilik puana girmez, yorum üretir. */
var AGIRLIK = { ilgi: 35, yetenek: 25, beceri: 25, deger: 15 };

function bolumUyumu(bolum, profil) {
  var ilgiY = profil.ilgi, yetY = profil.yetenek, becY = profil.beceri, degY = profil.deger;

  var hollandAgirlik = {};
  bolum.holland.split('').forEach(function (h, i) { hollandAgirlik[h] = 3 - i; });

  var p = {
    ilgi: agirlikli(hollandAgirlik, ilgiY),
    yetenek: agirlikli(bolum.yetenek, yetY),
    beceri: agirlikli(bolum.beceri, becY),
    deger: (degY[bolum.deger[0]] + degY[bolum.deger[1]]) / 2
  };

  var toplam = 0;
  Object.keys(AGIRLIK).forEach(function (k) { toplam += AGIRLIK[k] * p[k] / 100; });

  return {
    kod: bolum.kod, ad: bolum.ad, grup: bolum.grup, puan: bolum.puan,
    holland: bolum.holland, isler: bolum.isler, not: bolum.not,
    uyum: Math.round(toplam),
    bilesen: {
      ilgi: Math.round(p.ilgi), yetenek: Math.round(p.yetenek),
      beceri: Math.round(p.beceri), deger: Math.round(p.deger)
    },
    gerekce: gerekce(bolum, p, profil)
  };
}

/* Hangi yetenek alanının hangi YKS puan türünü taşıdığı.
   Öğrenciye bölüm önerilirken puan türünün gerektirdiği alan zayıfsa uyarı çıkar. */
var PUAN_TURU_ALANI = {
  SAY: ['SAY', 'MAN'],
  EA: ['SAY', 'SOZ'],
  SOZ: ['SOZ', 'VER'],
  DIL: ['SOZ'],
  TYT: ['SOZ', 'SAY'],
  OZEL: []
};

/* Uyumu en çok taşıyan ve en çok düşüren nokta, artı öğrenciye yazılacak uyarılar. */
function gerekce(bolum, p, profil) {
  var sirali = Object.keys(p).sort(function (a, b) { return p[b] - p[a]; });
  var g = { guclu: sirali[0], zayif: sirali[sirali.length - 1], notlar: [] };
  var ad = profil.adlar || {};
  var adi = function (kume, k) { return (ad[kume] && ad[kume][k]) || k; };

  /* Puan türünün dayandığı alanların ortalaması düşükse bunu peşinen söyle,
     yoksa öğrenci giremeyeceği bir sıralamayı hedef sanabiliyor. */
  var alanlar = PUAN_TURU_ALANI[bolum.puan] || [];
  if (alanlar.length) {
    var ort = 0;
    alanlar.forEach(function (a) { ort += profil.yetenek[a] || 0; });
    ort = Math.round(ort / alanlar.length);
    if (ort < 40)
      g.notlar.push('Bu bölüm ' + bolum.puan + ' puanıyla alıyor. Yetenek testinde ' +
        alanlar.map(function (a) { return adi('yetenek', a).toLocaleLowerCase('tr'); }).join(' ve ') +
        ' alanlarındaki ortalaman yüzde ' + ort + ', bu puan türü sana zorlanacağın bir yol açar.');
  }

  var enOnemli = enBuyukAnahtar(bolum.yetenek);
  if (profil.yetenek[enOnemli] < 40)
    g.notlar.push('Bu bölümün en çok istediği alan ' + adi('yetenek', enOnemli).toLocaleLowerCase('tr') +
      ', yetenek testinde bu alanda yüzde ' + profil.yetenek[enOnemli] + ' aldın.');

  Object.keys(bolum.kisilik || {}).forEach(function (k) {
    if (bolum.kisilik[k] >= 4 && profil.kisilik[k] !== undefined && profil.kisilik[k] < 35)
      g.notlar.push('Bu alanda çalışanlarda ' + adi('kisilik', k).toLocaleLowerCase('tr') +
        ' boyutu öne çıkıyor, senin bu boyuttaki puanın düşük. Bölümü seçersen hesaba kat.');
  });
  /* Rapor okunur kalsın diye bölüm başına en fazla iki not. Puan türü uyarısı
     listenin başında durduğu için en önemlisi hiçbir zaman elenmez. */
  g.notlar = g.notlar.slice(0, 2);
  return g;
}

function enBuyukAnahtar(nesne) {
  return Object.keys(nesne).sort(function (a, b) { return nesne[b] - nesne[a]; })[0];
}

/* Tam profil.  cevaplar: { kisilik:{}, ilgi:{}, deger:{}, beceri:{}, yetenek:{} }
   Eksik envanter varsa o bileşen 50 kabul edilir ve eksikEnvanter içinde bildirilir. */
function profilCikar(env, cevaplar) {
  var p = { eksikEnvanter: [] }, ham = {};
  var notr = function (boyutlar) {
    var y = {};
    boyutlar.forEach(function (b) { y[b.k] = 50; });
    return y;
  };

  if (cevaplar.kisilik) { ham.kisilik = likert(env.kisilik, cevaplar.kisilik); p.kisilik = yuzdeHarita(ham.kisilik); }
  else { p.kisilik = notr(env.kisilik.boyutlar); p.eksikEnvanter.push('kisilik'); }

  if (cevaplar.ilgi) { ham.ilgi = likert(env.ilgi, cevaplar.ilgi); p.ilgi = yuzdeHarita(ham.ilgi); }
  else { p.ilgi = notr(env.ilgi.boyutlar); p.eksikEnvanter.push('ilgi'); }

  if (cevaplar.beceri) { ham.beceri = likert(env.beceri, cevaplar.beceri); p.beceri = yuzdeHarita(ham.beceri); }
  else { p.beceri = notr(env.beceri.boyutlar); p.eksikEnvanter.push('beceri'); }

  if (cevaplar.deger) { ham.deger = deger(env.deger, cevaplar.deger); p.deger = yuzdeHarita(ham.deger); }
  else { p.deger = notr(env.deger.boyutlar); p.eksikEnvanter.push('deger'); }

  if (cevaplar.yetenek) { ham.yetenek = yetenek(env.yetenek, cevaplar.yetenek); p.yetenek = yuzdeHarita(ham.yetenek); }
  else { p.yetenek = notr(env.yetenek.boyutlar); p.eksikEnvanter.push('yetenek'); }

  /* Boyut adları burada toplanıyor, gerekçe metinleri kod yerine adı yazsın diye.
     Öğrenci "S boyutu" ifadesinden ne anlaşılacağını bilemez. */
  p.adlar = {};
  ['kisilik', 'ilgi', 'beceri', 'deger', 'yetenek'].forEach(function (k) {
    p.adlar[k] = {};
    (env[k].boyutlar || []).forEach(function (b) { p.adlar[k][b.k] = b.ad; });
  });

  p.ham = ham;
  if (ham.ilgi) {
    p.hollandKodu = hollandKodu(ham.ilgi);
    p.tutarlilik = tutarlilik(p.hollandKodu);
  }
  return p;
}

/* Sıralı bölüm önerisi.  Aynı grup listeyi kaplamasın diye gruptan en fazla grupTavan tane alınır. */
function bolumOner(bolumler, profil, adet, grupTavan) {
  adet = adet || 15;
  grupTavan = grupTavan || 4;
  var hepsi = bolumler.bolumler.map(function (b) { return bolumUyumu(b, profil); })
    .sort(function (a, b) { return b.uyum - a.uyum; });

  var secilen = [], grupSayac = {};
  hepsi.forEach(function (b) {
    if (secilen.length >= adet) return;
    grupSayac[b.grup] = grupSayac[b.grup] || 0;
    if (grupSayac[b.grup] >= grupTavan) return;
    grupSayac[b.grup]++;
    secilen.push(b);
  });
  return { liste: secilen, tumu: hepsi };
}

KOK.PUANLAMA = {
  likert: likert, deger: deger, yetenek: yetenek,
  hollandKodu: hollandKodu, tutarlilik: tutarlilik,
  profilCikar: profilCikar, bolumUyumu: bolumUyumu, bolumOner: bolumOner,
  AGIRLIK: AGIRLIK
};

/* ---- Sınama ---- */
if (typeof require !== 'undefined' && require.main === module) {
  var assert = require('assert');

  var sahteLikert = {
    boyutlar: [{ k: 'X', ad: 'X' }, { k: 'Y', ad: 'Y' }],
    olcek: [1, 2, 3, 4, 5],
    maddeler: [
      { n: 1, m: 'a', b: 'X', t: false }, { n: 2, m: 'b', b: 'Y', t: false },
      { n: 3, m: 'c', b: 'X', t: true }, { n: 4, m: 'd', b: 'Y', t: true }
    ]
  };

  // Düz madde 5, ters madde 1 verildiğinde ters çevrilip 5 olur, tavan puan çıkar.
  var r = likert(sahteLikert, { 1: 5, 2: 5, 3: 1, 4: 1 });
  assert.strictEqual(r.boyut.X.ham, 10, 'ters madde çevrilmedi');
  assert.strictEqual(r.boyut.X.yuzde, 100, 'tavan yüzde 100 olmalı');
  assert.strictEqual(r.boyut.Y.yuzde, 100);

  // Cevapsız madde 3 sayılır ve eksik listesine düşer.
  var r2 = likert(sahteLikert, { 1: 3, 2: 3, 3: 3 });
  assert.deepStrictEqual(r2.eksik, [4], 'eksik madde yakalanmadı');
  assert.strictEqual(r2.boyut.Y.yuzde, 50, 'orta cevap yüzde 50 vermeli');

  var sahteDeger = {
    boyutlar: [{ k: 'A', ad: 'A' }, { k: 'B', ad: 'B' }, { k: 'C', ad: 'C' },
               { k: 'D', ad: 'D' }, { k: 'E', ad: 'E' }, { k: 'F', ad: 'F' }],
    turlar: [{ n: 1, yonerge: '', secenekler: [] }, { n: 2, yonerge: '', secenekler: [] }]
  };
  var d = deger(sahteDeger, { 1: ['A', 'B', 'C', 'D', 'E', 'F'], 2: ['A', 'B', 'C', 'D', 'E', 'F'] });
  assert.strictEqual(d.boyut.A.ham, 12, 'iki turda da birinci olan 12 puan almalı');
  assert.strictEqual(d.boyut.A.yuzde, 100);
  assert.strictEqual(d.boyut.F.yuzde, 0, 'iki turda da sonuncu olan 0 almalı');

  var sahteYetenek = {
    boyutlar: [{ k: 'SAY', ad: 'Sayısal' }, { k: 'SOZ', ad: 'Sözel' }],
    maddeler: [
      { n: 1, b: 'SAY', d: 2 }, { n: 2, b: 'SAY', d: 0 },
      { n: 3, b: 'SOZ', d: 4 }, { n: 4, b: 'SOZ', d: 1 }
    ]
  };
  var y = yetenek(sahteYetenek, { 1: 2, 2: 3, 3: 4 });
  assert.strictEqual(y.boyut.SAY.dogru, 1);
  assert.strictEqual(y.boyut.SOZ.dogru, 1);
  assert.strictEqual(y.bos, 1, 'boş bırakılan soru sayılmadı');
  assert.strictEqual(y.yuzde, 50);

  assert.strictEqual(tutarlilik('RI'), 3, 'komşu tipler tutarlı olmalı');
  assert.strictEqual(tutarlilik('RS'), 1, 'karşıt tipler tutarsız olmalı');
  assert.strictEqual(tutarlilik('CR'), 3, 'altıgen dairesel, C ile R komşu');

  // Sayısal profil sayısal bölümü, sözel profil sözel bölümü üste taşımalı.
  var bolumler = {
    bolumler: [
      { kod: 'MUH', ad: 'Mühendislik', grup: 'muh', puan: 'SAY', holland: 'IRC',
        yetenek: { SOZ: 1, SAY: 5, MAN: 5, UZM: 3, VER: 4 },
        beceri: { SAY: 5, SOZ: 1, TEK: 4, TAS: 2, LID: 2, DIJ: 5 },
        deger: ['BAS', 'BAG'], kisilik: {}, isler: '', not: '' },
      { kod: 'EDB', ad: 'Edebiyat', grup: 'dil', puan: 'SOZ', holland: 'AIS',
        yetenek: { SOZ: 5, SAY: 1, MAN: 3, UZM: 1, VER: 2 },
        beceri: { SAY: 1, SOZ: 5, TEK: 1, TAS: 3, LID: 2, DIJ: 2 },
        deger: ['BAG', 'ILI'], kisilik: {}, isler: '', not: '' }
    ]
  };
  var sayisalProfil = {
    ilgi: { R: 80, I: 90, A: 20, S: 20, E: 30, C: 60 },
    yetenek: { SOZ: 20, SAY: 95, MAN: 90, UZM: 70, VER: 80 },
    beceri: { SAY: 95, SOZ: 20, TEK: 80, TAS: 20, LID: 30, DIJ: 90 },
    deger: { BAS: 80, BAG: 70, TAN: 40, ILI: 30, GUV: 50, KOS: 40 },
    kisilik: { D: 40, U: 50, S: 70, DD: 60, A: 70 }
  };
  var sozelProfil = {
    ilgi: { R: 20, I: 40, A: 90, S: 80, E: 40, C: 20 },
    yetenek: { SOZ: 95, SAY: 20, MAN: 60, UZM: 30, VER: 40 },
    beceri: { SAY: 20, SOZ: 95, TEK: 20, TAS: 70, LID: 40, DIJ: 40 },
    deger: { BAS: 50, BAG: 80, TAN: 40, ILI: 85, GUV: 40, KOS: 40 },
    kisilik: { D: 50, U: 70, S: 50, DD: 50, A: 90 }
  };
  assert.strictEqual(bolumOner(bolumler, sayisalProfil).liste[0].kod, 'MUH',
    'sayısal profil mühendisliği üste taşımalı');
  assert.strictEqual(bolumOner(bolumler, sozelProfil).liste[0].kod, 'EDB',
    'sözel profil edebiyatı üste taşımalı');

  // Grup tavanı listeyi tek gruba bırakmamalı.
  var cokMuh = { bolumler: [] };
  for (var i = 0; i < 6; i++)
    cokMuh.bolumler.push(Object.assign({}, bolumler.bolumler[0], { kod: 'M' + i }));
  cokMuh.bolumler.push(bolumler.bolumler[1]);
  var sinir = bolumOner(cokMuh, sayisalProfil, 10, 2);
  assert.strictEqual(sinir.liste.filter(function (b) { return b.grup === 'muh'; }).length, 2,
    'grup tavanı uygulanmadı');

  console.log('puanlama sınaması geçti.');
}
