/* Kendini tanı, öğrenci tarafı.
   Ekran akışı, üç test motoru, otomatik kayıt ve rapor. */

(function () {
'use strict';

/* ------------------------------------------------------------------ */
/* Kısa yardımcılar                                                     */
/* ------------------------------------------------------------------ */
function $(s, k) { return (k || document).querySelector(s); }
function $$(s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); }

function el(etiket, ozellik, icerik) {
  var d = document.createElement(etiket);
  if (ozellik) Object.keys(ozellik).forEach(function (a) {
    if (a === 'class') d.className = ozellik[a];
    else if (a.slice(0, 2) === 'on') d.addEventListener(a.slice(2), ozellik[a]);
    else if (ozellik[a] !== null && ozellik[a] !== undefined) d.setAttribute(a, ozellik[a]);
  });
  if (icerik !== undefined && icerik !== null) {
    if (Array.isArray(icerik)) icerik.forEach(function (c) { if (c) d.appendChild(c); });
    else if (typeof icerik === 'string') d.textContent = icerik;
    else d.appendChild(icerik);
  }
  return d;
}

function bosalt(k) { while (k.firstChild) k.removeChild(k.firstChild); return k; }

function ikon(yol, gorunum) {
  var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', gorunum || '0 0 28 28');
  s.setAttribute('width', '28'); s.setAttribute('height', '28');
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.5'); s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = yol;
  return s;
}

/* Her ikon o envanterin yapısını gösteriyor: kişilikte beş boyutlu ağ,
   ilgide Holland altıgeni, değerlerde sıralanmış çubuklar, beceride
   basamak, yetenekte optik form kabarcıkları. */
var IKONLAR = {
  kisilik: '<path d="M14 2 L25 10 L21 23 L7 23 L3 10 Z"/>' +
           '<path d="M14 8 L20 12 L18 19 L10 19 L8 12 Z" stroke-opacity=".55"/>',
  ilgi:    '<path d="M14 2 L24 8 V20 L14 26 L4 20 V8 Z"/>' +
           '<circle cx="14" cy="8" r="2.2"/><circle cx="21" cy="18" r="2.2"/>' +
           '<circle cx="7" cy="18" r="2.2"/>',
  deger:   '<path d="M4 6h20"/><path d="M4 12h14"/><path d="M4 18h9"/><path d="M4 24h5"/>' +
           '<path d="M26 4v20" stroke-opacity=".45"/>',
  beceri:  '<path d="M3 24h5v-6H3z"/><path d="M11 24h5V13h-5z"/><path d="M19 24h5V6h-5z"/>',
  yetenek: '<circle cx="6" cy="8" r="3"/><circle cx="14" cy="8" r="3" fill="currentColor"/>' +
           '<circle cx="22" cy="8" r="3"/><circle cx="6" cy="19" r="3"/>' +
           '<circle cx="14" cy="19" r="3"/><circle cx="22" cy="19" r="3" fill="currentColor"/>'
};

/* ------------------------------------------------------------------ */
/* Envanter tanımları                                                   */
/* ------------------------------------------------------------------ */
var ENVANTERLER = [
  { k: 'kisilik', tip: 'likert', ton: 'var(--kisilik)', dk: 15,
    ad: 'Kişilik Envanteri',
    ne: 'Beş Faktör modeliyle dışadönüklük, uyumluluk, sorumluluk, duygusal denge ve deneyime açıklık boyutlarını ölçer.',
    bilgi: 'Doğru ya da yanlış cevap yok. Olmak istediğin kişiyi değil, çoğu gün gerçekten nasıl davrandığını işaretle. Bir maddede takılırsan ilk aklına geleni seç.' },

  { k: 'ilgi', tip: 'likert', ton: 'var(--ilgi)', dk: 10,
    ad: 'İlgi Envanteri',
    ne: 'Holland’ın altı ilgi tipine göre hangi işleri yapmaktan hoşlanacağını çıkarır.',
    bilgi: 'Maddeler meslek adı değil, işin kendisi. "Bunu yapabilir miyim" diye değil, "bunu yapmak hoşuma gider mi" diye düşün. Şu an bilmediğin bir iş de ilgini çekebilir.' },

  { k: 'deger', tip: 'sirala', ton: 'var(--deger)', dk: 6,
    ad: 'Meslek Değerler Sıralama Tekniği',
    ne: 'Bir işten öncelikle ne beklediğini altı değer arasında sıralatarak bulur.',
    bilgi: 'Altı seçeneğin hepsi makul. Zaten bu yüzden puan vermiyor, sıralıyorsun. Hepsini isteyemeyeceğin bir durumda hangisinden en son vazgeçersin, ona göre diz.' },

  { k: 'beceri', tip: 'likert', ton: 'var(--beceri)', dk: 10,
    ad: 'Mesleki Beceri Envanteri',
    ne: 'Altı beceri alanında kendini ne kadar yeterli gördüğünü ölçer.',
    bilgi: 'Bu bir sınav değil, kendi değerlendirmen. Hiç denemediğin bir iş için "yapamam" değil, denesen ne olurdu onu düşün. Abartmak da küçümsemek de sonucu bozar.' },

  { k: 'yetenek', tip: 'yetenek', ton: 'var(--yetenek)', dk: 45,
    ad: 'Yetenek Testi',
    ne: 'Sözel, sayısal, mantıksal, uzamsal ve veri yorumlama alanlarında akıl yürütme gücünü ölçer.',
    bilgi: 'Tek doğru cevabı olan tek envanter bu. Süre 45 dakika ve başladığın anda işlemeye başlar, ara veremezsin. Emin olamadığın soruyu boş bırakma, eleyip işaretle.' }
];

function env(k) {
  return { kisilik: window.ENV_KISILIK, ilgi: window.ENV_ILGI, deger: window.ENV_DEGER,
    beceri: window.ENV_BECERI, yetenek: window.ENV_YETENEK }[k];
}
function tanim(k) {
  for (var i = 0; i < ENVANTERLER.length; i++) if (ENVANTERLER[i].k === k) return ENVANTERLER[i];
  return null;
}
function soruSayisi(k) {
  var e = env(k);
  return k === 'deger' ? e.turlar.length : e.maddeler.length;
}
function olcuMetni(k) {
  return k === 'deger' ? soruSayisi(k) + ' tur' : soruSayisi(k) + ' soru';
}

/* ------------------------------------------------------------------ */
/* Durum                                                                */
/* ------------------------------------------------------------------ */
var D = {
  ad_soyad: '', sinif: null, sube: '', okul_no: '', okul_adi: '',
  cevaplar: {}, bitti: {}, yetenek_baslangic: null,
  aktif: null, sayfa: 0, kayitBekliyor: null, sonKayit: null
};

/* Sunucudan gelen cevap paketini yerel duruma açar. */
function yukle(paket) {
  D.cevaplar = {};
  ENVANTERLER.forEach(function (t) { D.cevaplar[t.k] = (paket[t.k] || {}); });
  D.bitti = paket.bitti || {};
  D.yetenek_baslangic = paket.yetenek_baslangic || null;
}

/* Kaydedilmek üzere paketler. yetenek_baslangic sunucunun, istemci göndermez. */
function paketle() {
  var p = { bitti: D.bitti };
  ENVANTERLER.forEach(function (t) { p[t.k] = D.cevaplar[t.k] || {}; });
  return p;
}

/* ------------------------------------------------------------------ */
/* Misafir kipi                                                         */
/* ★ 20 Eyl 2026 — Kayıt olmadan da çözülebilsin.                       */
/*                                                                      */
/* Cevaplar tarayıcıda durur, sunucuya hiç gitmez. Biçim paketle()      */
/* çıktısıyla birebir aynı, üstüne yetenek_baslangic ekli; böylece      */
/* yukle() ikinci bir çözümleyici yazmadan okuyor.                      */
/*                                                                      */
/* localStorage seçildi, sessionStorage değil: amaç "yarım bıraktığın   */
/* yerden dön", sessionStorage ise sekme kapanınca siliniyor. Paylaşılan */
/* bilgisayar için kapıda görünür uyarı ve "Cevaplarımı sil" düğmesi var. */
/* ------------------------------------------------------------------ */
var MISAFIR_ANAHTAR = 'kendini-tani-misafir';
var MISAFIR = false;              /* oturum yok, misafir akışındayız */
var MISAFIR_YAZILAMIYOR = false;  /* özel pencere ya da kota dolu */

function misafirYaz() {
  var p = paketle();
  p.yetenek_baslangic = D.yetenek_baslangic;
  try {
    localStorage.setItem(MISAFIR_ANAHTAR, JSON.stringify(p));
    MISAFIR_YAZILAMIYOR = false;
  } catch (e) {
    /* Sessizce yutmak, öğrencinin 148 maddeyi doldurup tazelemede
       kaybetmesi demek. Durumu tutuyoruz, kapı ekranı söylüyor. */
    MISAFIR_YAZILAMIYOR = true;
  }
}

function misafirOku() {
  try { return JSON.parse(localStorage.getItem(MISAFIR_ANAHTAR) || 'null'); }
  catch (e) { return null; }
}

function misafirSil() {
  try { localStorage.removeItem(MISAFIR_ANAHTAR); } catch (e) { /* yoksay */ }
}

/* Tek madde işaretlendiyse ya da yetenek sayacı başladıysa dolu sayılır. */
function misafirDolu() {
  var p = misafirOku();
  if (!p) return false;
  if (p.yetenek_baslangic) return true;
  return ENVANTERLER.some(function (t) { return Object.keys(p[t.k] || {}).length; });
}

/* Her çağrıda aynı sonucu verir: varsa okur, yoksa boş kurar.
   yukle() ZORUNLU: D.cevaplar başlangıçta boş nesne, likertCiz ise
   D.cevaplar[k][m.n] okuyor; yukle çağrılmazsa ilk maddede hata atar. */
function misafirBaslat() {
  MISAFIR = true;
  yukle(misafirOku() || {});
  kapiCiz();
  goster('kapi');
}

/* Oturumu API tutuyor. Burada yalnız profilin ekrana yazılan kısmı duruyor. */
function profiliAl(p) {
  D.ad_soyad = p.ad_soyad || '';
  D.sinif    = p.sinif || null;
  D.sube     = p.sube || '';
  D.okul_no  = p.okul_no || '';
  D.okul_adi = p.okul_adi || '';
  yukle(p.cevaplar || {});
}

function sinifSube() {
  return D.sinif ? D.sinif + '-' + (D.sube || '') : '';
}

/* ------------------------------------------------------------------ */
/* Ekran geçişi                                                         */
/* ------------------------------------------------------------------ */
var EKRANLAR = ['karsilama', 'giris', 'kayit', 'kapi', 'test', 'rapor'];

function goster(ad) {
  EKRANLAR.forEach(function (e) {
    $('#ekran-' + e).classList.toggle('gizli', e !== ad);
  });
  window.scrollTo(0, 0);
  if (ad === 'kapi') kapiCiz();
}

/* ------------------------------------------------------------------ */
/* Holland altıgeni                                                     */
/* ------------------------------------------------------------------ */
var TIPLER = ['R', 'I', 'A', 'S', 'E', 'C'];
var TIP_ADI = { R: 'Gerçekçi', I: 'Araştırmacı', A: 'Sanatsal',
                S: 'Sosyal', E: 'Girişimci', C: 'Geleneksel' };
var MERKEZ = { x: 200, y: 168 }, YARICAP = 112;

function nokta(i, oran) {
  var a = (-90 + i * 60) * Math.PI / 180;
  return { x: MERKEZ.x + Math.cos(a) * YARICAP * oran,
           y: MERKEZ.y + Math.sin(a) * YARICAP * oran };
}

function cokgen(yuzdeler) {
  return TIPLER.map(function (t, i) {
    /* En düşük profil bile görünür kalsın diye taban 0.18 */
    var p = nokta(i, 0.18 + (yuzdeler[t] || 0) / 100 * 0.82);
    return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
  }).join(' ') + ' Z';
}

/* Rapor için sıfırdan bir altıgen svg'si üretir. */
function altigenSvg(baslik) {
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'altigen');
  svg.setAttribute('viewBox', '0 0 400 360');
  svg.setAttribute('role', 'img');
  var t = document.createElementNS(NS, 'title');
  t.textContent = baslik || 'Holland ilgi altıgeni';
  svg.appendChild(t);
  ['altigen-agi'].forEach(function (c) {
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', c); svg.appendChild(g);
  });
  var alan = document.createElementNS(NS, 'path');
  alan.setAttribute('class', 'altigen-alan'); alan.setAttribute('d', '');
  svg.appendChild(alan);
  ['altigen-noktalar', 'altigen-yazilar'].forEach(function (c) {
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', c); svg.appendChild(g);
  });
  return svg;
}

