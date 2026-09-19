/* DENEME KİPİ
   baglanti.js içindeki adres ve anahtar doldurulmadığı sürece sunucu yerine
   tarayıcı hafızası kullanılır. Üç rolü de kurulum yapmadan görmek için.
   Supabase ayarları girilince bu dosya hiçbir şey yapmaz.

   Hazır hesaplar, şifresi hepsinde "deneme":
     yonetici@deneme.com   yönetici
     rehber@deneme.com     onaylı rehber öğretmen, Deneme Lisesi
     ogrenci@deneme.com    öğrenci, 11-B
   Kendin de kayıt olabilirsin. Öğrenci kaydı için okul kodu: DENEME */

(function () {
'use strict';

if (window.API && window.API.kuruldu()) return;

var ANAHTAR = 'kendini-tani-deneme';
var ENVANTERLER = ['kisilik', 'ilgi', 'deger', 'beceri', 'yetenek'];

function taze() {
  return {
    kullanicilar: {
      'yonetici@deneme.com': { sifre: 'deneme', rol: 'yonetici', ad_soyad: 'Eser Akkaba' },
      'rehber@deneme.com':   { sifre: 'deneme', rol: 'rehber', ad_soyad: 'Ayşe Demir',
                               onayli: true, okul_kodu: 'DENEME' },
      'ogrenci@deneme.com':  { sifre: 'deneme', rol: 'ogrenci', ad_soyad: 'Deneme Öğrencisi',
                               okul_kodu: 'DENEME', sinif: 11, sube: 'B', okul_no: '77' },
      'bekleyen@deneme.com': { sifre: 'deneme', rol: 'rehber', ad_soyad: 'Kemal Aslan',
                               onayli: false, istenen_okul: 'Cumhuriyet Anadolu Lisesi (Ankara)' }
    },
    reh_okullar: {
      DENEME: { ad: 'Deneme Lisesi', il: 'İstanbul', aktif: true, demo: false },
      ORNEK:  { ad: 'Örnek Lise', il: 'Gösterim', aktif: true, demo: true }
    },
    cevaplar: {}
  };
}

function oku() {
  try {
    var v = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
    if (v && v.kullanicilar) return v;
  } catch (e) { /* bozuksa sıfırdan kur */ }
  var y = taze();
  yaz(y);
  return y;
}

function yaz(v) {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch (e) { /* yoksay */ }
}

/* Jeton yerine e-postayı taşıyan basit bir dize. Deneme kipinde kimlik
   doğrulaması yok, amaç arayüzü görmek. */
function jetonUret(eposta) { return 'deneme:' + eposta; }
function jetondanEposta() {
  return (window.OTURUM.jwt || '').indexOf('deneme:') === 0
    ? window.OTURUM.jwt.slice(7) : null;
}

function bekle(deger) {
  return new Promise(function (coz) { setTimeout(function () { coz(deger); }, 110); });
}

function ornekOgrenciler() {
  return (window.ORNEK_SINIF || []).map(function (o) {
    return {
      ogrenci_id: o.ogrenci_id, ad_soyad: o.ad_soyad, sinif: o.sinif, sube: o.sube,
      okul_no: o.okul_no, demo: true, eposta: null,
      okul_id: 'ORNEK', okul_adi: 'Örnek Lise', okul_kodu: 'ORNEK',
      cevaplar: JSON.parse(JSON.stringify(o.cevaplar || {})),
      guncellendi: o.guncellendi ? new Date().toISOString() : null
    };
  });
}

function gercekOgrenciler(d, okulKodu) {
  var liste = [];
  Object.keys(d.kullanicilar).forEach(function (e) {
    var k = d.kullanicilar[e];
    if (k.rol !== 'ogrenci') return;
    if (okulKodu && k.okul_kodu !== okulKodu) return;
    var o = d.reh_okullar[k.okul_kodu] || {};
    liste.push({
      ogrenci_id: 'k:' + e, ad_soyad: k.ad_soyad, sinif: k.sinif, sube: k.sube,
      okul_no: k.okul_no, demo: false, eposta: e,
      okul_id: k.okul_kodu, okul_adi: o.ad, okul_kodu: k.okul_kodu,
      cevaplar: d.cevaplar[e] || {},
      guncellendi: d.cevaplar[e] ? new Date().toISOString() : null
    });
  });
  return liste;
}

function bittiSayisi(c) {
  return Object.keys((c && c.bitti) || {}).length;
}

/* ------------------------------------------------------------------ */
/* API'nin üzerine yazılan bölümler                                     */
/* ------------------------------------------------------------------ */

API.kayitOl = function (eposta, sifre) {
  var d = oku();
  eposta = String(eposta || '').trim().toLowerCase();
  if (eposta.indexOf('@') < 0) return Promise.reject(new Error('E-posta adresi geçerli görünmüyor.'));
  if (String(sifre || '').length < 6) return Promise.reject(new Error('Şifre en az 6 karakter olmalı.'));
  if (d.kullanicilar[eposta])
    return Promise.reject(new Error('Bu e-posta zaten kayıtlı. Giriş yapmayı dene.'));
  d.kullanicilar[eposta] = { sifre: sifre, rol: null, ad_soyad: '' };
  yaz(d);
  return bekle().then(function () {
    return API.oturumKur({ access_token: jetonUret(eposta), refresh_token: 'deneme',
                           expires_in: 86400 });
  });
};

API.girisYap = function (eposta, sifre) {
  var d = oku();
  eposta = String(eposta || '').trim().toLowerCase();
  var k = d.kullanicilar[eposta];
  if (!k || k.sifre !== sifre)
    return Promise.reject(new Error(
      'E-posta ya da şifre hatalı. Deneme kipinde hazır hesaplar: ' +
      'yonetici@deneme.com, rehber@deneme.com, ogrenci@deneme.com. Şifre: deneme'));
  return bekle().then(function () {
    return API.oturumKur({ access_token: jetonUret(eposta), refresh_token: 'deneme',
                           expires_in: 86400 });
  });
};

API.sifreUnuttum = function () {
  return bekle({ ok: true });
};

API.cikis = function () { API.oturumSil(); return Promise.resolve(); };

API.jetonHazirla = function () { return Promise.resolve(window.OTURUM.jwt); };

API.ucusta = function (fn, a) { API.rpc(fn, a); };

API.rpcAnon = function (fn, a) { return API.rpc(fn, a); };

API.rpc = function (fn, a) {
  a = a || {};
  var d = oku();
  var eposta = jetondanEposta();
  var ben = eposta ? d.kullanicilar[eposta] : null;

  function kaydet() { yaz(d); }

  /* ---- Herkese açık ---- */
  if (fn === 'reh_okul_kodu_sor') {
    var kod = String(a.p_kod || '').trim().toUpperCase();
    var o = d.reh_okullar[kod];
    if (!o || !o.aktif)
      return bekle({ gecerli: false,
        mesaj: 'Bu okul kodu tanınmadı. Deneme kipinde geçerli kod: DENEME' });
    if (o.demo)
      return bekle({ gecerli: false,
        mesaj: 'Bu kod örnek sınıfa ait, öğrenci kaydı için kullanılamaz.' });
    return bekle({ gecerli: true, okul_adi: o.ad, il: o.il || '', ilce: '' });
  }

  if (!ben) return bekle({ hata: 'Oturum bulunamadı. Tekrar giriş yap.' });

  /* ---- Ortak ---- */
  if (fn === 'reh_durumum') {
    if (!ben.rol) return bekle({ rol: null, kayitsiz: true, eposta: eposta });
    var okul = ben.okul_kodu ? d.reh_okullar[ben.okul_kodu] : null;
    return bekle({
      rol: ben.rol, ad_soyad: ben.ad_soyad, eposta: eposta,
      onayli: ben.rol === 'rehber' ? !!ben.onayli : true,
      sinif: ben.sinif || null, sube: ben.sube || null, okul_no: ben.okul_no || null,
      okul_adi: okul ? okul.ad : (ben.istenen_okul || null),
      okul_kodu: ben.okul_kodu || null,
      cevaplar: d.cevaplar[eposta] || {}
    });
  }

  /* ---- Kayıt ---- */
  if (fn === 'reh_ogrenci_kayit') {
    if (ben.rol) return bekle({ hata: 'Bu hesap zaten kayıtlı.' });
    var k2 = String(a.p_okul_kodu || '').trim().toUpperCase();
    var o2 = d.reh_okullar[k2];
    if (!o2 || !o2.aktif || o2.demo)
      return bekle({ hata: 'Okul kodu tanınmadı. Deneme kipinde geçerli kod: DENEME' });
    if (!String(a.p_ad_soyad || '').trim()) return bekle({ hata: 'Ad soyad boş olamaz.' });
    if (!(a.p_sinif >= 9 && a.p_sinif <= 12))
      return bekle({ hata: 'Sınıfını 9 ile 12 arasından seç.' });
    if (!String(a.p_sube || '').trim()) return bekle({ hata: 'Şubeni seç.' });
    ben.rol = 'ogrenci'; ben.ad_soyad = String(a.p_ad_soyad).trim();
    ben.okul_kodu = k2; ben.sinif = a.p_sinif;
    ben.sube = String(a.p_sube).trim().toUpperCase();
    ben.okul_no = String(a.p_okul_no || '').trim() || null;
    kaydet();
    return bekle({ ok: true, okul_adi: o2.ad });
  }

  if (fn === 'reh_rehber_kayit') {
    if (ben.rol) return bekle({ hata: 'Bu hesap zaten kayıtlı.' });
    if (!String(a.p_ad_soyad || '').trim() || !String(a.p_okul_adi || '').trim())
      return bekle({ hata: 'Ad soyad ve okul adı boş olamaz.' });
    ben.rol = 'rehber'; ben.ad_soyad = String(a.p_ad_soyad).trim();
    ben.onayli = false;
    ben.istenen_okul = String(a.p_okul_adi).trim() +
      (a.p_il ? ' (' + a.p_il + (a.p_ilce ? ' / ' + a.p_ilce : '') + ')' : '');
    kaydet();
    return bekle({ ok: true });
  }

  /* ---- Öğrenci ---- */
  if (fn === 'reh_envanter_kaydet') {
    if (ben.rol !== 'ogrenci')
      return bekle({ hata: 'Bu işlem için öğrenci hesabıyla giriş yapman gerekiyor.' });
    var eski = d.cevaplar[eposta] || {};
    var yeni = JSON.parse(JSON.stringify(a.p_cevaplar || {}));
    var eskiBitti = eski.bitti || {};
    yeni.bitti = yeni.bitti || {};
    /* Sunucudaki kuralın aynısı: kapanmış envanter bir daha değişmez. */
    ENVANTERLER.forEach(function (k) {
      if (eskiBitti[k]) { yeni[k] = eski[k] || {}; yeni.bitti[k] = true; }
    });
    if (eski.yetenek_baslangic) yeni.yetenek_baslangic = eski.yetenek_baslangic;
    else if (a.p_yetenek_basladi) yeni.yetenek_baslangic = new Date().toISOString();
    d.cevaplar[eposta] = yeni;
    kaydet();
    return bekle({ ok: true, cevaplar: yeni });
  }

  /* ---- Rehber ---- */
  if (fn === 'reh_rehber_ogrenciler') {
    if (ben.rol !== 'rehber' || !ben.onayli)
      return Promise.reject(new Error('Hesabın henüz onaylanmadı ya da rehber öğretmen değilsin.'));
    return bekle(gercekOgrenciler(d, ben.okul_kodu).concat(ornekOgrenciler()));
  }

  if (fn === 'reh_envanter_ac') {
    var hedef = String(a.p_ogrenci_id || '');
    if (hedef.indexOf('ornek-') === 0)
      return bekle({ hata: 'Örnek sınıftaki kayıtlar değiştirilemez.' });
    if (ben.rol !== 'rehber' && ben.rol !== 'yonetici')
      return Promise.reject(new Error('Yetkisiz işlem.'));
    var ep = hedef.slice(2);
    var c = d.cevaplar[ep];
    if (!c) return bekle({ hata: 'Bu öğrenci henüz hiçbir envantere başlamamış.' });
    if (c.bitti) delete c.bitti[a.p_envanter];
    if (a.p_envanter === 'yetenek') delete c.yetenek_baslangic;
    kaydet();
    return bekle({ ok: true });
  }

  /* ---- Yönetici ---- */
  if (ben.rol !== 'yonetici') {
    if (fn.indexOf('reh_yonetici_') === 0)   /* adlar reh_ onekli */
      return Promise.reject(new Error('Yetkisiz işlem.'));
    return bekle({ hata: 'Deneme kipinde bu işlem yok: ' + fn });
  }

  if (fn === 'reh_yonetici_rehberler') {
    var r = [];
    Object.keys(d.kullanicilar).forEach(function (e) {
      var k = d.kullanicilar[e];
      if (k.rol !== 'rehber') return;
      var o = k.okul_kodu ? d.reh_okullar[k.okul_kodu] : null;
      r.push({
        profil_id: 'k:' + e, ad_soyad: k.ad_soyad, eposta: e,
        istenen_okul: k.istenen_okul || null, onayli: !!k.onayli,
        okul_id: k.okul_kodu || null, okul_adi: o ? o.ad : null,
        okul_kodu: k.okul_kodu || null,
        ogrenci_sayisi: k.okul_kodu ? gercekOgrenciler(d, k.okul_kodu).length : 0,
        eklendi: new Date().toISOString()
      });
    });
    r.sort(function (x, y2) { return (x.onayli ? 1 : 0) - (y2.onayli ? 1 : 0); });
    return bekle(r);
  }

  if (fn === 'reh_yonetici_onayla') {
    var ep2 = String(a.p_profil_id || '').slice(2);
    var rk = d.kullanicilar[ep2];
    if (!rk || rk.rol !== 'rehber') return bekle({ hata: 'Rehber öğretmen kaydı bulunamadı.' });
    var kodu = a.p_okul_id;
    if (!kodu) {
      kodu = kodUret(d);
      d.reh_okullar[kodu] = { ad: rk.istenen_okul || (rk.ad_soyad + ' okulu'),
                          aktif: true, demo: false };
    } else if (!d.reh_okullar[kodu] || d.reh_okullar[kodu].demo) {
      return bekle({ hata: 'Seçilen okul bulunamadı.' });
    }
    rk.onayli = true; rk.okul_kodu = kodu;
    kaydet();
    return bekle({ ok: true, okul_adi: d.reh_okullar[kodu].ad, okul_kodu: kodu });
  }

  if (fn === 'reh_yonetici_onay_kaldir') {
    var ep3 = String(a.p_profil_id || '').slice(2);
    if (!d.kullanicilar[ep3]) return bekle({ hata: 'Rehber öğretmen kaydı bulunamadı.' });
    d.kullanicilar[ep3].onayli = false;
    kaydet();
    return bekle({ ok: true });
  }

  if (fn === 'reh_yonetici_okullar') {
    var liste = Object.keys(d.reh_okullar).map(function (kod) {
      var o = d.reh_okullar[kod];
      var ogrenciler = o.demo ? ornekOgrenciler() : gercekOgrenciler(d, kod);
      var rehberSayi = 0;
      Object.keys(d.kullanicilar).forEach(function (e) {
        var k = d.kullanicilar[e];
        if (k.rol === 'rehber' && k.okul_kodu === kod) rehberSayi++;
      });
      return {
        okul_id: kod, kod: kod, ad: o.ad, il: o.il || null,
        aktif: o.aktif, demo: !!o.demo,
        rehber_sayisi: rehberSayi, ogrenci_sayisi: ogrenciler.length,
        biten_sayisi: ogrenciler.filter(function (x) { return bittiSayisi(x.cevaplar) === 5; }).length,
        eklendi: new Date().toISOString()
      };
    });
    liste.sort(function (x, y2) { return (x.demo ? 1 : 0) - (y2.demo ? 1 : 0); });
    return bekle(liste);
  }

  if (fn === 'reh_yonetici_ogrenciler') {
    var hepsi = gercekOgrenciler(d).concat(ornekOgrenciler());
    if (a.p_okul_id) hepsi = hepsi.filter(function (x) { return x.okul_id === a.p_okul_id; });
    return bekle(hepsi);
  }

  if (fn === 'reh_yonetici_kod_yenile') {
    var eskiKod = a.p_okul_id;
    if (!d.reh_okullar[eskiKod] || d.reh_okullar[eskiKod].demo)
      return bekle({ hata: 'Okul bulunamadı ya da örnek okul.' });
    var yeniKod = kodUret(d);
    d.reh_okullar[yeniKod] = d.reh_okullar[eskiKod];
    delete d.reh_okullar[eskiKod];
    Object.keys(d.kullanicilar).forEach(function (e) {
      if (d.kullanicilar[e].okul_kodu === eskiKod) d.kullanicilar[e].okul_kodu = yeniKod;
    });
    kaydet();
    return bekle({ ok: true, kod: yeniKod });
  }

  return bekle({ hata: 'Deneme kipinde bu işlem yok: ' + fn });
};

/* Sunucudaki alfabenin aynısı: karışan 0 O 1 I 8 B harfleri yok. */
function kodUret(d) {
  var harfler = 'ACDEFGHJKLMNPRTUVWXYZ234679', kod;
  do {
    kod = '';
    for (var i = 0; i < 6; i++)
      kod += harfler[Math.floor(Math.random() * harfler.length)];
  } while (d.reh_okullar[kod]);
  return kod;
}

window.DENEME_KIPI = true;

})();