/* Altıgeni verilen svg içine kurar. Hem karşılamada hem raporda aynı
   işlev çağrılıyor, böylece iki yerde kimlik ikizlenmiyor. */
function altigenKur(svg) {
  var ag = $('.altigen-agi', svg), nk = $('.altigen-noktalar', svg),
      yz = $('.altigen-yazilar', svg);
  if (!ag) return;
  bosalt(ag); bosalt(nk); bosalt(yz);
  var NS = 'http://www.w3.org/2000/svg';
  var d = TIPLER.map(function (t, i) {
    var p = nokta(i, 1);
    return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
  }).join(' ') + ' Z';

  var dis = document.createElementNS(NS, 'path');
  dis.setAttribute('d', d); dis.setAttribute('class', 'altigen-kenar');
  ag.appendChild(dis);

  [0.66, 0.33].forEach(function (o) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', TIPLER.map(function (t, i) {
      var q = nokta(i, o);
      return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }).join(' ') + ' Z');
    p.setAttribute('class', 'altigen-kenar altigen-ic');
    ag.appendChild(p);
  });

  TIPLER.forEach(function (t, i) {
    var p = nokta(i, 1);
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 4.5);
    c.setAttribute('class', 'altigen-nokta');
    nk.appendChild(c);

    var e = nokta(i, 1.3);
    var y = document.createElementNS(NS, 'text');
    y.setAttribute('x', e.x); y.setAttribute('y', e.y + 4);
    y.setAttribute('class', 'altigen-yazi'); y.setAttribute('data-tip', t);
    y.setAttribute('text-anchor', e.x > MERKEZ.x + 8 ? 'start' : e.x < MERKEZ.x - 8 ? 'end' : 'middle');
    y.textContent = TIP_ADI[t];
    yz.appendChild(y);
  });
}

/* Karşılama ekranında üç örnek profil arasında geziniyor. Testi bitiren
   öğrenci aynı altıgende kendi çokgenini görüyor. */
var ORNEKLER = [
  { ad: 'Yazılım mühendisliği', kod: 'IRC', p: { R: 74, I: 92, A: 34, S: 26, E: 40, C: 68 } },
  { ad: 'Rehberlik ve psikolojik danışmanlık', kod: 'SIE', p: { R: 22, I: 66, A: 48, S: 94, E: 62, C: 36 } },
  { ad: 'Mimarlık', kod: 'AIR', p: { R: 62, I: 70, A: 93, S: 34, E: 44, C: 30 } }
];

var ornekSira = 0, ornekZaman = null;

function altigenYaz(svg, yuzdeler, vurgula) {
  var alan = $('.altigen-alan', svg);
  if (!alan) return;
  alan.setAttribute('d', cokgen(yuzdeler));
  var ust = vurgula || TIPLER.slice().sort(function (a, b) {
    return (yuzdeler[b] || 0) - (yuzdeler[a] || 0);
  }).slice(0, 3);
  $$('.altigen-yazilar text', svg).forEach(function (t) {
    t.classList.toggle('etkin', ust.indexOf(t.getAttribute('data-tip')) >= 0);
  });
}

function ornekDondur() {
  var o = ORNEKLER[ornekSira % ORNEKLER.length];
  altigenYaz($('#altigen-hero'), o.p);
  var durum = bosalt($('#altigen-durum'));
  durum.appendChild(document.createTextNode(o.ad + '  '));
  durum.appendChild(el('b', null, o.kod));
  ornekSira++;
}

function ornekBaslat() {
  ornekDondur();
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ornekZaman = setInterval(ornekDondur, 3600);
}

/* ------------------------------------------------------------------ */
/* Karşılama kartları                                                   */
/* ------------------------------------------------------------------ */
function ikonKutusu(k) {
  var w = el('span', { class: 'kart-ikon' });
  w.appendChild(ikon(IKONLAR[k]));
  return w;
}

function olcuSeridi(k, dk) {
  var olcu = el('div', { class: 'kart-olcu' });
  var a = el('span'); a.appendChild(el('b', null, olcuMetni(k)));
  var b = el('span'); b.appendChild(el('b', null, dk + ' dk'));
  olcu.appendChild(a); olcu.appendChild(b);
  return olcu;
}

function kartCiz(t, genis) {
  var k = el('article', { class: 'kart' + (genis ? ' kart-genis' : ''), 'data-k': t.k });
  k.style.setProperty('--ton', t.ton);
  k.appendChild(ikonKutusu(t.k));

  if (genis) {
    var orta = el('div');
    orta.appendChild(el('h3', null, t.ad));
    orta.appendChild(el('p', { class: 'kart-ne' }, t.ne));
    k.appendChild(orta);
  } else {
    k.appendChild(el('h3', null, t.ad));
    k.appendChild(el('p', { class: 'kart-ne' }, t.ne));
  }

  k.appendChild(olcuSeridi(t.k, t.dk));
  return k;
}

function karsilamaCiz() {
  /* ★ 20 Eyl 2026 — AYAR.KURUM ve AYAR.REHBER hiç tanımlı değildi (baglanti.js
     yalnız URUN, OGRETIM_YILI ve SAHIP tutuyor), sayfanın altında
     "undefined · 2026–2027 · undefined" yazıyordu. */
  $('#marka-kurum').textContent = AYAR.SAHIP;
  $('#alt-kurum').textContent = AYAR.SAHIP + ' · ' + AYAR.OGRETIM_YILI + ' · ' + AYAR.URUN;

  /* Yarım kalmış misafir çalışması varsa ana düğme onu söylesin. */
  var bd = $('#basla-dugme');
  if (bd) bd.textContent = misafirDolu() ? 'Kaldığın yerden devam et' : 'Kayıt olmadan başla';

  var oz = bosalt($('#kartlar-oz'));
  ENVANTERLER.filter(function (t) { return t.k !== 'yetenek'; })
    .forEach(function (t) { oz.appendChild(kartCiz(t, false)); });

  var yt = bosalt($('#kartlar-yetenek'));
  yt.appendChild(kartCiz(tanim('yetenek'), true));
}

/* ------------------------------------------------------------------ */
/* Giriş ve kayıt                                                       */
/* ------------------------------------------------------------------ */
function kutuYaz(kimlik, mesaj) {
  var k = $(kimlik);
  k.textContent = mesaj || '';
  k.classList.toggle('gizli', !mesaj);
}

function girisHata(m) { kutuYaz('#giris-hata', m); }
function kayitHata(m) { kutuYaz('#kayit-hata', m); }

/* Giriş yaptıktan sonra rol neredeyse oraya gönder. Rehber ve yönetici
   bu sayfada işini göremez, kendi paneline gitmeli. */
function roleGore(p) {
  if (!p || !p.rol) {
    if (p && p.kayitsiz) {
      /* Auth hesabı var, profili yok: e-posta doğrulamasından sonra
         kaydını yarım bırakmış. Formu şifresiz olarak yeniden aç. */
      goster('kayit');
      kutuYaz('#kayit-bilgi',
        'Hesabın açıldı. Kaydı tamamlamak için aşağıdaki bilgileri doldur.');
      var e = $('#kayit-eposta');
      e.value = p.eposta || e.value;
      e.readOnly = true;
      $('#kayit-sifre').parentNode.parentNode.classList.add('gizli');
      return true;
    }
    return false;
  }
  if (p.rol === 'rehber')   { location.href = 'panel.html';    return true; }
  if (p.rol === 'yonetici') { location.href = 'yonetici.html'; return true; }
  profiliAl(p);
  goster('kapi');
  return true;
}

function girisGonder(olay) {
  olay.preventDefault();
  girisHata(''); kutuYaz('#giris-bilgi', '');
  var e  = $('#giris-eposta').value.trim();
  var sf = $('#giris-sifre').value;
  if (!e || !sf) { girisHata('E-posta ve şifreni gir.'); return; }

  var d = $('#giris-dugme');
  d.disabled = true; d.textContent = 'Kontrol ediliyor';

  API.girisYap(e, sf)
    .then(function () { return API.durumTazele(); })
    .then(function (p) {
      $('#giris-sifre').value = '';
      if (!roleGore(p))
        girisHata('Bu hesabın kaydı tamamlanmamış. Kayıt formunu doldurman gerekiyor.');
    })
    .catch(function (x) { girisHata(x.message); })
    .then(function () { d.disabled = false; d.textContent = 'Gir'; });
}

function sifreUnuttumBas() {
  var e = $('#giris-eposta').value.trim();
  if (!e) {
    girisHata('Önce e-posta adresini yaz, sıfırlama bağlantısını oraya göndereyim.');
    return;
  }
  girisHata('');
  API.sifreUnuttum(e)
    .then(function () {
      kutuYaz('#giris-bilgi', 'Şifre sıfırlama bağlantısı ' + e +
        ' adresine gönderildi. Gelen kutunu kontrol et.');
    })
    .catch(function (x) { girisHata(x.message); });
}

/* Okul kodu yazılırken sunucuya sorup okulun adını gösteriyoruz.
   Öğrenci yanlış koda kaydolup başka okulda görünmesin. */
var kodZaman = null, sonKod = '';

function kodDenetle() {
  var alan = $('#okul-kodu');
  var kod = alan.value.trim().toUpperCase();
  if (alan.value !== kod) alan.value = kod;
  var d = $('#kod-durum');
  if (kodZaman) clearTimeout(kodZaman);

  if (kod.length < 4) { d.textContent = ''; d.className = 'kod-durum'; sonKod = ''; return; }
  if (kod === sonKod) return;

  d.textContent = 'Kontrol ediliyor';
  d.className = 'kod-durum';

  kodZaman = setTimeout(function () {
    API.rpcAnon('reh_okul_kodu_sor', { p_kod: kod }).then(function (g) {
      if ($('#okul-kodu').value.trim().toUpperCase() !== kod) return;
      sonKod = kod;
      if (g && g.gecerli) {
        d.textContent = g.okul_adi + (g.il ? '  \u00b7  ' + g.il : '');
        d.className = 'kod-durum olumlu';
      } else {
        d.textContent = (g && g.mesaj) || 'Bu okul kodu tanınmadı.';
        d.className = 'kod-durum olumsuz';
      }
    }).catch(function (x) {
      d.textContent = x.message;
      d.className = 'kod-durum olumsuz';
    });
  }, 450);
}

function kayitGonder(olay) {
  olay.preventDefault();
  kayitHata('');

  var kod    = $('#okul-kodu').value.trim().toUpperCase();
  var ad     = $('#kayit-ad').value.trim();
  var sinif  = parseInt($('#kayit-sinif').value, 10);
  var sube   = $('#kayit-sube').value;
  var no     = $('#kayit-no').value.trim();
  var eposta = $('#kayit-eposta').value.trim();
  var sifre  = $('#kayit-sifre').value;
  var sifre2 = $('#kayit-sifre2').value;
  var yeniHesap = !$('#kayit-eposta').readOnly;

  if (!kod) { kayitHata('Okul kodunu gir. Rehber öğretmeninden alabilirsin.'); return; }
  if (!ad)  { kayitHata('Ad soyadını gir.'); return; }
  if (!(sinif >= 9 && sinif <= 12)) { kayitHata('Sınıfını seç.'); return; }
  if (!sube) { kayitHata('Şubeni seç.'); return; }
  if (yeniHesap) {
    if (!eposta) { kayitHata('E-posta adresini gir.'); return; }
    if (sifre.length < 6) { kayitHata('Şifre en az 6 karakter olmalı.'); return; }
    if (sifre !== sifre2) { kayitHata('İki şifre aynı değil.'); return; }
  }

  var d = $('#kayit-dugme');
  d.disabled = true; d.textContent = 'Kaydediliyor';

  /* Taşıma sunucuca onaylandı mı: yerel veriyi ancak bu true olunca sileriz.
     Not: e-posta doğrulaması bu projede kapalı, o yüzden dogrulama_gerekli
     dalında taşıma yapılmıyor; açılırsa o dal için de taşıma gerekir. */
  var tasindi = false;
  var ilk = yeniHesap ? API.kayitOl(eposta, sifre) : Promise.resolve({});

  ilk.then(function (g) {
      if (g && g.dogrulama_gerekli) {
        kutuYaz('#kayit-bilgi', 'Hesabın açıldı. ' + eposta + ' adresine bir doğrulama ' +
          'bağlantısı gönderildi. Bağlantıya tıkladıktan sonra giriş yap, kaydın ' +
          'kaldığı yerden devam edecek.');
        return null;
      }
      return API.rpc('reh_ogrenci_kayit', {
        p_ad_soyad: ad, p_okul_kodu: kod, p_sinif: sinif,
        p_sube: sube, p_okul_no: no || null
      });
    })
    .then(function (g) {
      if (g === null) return null;
      if (!g || g.hata) throw new Error((g && g.hata) || 'Kayıt tamamlanamadı.');
      /* ★ 20 Eyl 2026 — MİSAFİR CEVAPLARINI HESABA TAŞI.
         kaydet() kullanılmıyor: onun catch'i hatayı yutup başarılı gibi
         dönüyor, o zaman aşağıda yerel veriyi silerdik ve öğrenci hem
         sunucuda hem tarayıcıda cevapsız kalırdı. Doğrudan RPC çağırıp
         sonucu denetliyoruz; yerel silme YALNIZ taşıma onaylanınca. */
      var yerel = misafirOku();
      var dolu = yerel && ENVANTERLER.some(function (t) {
        return Object.keys(yerel[t.k] || {}).length;
      });
      if (!dolu) return API.durumTazele();
      var paket = { bitti: yerel.bitti || {} };
      ENVANTERLER.forEach(function (t) { paket[t.k] = yerel[t.k] || {}; });
      return API.rpc('reh_envanter_kaydet', { p_cevaplar: paket, p_yetenek_basladi: false })
        .then(function (k) {
          if (k && k.hata) throw new Error('Hesabın açıldı ama cevapların taşınamadı: ' +
            k.hata + ' Cevapların tarayıcıda duruyor, çıkış yapınca geri gelir.');
          tasindi = true;
          return API.durumTazele();
        });
    })
    .then(function (p) {
      if (p === null) return;
      $('#kayit-sifre').value = ''; $('#kayit-sifre2').value = '';
      profiliAl(p);
      if (tasindi) {
        misafirSil();
        MISAFIR = false;
        kutuYaz('#kayit-bilgi', 'Hesabın açıldı, kayıt olmadan verdiğin cevaplar hesabına taşındı.');
      }
      goster('kapi');
    })
    .catch(function (x) { kayitHata(x.message); })
    .then(function () { d.disabled = false; d.textContent = 'Kaydol'; });
}

/* ------------------------------------------------------------------ */
/* Kayıt                                                                */
/* ------------------------------------------------------------------ */
function kayitYaz(m) {
  var k = $('#kayit-durum');
  if (k) k.textContent = m || '';
}

function kaydet(hemen, yetenekBasladi) {
  /* ★ 20 Eyl 2026 — Misafirde sunucu yok, tarayıcıya yazıyoruz. Kanca burada
     çünkü cevabın değiştiği her yol (likertSec, siraSec, sikSec, ileri,
     sureBitti, çık ve çıkış) zaten kaydet'ten geçiyor. 1400 ms'lik
     geciktirmenin ÖNÜNDE: misafirde beforeunload kancası çalışmıyor, sekme
     kapanırken son saniyelerin cevabı kaybolmasın. */
  if (!OTURUM.jwt) {
    misafirYaz();
    kayitYaz(MISAFIR_YAZILAMIYOR ? 'bu tarayıcıya yazılamıyor' : 'bu tarayıcıda saklandı');
    return Promise.resolve();
  }
  if (D.kayitBekliyor) { clearTimeout(D.kayitBekliyor); D.kayitBekliyor = null; }
  if (!hemen) {
    return new Promise(function (coz) {
      D.kayitBekliyor = setTimeout(function () { kaydet(true).then(coz); }, 1400);
    });
  }
  kayitYaz('kaydediliyor');
  return API.rpc('reh_envanter_kaydet', {
    p_cevaplar: paketle(), p_yetenek_basladi: !!yetenekBasladi
  })
    .then(function (g) {
      if (g && g.hata) throw new Error(g.hata);
      /* Sunucu kapanmış envanteri ve süre başlangıcını kendi bildiği gibi
         geri gönderiyor, yerel durumu ona göre tazeliyoruz. */
      if (g && g.cevaplar) yukle(g.cevaplar);
      D.sonKayit = new Date();
      kayitYaz('kaydedildi');
      return g;
    })
    .catch(function (e) {
      kayitYaz('kaydedilemedi');
      testHata(e.message + ' Cevapların tarayıcıda duruyor, bağlantı gelince tekrar dene.');
    });
}

function testHata(m) {
  var k = $('#test-hata');
  k.textContent = m || '';
  k.classList.toggle('gizli', !m);
}

/* ------------------------------------------------------------------ */
/* Kapı: hangi envanter açık, hangisi bitti                             */
/* ------------------------------------------------------------------ */
function doluSayisi(k) {
  if (k === 'deger')
    return Object.keys(D.cevaplar.deger || {}).filter(turTamam).length;
  return Object.keys(D.cevaplar[k] || {}).length;
}

function kapiCiz() {
  /* ★ 20 Eyl 2026 — Misafirde ad ve okul yok; eski hâlinde selam
     ", nereden devam edelim" diye başlıyor, kimlik satırı boş ayraç diziyordu. */
  var mis = !OTURUM.jwt;
  $('#kapi-kim').textContent = mis ? 'Misafir' :
    (D.ad_soyad + (sinifSube() ? ' · ' + sinifSube() : '') +
     (D.okul_adi ? ' · ' + D.okul_adi : ''));
  $('#kapi-selam').textContent = mis ? 'Nereden başlayalım'
    : (D.ad_soyad.split(' ')[0] + ', nereden devam edelim');

  /* Misafir kutusu gövdede duruyor, üst bardaki #kapi-kim mobilde gizleniyor
     (stil.css) ve tek işaret olarak güvenilmez. */
  var mk = $('#kapi-misafir');
  if (mk) {
    mk.classList.toggle('gizli', !mis);
    var uyari = $('#kapi-misafir-uyari');
    if (uyari) {
      uyari.textContent = MISAFIR_YAZILAMIYOR
        ? 'Bu tarayıcı kayıt tutmuyor (özel pencere olabilir). Sayfayı kapatırsan cevapların gider.'
        : '';
      uyari.classList.toggle('gizli', !MISAFIR_YAZILAMIYOR);
    }
  }
  var cd = $('#cikis-dugme');
  if (cd) cd.textContent = mis ? 'Bitir' : 'Çıkış';

  var bittiSayi = ENVANTERLER.filter(function (t) { return D.bitti[t.k]; }).length;
  $('#kapi-ilerleme').textContent = bittiSayi + ' / 5 envanter tamam';

  var k = bosalt($('#kapi-kartlar'));
  ENVANTERLER.forEach(function (t) {
    var tamam = !!D.bitti[t.k];
    var dolu = doluSayisi(t.k), toplam = soruSayisi(t.k);

    var kart = el('article', { class: 'kart', 'data-durum': tamam ? 'bitti' : 'acik' });
    kart.style.setProperty('--ton', t.ton);

    kart.appendChild(ikonKutusu(t.k));

    if (tamam) kart.appendChild(el('span', { class: 'kart-rozet' }, 'Tamamlandı'));

    kart.appendChild(el('h3', null, t.ad));
    kart.appendChild(el('p', { class: 'kart-ne' },
      tamam ? t.ne : (dolu ? dolu + ' / ' + toplam + ' cevaplandı. Kaldığın yerden devam edeceksin.' : t.ne)));

    var ac = el('details', { class: 'kart-ne' });
    ac.appendChild(el('summary', { class: 'ac-basligi' },
      'Başlamadan önce'));
    ac.appendChild(el('p', { style: 'margin:10px 0 0;font-size:14px' }, t.bilgi));
    kart.appendChild(ac);

    kart.appendChild(olcuSeridi(t.k, t.dk));

    kart.appendChild(el('button', {
      class: 'dugme ' + (tamam ? 'dugme-cizgi' : 'dugme-ana'),
      style: 'margin-top:16px;justify-content:center',
      onclick: function () { testAc(t.k); }
    }, tamam ? 'Cevaplarımı gör' : (dolu ? 'Devam et' : 'Başla')));

    k.appendChild(kart);
  });

  $('#rapor-dugme').classList.toggle('gizli', bittiSayi === 0);
  $('#rapor-dugme').textContent = bittiSayi === 5
    ? 'Raporumu gör' : 'Raporumu gör (' + (5 - bittiSayi) + ' envanter eksik)';
}

/* ------------------------------------------------------------------ */
/* Test motoru                                                          */
/* ------------------------------------------------------------------ */
var SAYFA_MADDE = 10;
var sayacZaman = null;

function testAc(k) {
  D.aktif = k;
  D.sayfa = 0;
  testHata('');
  var t = tanim(k);
  $('#test-ad').textContent = t.ad;
  $('#ekran-test').style.setProperty('--ton', t.ton);
  $('#test-yonerge').style.setProperty('--ton', t.ton);
  $('#test-ilerleme').style.setProperty('--ton', t.ton);

  if (k === 'yetenek' && !D.bitti.yetenek && !D.yetenek_baslangic) {
    /* ★ 20 Eyl 2026 — Kayıtlıda saati sunucu damgalıyor. Misafirde sunucu yok,
       damgayı istemci atıyor ve yerele yazılıyor, böylece sayfa tazelenince
       süre kaldığı yerden işler. Tarayıcıdaki damga kurcalanabilir; sonuç
       kimseye raporlanmadığı için bu kabul edildi. */
    if (!OTURUM.jwt) D.yetenek_baslangic = new Date().toISOString();
    goster('test');
    sayfaCiz();
    kaydet(true, true).then(function () { sayfaCiz(); });
    return;
  }
  goster('test');
  sayfaCiz();
}

/* Tamamlanan envanter bir daha değişmez. Sunucu zaten eski cevabı geri
   koyuyor, arayüz de tıklamayı hiç kabul etmesin ki öğrenci değiştirdim
   sanıp sonra geri döndüğünü görmesin. */
function kilitli() { return !!D.bitti[D.aktif]; }

function sonSayfa() {
  var k = D.aktif;
  if (k === 'deger') return env(k).turlar.length - 1;
  if (k === 'yetenek') return env(k).maddeler.length - 1;
  return Math.ceil(env(k).maddeler.length / SAYFA_MADDE) - 1;
}

function sayfaCiz() {
  var k = D.aktif, g = bosalt($('#test-govde'));
  testHata('');
  if (k === 'deger') turCiz(g);
  else if (k === 'yetenek') yetenekCiz(g);
  else likertCiz(g);

  if (kilitli()) {
    $('#test-yonerge').textContent = 'Bu envanteri tamamladın, cevapların ' +
      'değiştirilemez. Yeniden doldurman gerekiyorsa rehber öğretmeninden ' +
      'envanteri yeniden açmasını iste.';
    $$('#test-govde button').forEach(function (d) {
      if (d.classList.contains('secenek') || d.classList.contains('sirala-oge') ||
          d.classList.contains('sik')) d.disabled = true;
    });
  }

  var son = D.sayfa >= sonSayfa();
  $('#test-geri').disabled = D.sayfa === 0;
  $('#test-ileri').textContent = son ? (D.bitti[k] ? 'Kapıya dön' : 'Bitir ve kaydet') : 'İleri';
  ilerlemeCiz();
  window.scrollTo(0, 0);
}

function ilerlemeCiz() {
  var k = D.aktif, dolu = doluSayisi(k), toplam = soruSayisi(k);
  $('#test-ilerleme').style.width = Math.round(100 * dolu / toplam) + '%';
  var s = $('#test-sayac');
  if (k === 'yetenek' && !D.bitti.yetenek) { sureCiz(); return; }
  s.classList.remove('az');
  bosalt(s).appendChild(el('span', null, null));
  s.firstChild.appendChild(el('b', null, String(dolu)));
  s.firstChild.appendChild(document.createTextNode(' / ' + toplam + ' cevaplandı'));
}

/* ---- Likert ---- */
function likertCiz(g) {
  var k = D.aktif, e = env(k);
  var bas = D.sayfa * SAYFA_MADDE;
  var dilim = e.maddeler.slice(bas, bas + SAYFA_MADDE);

  $('#test-yonerge').textContent = k === 'ilgi'
    ? 'Her satırdaki işi yapmak sana ne kadar çekici geliyor, onu işaretle. Yapabilir misin diye değil, hoşuna gider mi diye düşün.'
    : k === 'beceri'
      ? 'Her satırdaki işi bugün ne kadar iyi yapabileceğini işaretle. Hiç denemediysen denesen ne olurdu, onu tahmin et.'
      : 'Her cümle sana ne kadar uyuyor, onu işaretle. Doğru ya da yanlış cevap yok.';

  dilim.forEach(function (m) {
    var madde = el('div', { class: 'madde', 'data-n': m.n });
    var metin = el('div', { class: 'madde-metin' });
    metin.appendChild(el('span', { class: 'madde-no' }, m.n + '.'));
    metin.appendChild(el('span', null, m.m));
    madde.appendChild(metin);

    var grup = el('div', {
      class: 'secenekler', role: 'radiogroup',
      'aria-label': m.n + '. madde: ' + m.m
    });

    e.olcek.forEach(function (etiket, i) {
      var secili = D.cevaplar[k][m.n] === i + 1;
      var d = el('button', {
        type: 'button', class: 'secenek', role: 'radio',
        'aria-checked': secili ? 'true' : 'false',
        /* Dar ekranda ortadaki etiketler gizleniyor, ad buradan geliyor. */
        'aria-label': etiket,
        tabindex: (secili || (!D.cevaplar[k][m.n] && i === 0)) ? '0' : '-1',
        onclick: function () { likertSec(m.n, i + 1); },
        onkeydown: function (o) { likertTus(o, m.n, i); }
      });
      d.appendChild(el('span', { class: 'kabarcik', 'aria-hidden': 'true' }));
      d.appendChild(el('span', { class: 'secenek-yazi' }, etiket));
      grup.appendChild(d);
    });

    madde.appendChild(grup);

    /* Telefonda beş etiket sığmıyor, ölçeğin iki ucunu ayrı satıra alıyoruz. */
    var uclar = el('div', { class: 'olcek-uclari', 'aria-hidden': 'true' });
    uclar.appendChild(el('span', null, e.olcek[0]));
    uclar.appendChild(el('span', null, e.olcek[e.olcek.length - 1]));
    madde.appendChild(uclar);

    g.appendChild(madde);
  });
}

function likertSec(n, deger) {
  D.cevaplar[D.aktif][n] = deger;
  var madde = $('.madde[data-n="' + n + '"]');
  madde.classList.remove('cevapsiz-vurgu');
  $$('.secenek', madde).forEach(function (d, i) {
    var secili = i + 1 === deger;
    d.setAttribute('aria-checked', secili ? 'true' : 'false');
    d.setAttribute('tabindex', secili ? '0' : '-1');
  });
  ilerlemeCiz();
  kaydet(false);
}

/* Ok tuşlarıyla gezinme ve 1-5 ile doğrudan seçim. 70 maddeyi klavyeyle
   dolduran öğrenci fareye hiç uzanmasın. */
function likertTus(olay, n, i) {
  var yon = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[olay.key];
  if (yon) {
    olay.preventDefault();
    var hedef = Math.max(0, Math.min(4, i + yon));
    var dugmeler = $$('.secenek', $('.madde[data-n="' + n + '"]'));
    dugmeler[hedef].focus();
    likertSec(n, hedef + 1);
    return;
  }
  if (olay.key >= '1' && olay.key <= '5') {
    olay.preventDefault();
    var s = parseInt(olay.key, 10);
    $$('.secenek', $('.madde[data-n="' + n + '"]'))[s - 1].focus();
    likertSec(n, s);
  }
}

/* ---- Sıralama turu ---- */
function turCiz(g) {
  var e = env('deger'), tur = e.turlar[D.sayfa];
  $('#test-yonerge').textContent = tur.yonerge;

  var mevcut = D.cevaplar.deger[tur.n] || [];
  var liste = el('div', { class: 'sirala-liste' });

  tur.secenekler.forEach(function (s) {
    var sira = mevcut.indexOf(s.b);
    var d = el('button', {
      type: 'button', class: 'sirala-oge',
      'data-b': s.b,
      onclick: function () { siraSec(tur.n, s.b); }
    });
    if (sira >= 0) d.setAttribute('data-sira', sira + 1);
    d.appendChild(el('span', { class: 'sirala-rozet' }, sira >= 0 ? String(sira + 1) : '·'));
    d.appendChild(el('span', null, s.m));
    liste.appendChild(d);
  });

  g.appendChild(liste);
  g.appendChild(el('p', { class: 'yardim-yazi' },
    mevcut.length === 6
      ? 'Altısını da sıraladın. Değiştirmek istersen bir seçeneğe tekrar dokun.'
      : 'Sırada ' + (mevcut.length + 1) + '. seçim var. Seçtiğin sıraya göre numaralanır.'));
}

function siraSec(turNo, kod) {
  var mevcut = (D.cevaplar.deger[turNo] || []).slice();
  var yer = mevcut.indexOf(kod);
  /* Sıralanmış bir seçeneğe tekrar dokunmak onu listeden çıkarır, kalanlar
     kendiliğinden yukarı kayar. Yarım sıralama saklanır, yalnız sayılmaz. */
  if (yer >= 0) mevcut.splice(yer, 1);
  else mevcut.push(kod);
  D.cevaplar.deger[turNo] = mevcut;
  sayfaCiz();
  kaydet(false);
}

/* Bir tur ancak altı seçeneğin tamamı sıralandığında tamamlanmış sayılır,
   yarım sıralama puanlamaya girerse boyut puanları bozulur. */
function turTamam(turNo) {
  return (D.cevaplar.deger[turNo] || []).length === 6;
}

/* ---- Yetenek testi ---- */
function yetenekCiz(g) {
  var e = env('yetenek'), m = e.maddeler[D.sayfa];
  var alanAdi = (e.boyutlar.filter(function (b) { return b.k === m.b; })[0] || {}).ad || '';
  $('#test-yonerge').textContent = alanAdi + ' · ' + (D.sayfa + 1) + '. soru';

  if (m.tablo) {
    var t = el('table', { class: 'soru-tablo' });
    t.appendChild(el('caption', null, m.tablo.baslik));
    var ust = el('tr');
    m.tablo.basliklar.forEach(function (b) { ust.appendChild(el('th', null, b)); });
    t.appendChild(el('thead', null, ust));
    var govde = el('tbody');
    m.tablo.satirlar.forEach(function (s) {
      var tr = el('tr');
      s.forEach(function (h) { tr.appendChild(el('td', null, String(h))); });
      govde.appendChild(tr);
    });
    t.appendChild(govde);
    g.appendChild(t);
  }

  g.appendChild(el('p', { class: 'soru-kok' }, m.s));

  /* Uzamsal maddelerin çizimi henüz hazır değil. Şekli sözle tarif ediyoruz,
     öğrenci zihninde canlandırıp çözebilsin. */
  if (m.g && m.g.tarif) {
    var n = el('div', { class: 'cizim-notu' });
    n.appendChild(el('b', null, 'Şekil'));
    n.appendChild(document.createTextNode(m.g.tarif));
    g.appendChild(n);
  }

  var siklar = el('div', { class: 'siklar', role: 'radiogroup', 'aria-label': 'Seçenekler' });
  var HARF = ['A', 'B', 'C', 'D', 'E'];
  m.sec.forEach(function (o, i) {
    var secili = D.cevaplar.yetenek[m.n] === i;
    var d = el('button', {
      type: 'button', class: 'sik', role: 'radio',
      'aria-checked': secili ? 'true' : 'false',
      onclick: function () { sikSec(m.n, i); }
    });
    d.appendChild(el('span', { class: 'sik-harf' }, HARF[i]));
    d.appendChild(el('span', null, String(o)));
    siklar.appendChild(d);
  });
  g.appendChild(siklar);

  var ag = el('div', { class: 'soru-agi', role: 'group', 'aria-label': 'Soru listesi' });
  e.maddeler.forEach(function (x, i) {
    ag.appendChild(el('button', {
      type: 'button',
      'data-cevapli': D.cevaplar.yetenek[x.n] !== undefined ? '1' : '0',
      'aria-current': i === D.sayfa ? 'true' : null,
      'aria-label': x.n + '. soru' + (D.cevaplar.yetenek[x.n] !== undefined ? ', cevaplandı' : ''),
      onclick: function () { D.sayfa = i; sayfaCiz(); }
    }, String(x.n)));
  });
  g.appendChild(ag);
}

function sikSec(n, i) {
  D.cevaplar.yetenek[n] = i;
  sayfaCiz();
  kaydet(false);
}

/* Süre başlangıçtan sayılır, sayfayı yenilemek süre kazandırmaz. */
function sureCiz() {
  var s = $('#test-sayac');
  if (!D.yetenek_baslangic) { s.textContent = ''; return; }
  var bitis = new Date(D.yetenek_baslangic).getTime() + env('yetenek').sure * 60000;
  var kalan = Math.max(0, bitis - Date.now());
  var dk = Math.floor(kalan / 60000), sn = Math.floor(kalan % 60000 / 1000);
  bosalt(s);
  s.appendChild(el('b', null, dk + ':' + (sn < 10 ? '0' : '') + sn));
  s.appendChild(document.createTextNode(' kaldı'));
  s.classList.toggle('az', kalan < 5 * 60000);
  if (kalan <= 0) { sureBitti(); return; }
  if (!sayacZaman) sayacZaman = setInterval(function () {
    if (D.aktif === 'yetenek' && !$('#ekran-test').classList.contains('gizli')) sureCiz();
    else { clearInterval(sayacZaman); sayacZaman = null; }
  }, 1000);
}

function sureBitti() {
  if (sayacZaman) { clearInterval(sayacZaman); sayacZaman = null; }
  if (D.bitti.yetenek) return;
  D.bitti.yetenek = true;
  kaydet(true).then(function () {
    alert('Yetenek testinin süresi doldu. Cevapların kaydedildi.');
    goster('kapi');
  });
}

/* ---- Gezinme ---- */
function eksikMaddeler() {
  var k = D.aktif;
  if (k === 'deger') return turTamam(env(k).turlar[D.sayfa].n) ? [] : ['tur'];
  if (k === 'yetenek') return [];
  var bas = D.sayfa * SAYFA_MADDE;
  return env(k).maddeler.slice(bas, bas + SAYFA_MADDE)
    .filter(function (m) { return !D.cevaplar[k][m.n]; })
    .map(function (m) { return m.n; });
}

function ileri() {
  var k = D.aktif;
  if (!D.bitti[k]) {
    var eksik = eksikMaddeler();
    if (eksik.length) {
      if (k === 'deger') testHata('Devam etmek için altı seçeneği de sırala.');
      else {
        testHata(eksik.length + ' madde boş kaldı. Hepsini işaretlemen gerekiyor.');
        eksik.forEach(function (n) {
          var el2 = $('.madde[data-n="' + n + '"]');
          if (el2) el2.classList.add('cevapsiz-vurgu');
        });
        var ilk = $('.madde.cevapsiz-vurgu');
        if (ilk) ilk.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return;
    }
  }

  if (D.sayfa < sonSayfa()) { D.sayfa++; sayfaCiz(); return; }

  if (D.bitti[k]) { goster('kapi'); return; }

  if (k === 'yetenek') {
    var bos = env('yetenek').maddeler.filter(function (m) {
      return D.cevaplar.yetenek[m.n] === undefined;
    }).length;
    if (bos && !confirm(bos + ' soru boş kaldı. Boş soru yanlış sayılıyor. Yine de bitirilsin mi?')) return;
  }

  D.bitti[k] = true;
  $('#test-ileri').disabled = true;
  kaydet(true).then(function () {
    $('#test-ileri').disabled = false;
    goster('kapi');
  });
}

/* ------------------------------------------------------------------ */
/* Rapor                                                                */
/* ------------------------------------------------------------------ */
function profilHesapla() {
  var cevaplar = {};
  ENVANTERLER.forEach(function (t) {
    if (!D.bitti[t.k]) return;
    if (t.k === 'deger') {
      /* Yalnız tamamlanmış turlar puanlamaya gider. */
      var s = {};
      Object.keys(D.cevaplar.deger).forEach(function (n) {
        if (turTamam(n)) s[n] = D.cevaplar.deger[n];
      });
      cevaplar.deger = s;
    } else {
      var c = {}, ham = D.cevaplar[t.k];
      Object.keys(ham).forEach(function (n) { c[+n] = ham[n]; });
      cevaplar[t.k] = c;
    }
  });
  return PUANLAMA.profilCikar({
    kisilik: window.ENV_KISILIK, ilgi: window.ENV_ILGI, deger: window.ENV_DEGER,
    beceri: window.ENV_BECERI, yetenek: window.ENV_YETENEK
  }, cevaplar);
}

function cubuk(ad, yuzde, ton) {
  var s = el('div', { class: 'cubuk-satir' });
  var e = el('div', { class: 'cubuk-etiket' });
  e.appendChild(el('span', null, ad));
  e.appendChild(el('span', { class: 'deger' }, yuzde + '%'));
  s.appendChild(e);
  var yol = el('div', { class: 'cubuk-yol' });
  var dolu = el('div', { class: 'cubuk-dolu' });
  dolu.style.setProperty('--ton', ton);
  /* Genişlik hemen yazılıyor, açılma hareketi CSS anahtar karesinden geliyor.
     Böylece sekme arka plandayken de çubuk doğru uzunlukta duruyor. */
  dolu.style.width = yuzde + '%';
  yol.appendChild(dolu);
  s.appendChild(yol);
  return s;
}

function profilKutu(t, profil) {
  var e = env(t.k);
  var kutu = el('section', { class: 'profil-kutu' });
  kutu.appendChild(el('h3', null, t.ad));

  if (!D.bitti[t.k]) {
    kutu.appendChild(el('p', { class: 'alt-not' },
      'Bu envanteri doldurmadın. Bölüm sıralamasında bu bölüm ortalama sayıldı.'));
    return kutu;
  }

  if (t.k === 'yetenek') {
    var h = profil.ham.yetenek;
    kutu.appendChild(el('p', { class: 'alt-not' },
      h.dogru + ' / ' + h.soru + ' doğru' + (h.bos ? ', ' + h.bos + ' soru boş' : '')));
  } else {
    kutu.appendChild(el('p', { class: 'alt-not' }, 'Kendi boyutların içindeki sıralaman'));
  }

  var y = profil[t.k];
  e.boyutlar.slice().sort(function (a, b) { return y[b.k] - y[a.k]; })
    .forEach(function (b) { kutu.appendChild(cubuk(b.ad, y[b.k], t.ton)); });
  return kutu;
}

function raporCiz() {
  var profil = profilHesapla();
  var g = bosalt($('#rapor-govde'));

  /* Başlık */
  var bas = el('section', { class: 'rapor-basi' });
  bas.appendChild(el('div', { class: 'hero-goz' }, 'Kendini tanı raporu'));
  /* ★ 20 Eyl 2026 — Misafirde ad ve okul yok; başlık boş kalmasın. */
  bas.appendChild(el('h1', null, D.ad_soyad || 'Raporun'));
  bas.appendChild(el('p', { class: 'rapor-kim' },
    [D.okul_adi, sinifSube(), D.okul_no ? 'Okul no ' + D.okul_no : '', AYAR.OGRETIM_YILI]
      .filter(Boolean).join('  ·  ')));
  g.appendChild(bas);

  if (profil.eksikEnvanter.length) {
    var eksikAdlar = profil.eksikEnvanter.map(function (k) { return tanim(k).ad; });
    g.appendChild(el('div', { class: 'uyari-kutu', style: 'margin-bottom:26px' },
      eksikAdlar.join(', ') + ' doldurulmadı. Bu envanterler ortalama sayıldığı için ' +
      'bölüm sıralaması eksik bilgiyle çıkıyor. Tamamlayınca sıralama değişecek.'));
  }

  /* Holland kodu ve altıgen */
  if (profil.hollandKodu) {
    var h = el('section', { class: 'bolum', style: 'padding-top:10px' });
    var basi = el('div', { class: 'bolum-basi' });
    basi.appendChild(el('h2', null, 'İlgi profilin'));
    basi.appendChild(el('span', { class: 'kenar-not' },
      'Holland kodu ' + profil.hollandKodu));
    h.appendChild(basi);

    var ikili = el('div', { style: 'display:grid;gap:30px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));align-items:center' });
    var svgKutu = el('div', { class: 'altigen-kutu' });
    var svg = altigenSvg('Senin ilgi profilin');
    svgKutu.appendChild(svg);
    svgKutu.appendChild(el('div', { class: 'altigen-durum' }, 'Senin profilin'));
    ikili.appendChild(svgKutu);

    var aciklama = el('div');
    var ilkUc = profil.hollandKodu.split('');
    aciklama.appendChild(el('p', null,
      'En yüksek üç tipin ' + ilkUc.map(function (t) { return TIP_ADI[t]; }).join(', ') +
      '. Bölüm sıralamasının yüzde 35’i bu üç harfe dayanıyor.'));
    aciklama.appendChild(el('p', { class: 'aciklama-yazi' },
      profil.tutarlilik === 3
        ? 'İlk iki tipin altıgende yan yana duruyor. İlgilerin birbirini destekliyor, bu da hangi alanı seçeceğini netleştiriyor.'
        : profil.tutarlilik === 2
          ? 'İlk iki tipin altıgende bir köşe arayla duruyor. İlgilerin iki ayrı yöne bakıyor, listede farklı alanlar görmen normal.'
          : 'İlk iki tipin altıgende karşı köşelerde. Birbirinden uzak iki şeyi birden istiyorsun, bu yüzden listedeki bölümler dağınık çıkabilir.'));
    ikili.appendChild(aciklama);
    h.appendChild(ikili);
    g.appendChild(h);

    altigenKur(svg);
    /* Değer doğrudan yazılıyor. requestAnimationFrame'e bağlanırsa arka plandaki
       sekmede geri çağrı çalışmıyor ve altıgen boş kalıyor. */
    altigenYaz(svg, profil.ilgi, ilkUc);
  }

  /* Beş profil kutusu */
  var p = el('section', { class: 'bolum' });
  var pb = el('div', { class: 'bolum-basi' });
  pb.appendChild(el('h2', null, 'Beş envanterin sonucu'));
  p.appendChild(pb);
  var agi = el('div', { class: 'profil-agi' });
  ENVANTERLER.forEach(function (t) { agi.appendChild(profilKutu(t, profil)); });
  p.appendChild(agi);
  g.appendChild(p);

  /* Bölüm sıralaması */
  var BILESEN_ADI = { ilgi: 'İlgi', yetenek: 'Yetenek', beceri: 'Beceri', deger: 'Değer' };
  var BILESEN_TON = { ilgi: 'var(--ilgi)', yetenek: 'var(--yetenek)',
                      beceri: 'var(--beceri)', deger: 'var(--deger)' };

  var oneri = PUANLAMA.bolumOner(window.ENV_BOLUMLER, profil, 15, 4);
  var b = el('section', { class: 'bolum' });
  var bb = el('div', { class: 'bolum-basi' });
  bb.appendChild(el('h2', null, 'Sana en çok uyan bölümler'));
  bb.appendChild(el('span', { class: 'kenar-not' }, '70 bölüm arasından 15’i'));
  b.appendChild(bb);

  b.appendChild(el('p', { class: 'aciklama-yazi bolum-girisi' },
    'Uyum puanı ilgi, yetenek, beceri ve değer profilinin bölümün gerektirdiklerine ne kadar ' +
    'yaklaştığını gösterir. Taban puan ve kontenjan bu hesaba girmez, onları YÖK Atlas’tan bak.'));

  var gosterge = el('div', { class: 'bilesen-gosterge' });
  ['ilgi', 'yetenek', 'beceri', 'deger'].forEach(function (k) {
    var p = el('span');
    var kutu = el('i'); kutu.style.background = BILESEN_TON[k];
    p.appendChild(kutu);
    p.appendChild(document.createTextNode(BILESEN_ADI[k]));
    gosterge.appendChild(p);
  });
  b.appendChild(gosterge);

  oneri.liste.forEach(function (x) {
    var satir = el('div', { class: 'bolum-satir' });

    var u = el('div', { class: 'bolum-uyum' }, String(x.uyum));
    u.appendChild(el('span', null, 'UYUM'));
    satir.appendChild(u);

    var orta = el('div');
    orta.appendChild(el('div', { class: 'bolum-ad' }, x.ad));
    orta.appendChild(el('div', { class: 'bolum-bilgi' }, x.isler));

    var etiketler = el('div', { class: 'bolum-etiketler' });
    etiketler.appendChild(el('span', { class: 'etiket etiket-puan' }, x.puan + ' puanı'));
    etiketler.appendChild(el('span', { class: 'etiket' }, x.holland));
    etiketler.appendChild(el('span', { class: 'etiket' }, x.grup));
    orta.appendChild(etiketler);

    /* Dört bileşenin her biri kendi mini çubuğu. Dolu kısım o bileşenin
       yüzdesi, böylece uyumun nereden geldiği ve nerede düştüğü görünüyor. */
    var bil = el('div', { class: 'bilesen-cubuklar' });
    Object.keys(x.bilesen).forEach(function (k) {
      var i = el('i', { title: BILESEN_ADI[k] + ' ' + x.bilesen[k] });
      i.style.background = 'linear-gradient(to right, ' + BILESEN_TON[k] + ' ' +
        x.bilesen[k] + '%, var(--cizgi) ' + x.bilesen[k] + '%)';
      bil.appendChild(i);
    });
    orta.appendChild(bil);

    orta.appendChild(el('p', { class: 'bolum-kayit' }, x.not));

    x.gerekce.notlar.forEach(function (n) {
      orta.appendChild(el('div', { class: 'bolum-not' }, n));
    });

    satir.appendChild(orta);
    b.appendChild(satir);
  });
  g.appendChild(b);

  /* ★ 20 Eyl 2026 — Misafire rapor sonunda saklama teklifi. Rapor uzun,
     üstteki düğmelere dönmek için yukarı çıkmak gerekiyor; teklif de,
     envanterlere dönüş de burada dursun. */
  if (!OTURUM.jwt) {
    var t = el('section', { class: 'bilgi-kutu', style: 'margin-top:28px' });
    t.appendChild(el('p', { style: 'margin:0 0 12px' },
      'Bu rapor yalnız bu tarayıcıda duruyor. Okul kodun varsa hesap aç, raporun ' +
      'hesabına taşınsın ve rehber öğretmenin de görsün. Kodun yoksa raporu yazdırıp saklayabilirsin.'));
    var td = el('div', { class: 'dugmeler' });
    td.appendChild(el('button', {
      class: 'dugme dugme-ana', type: 'button',
      onclick: function () { goster('kayit'); }
    }, 'Hesap aç ve sakla'));
    td.appendChild(el('button', {
      class: 'dugme dugme-cizgi', type: 'button',
      onclick: function () { window.print(); }
    }, 'Yazdır'));
    t.appendChild(td);
    g.appendChild(t);
  }

  g.appendChild(el('footer', { class: 'alt-bilgi' },
    el('p', null, 'Bu rapor bir karar değil, bir başlangıçtır. Rehber öğretmeninle birlikte oku.')));
}

/* ------------------------------------------------------------------ */
/* Bağlama                                                              */
/* ------------------------------------------------------------------ */
function kur() {
  karsilamaCiz();
  altigenKur($('#altigen-hero'));
  ornekBaslat();
  subeleriDoldur();

  $$('[data-git]').forEach(function (d) {
    d.addEventListener('click', function () {
      var hedef = d.getAttribute('data-git');
      var ogrenci = OTURUM.profil && OTURUM.profil.rol === 'ogrenci';
      /* ★ 20 Eyl 2026 — misafir dalı: oturum açmadan doğrudan envanterlere. */
      if (hedef === 'misafir') {
        if (ogrenci) { goster('kapi'); return; }
        misafirBaslat();
        return;
      }
      /* Misafirin cevapları varken GİRİŞ yapmak onları eziyor: roleGore →
         profiliAl → yukle, D.cevaplar sunucudakiyle değişiyor. Sessizce
         kaybettirmek yerine soruyoruz. Cevaplar yine de tarayıcıda kalıyor. */
      if (hedef === 'giris' && !OTURUM.jwt && misafirDolu() &&
          !window.confirm('Kayıt olmadan verdiğin cevaplar bu tarayıcıda duruyor. ' +
            'Giriş yaparsan ekranda hesabındaki cevaplar açılır. ' +
            'Buradaki cevaplar silinmez, çıkış yapınca geri gelir. Devam edilsin mi?'))
        return;
      if ((hedef === 'giris' || hedef === 'kayit') && ogrenci) { goster('kapi'); return; }
      goster(hedef);
    });
  });

  $('#giris-form').addEventListener('submit', girisGonder);
  $('#kayit-form').addEventListener('submit', kayitGonder);
  $('#okul-kodu').addEventListener('input', kodDenetle);
  $('#sifre-unuttum').addEventListener('click', sifreUnuttumBas);

  $('#test-ileri').addEventListener('click', ileri);
  $('#test-geri').addEventListener('click', function () {
    if (D.sayfa > 0) { D.sayfa--; sayfaCiz(); }
  });
  $('#test-cik').addEventListener('click', function () {
    kaydet(true).then(function () { goster('kapi'); });
  });
  $('#rapor-dugme').addEventListener('click', function () {
    raporCiz(); goster('rapor');
  });
  $('#yazdir-dugme').addEventListener('click', function () { window.print(); });
  $('#cikis-dugme').addEventListener('click', function () {
    /* ★ 20 Eyl 2026 — Misafirin çıkacağı bir hesap yok; sunucuya gitmek
       yerine tanıtıma dönüyor. Cevaplar SİLİNMİYOR, silme ayrı düğmede. */
    if (!OTURUM.jwt) {
      kaydet(true).then(function () { MISAFIR = false; karsilamaCiz(); goster('karsilama'); });
      return;
    }
    kaydet(true)
      .then(function () { return API.cikis(); })
      .then(function () { location.reload(); });
  });

  /* ★ 20 Eyl 2026 — Paylaşılan bilgisayarda kendinden sonrakine cevap
     bırakmamak için. Geri alınamaz, o yüzden soruyor. */
  var sifirla = $('#misafir-sifirla');
  if (sifirla) sifirla.addEventListener('click', function () {
    if (!window.confirm('Bu tarayıcıdaki bütün cevapların silinsin mi? Geri alınamaz.')) return;
    misafirSil();
    yukle({});
    D.yetenek_baslangic = null;
    MISAFIR = false;
    karsilamaCiz();
    goster('karsilama');
  });

  /* Sekme kapanırken bekleyen kayıt varsa keepalive isteğiyle gönder. */
  window.addEventListener('beforeunload', function () {
    if (!D.kayitBekliyor || !OTURUM.jwt) return;
    clearTimeout(D.kayitBekliyor);
    D.kayitBekliyor = null;
    API.ucusta('reh_envanter_kaydet', { p_cevaplar: paketle(), p_yetenek_basladi: false });
  });

  if (window.DENEME_KIPI) {
    ['#giris-form', '#kayit-form'].forEach(function (k) {
      var f = $(k);
      f.insertBefore(el('div', { class: 'bilgi-kutu' },
        'Deneme kipi açık. Cevaplar yalnız bu tarayıcıda duruyor. Hazır hesap: ' +
        'ogrenci@deneme.com, şifre deneme. Kayıt denemek istersen okul kodu: DENEME'),
        f.children[2]);
    });
  }

  /* Saklı oturum varsa rolü öğrenip doğru yere gönder. */
  API.baslat().then(function (p) {
    if (p) roleGore(p);
  });
}

/* Şube listesi. I ve O harfleri okul numarasıyla karışıyor, dışarıda bırakıldı. */
function subeleriDoldur() {
  var s = $('#kayit-sube');
  'ABCDEFGHJKLMNP'.split('').forEach(function (h) {
    s.appendChild(el('option', { value: h }, h + ' şubesi'));
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
else kur();

})();
