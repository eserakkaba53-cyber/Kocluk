/* Deneme kipinin sınaması.  node sinama-deneme.js
   deneme.js tarayıcıya bağlı, o yüzden window ve localStorage burada
   taklit ediliyor. Üç rolün de yolunu baştan sona geçiriyor. */

var assert = require('assert');

/* window'u doğrudan global yapıyoruz: baglanti.js window.API = {...} yazıp
   sonra çıplak API diye çağırıyor, tarayıcıda ikisi aynı nesne. */
global.window = global;

var depo = {};
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(depo, k) ? depo[k] : null; },
  setItem: function (k, v) { depo[k] = String(v); },
  removeItem: function (k) { delete depo[k]; },
  clear: function () { depo = {}; }
};

require('./veri/kisilik.js');
require('./veri/ilgi.js');
require('./veri/degerler.js');
require('./veri/beceri.js');
require('./veri/yetenek.js');
require('./veri/bolumler.js');
require('./veri/ornek-sinif.js');
require('./baglanti.js');

/* ★ 20 Eyl 2026 — baglanti.js artik Biyoser'in Supabase projesine BAGLI, yani
   kuruldu() uretimde true. Deneme kipi ise ayarlar bosken devreye giren yedek.
   Sinama o durumu olcuyor, o yuzden ayarlari burada yer tutucuya cekiyoruz;
   yoksa sinama uretim ayari yuzunden duser, kusur oldugundan degil. */
AYAR.URL = 'https://BURAYA-PROJE-ADRESI.supabase.co';
AYAR.ANON = 'BURAYA-ANON-PUBLIC-ANAHTAR';

require('./deneme.js');
require('./puanlama.js');

assert.strictEqual(API.kuruldu(), false, 'ayarlar boşken deneme kipi açık olmalı');
assert.strictEqual(window.DENEME_KIPI, true, 'deneme.js devreye girmeliydi');

function bittiSayisi(c) { return Object.keys((c && c.bitti) || {}).length; }

/* ---- 1. Okul kodu ---- */
function kodlar() {
  return API.rpcAnon('reh_okul_kodu_sor', { p_kod: 'YOKBOYLE' })
    .then(function (g) {
      assert.strictEqual(g.gecerli, false, 'olmayan kod geçmemeli');
      return API.rpcAnon('reh_okul_kodu_sor', { p_kod: 'ORNEK' });
    })
    .then(function (g) {
      assert.strictEqual(g.gecerli, false, 'örnek okul koduyla kayıt olunamamalı');
      return API.rpcAnon('reh_okul_kodu_sor', { p_kod: 'deneme' });
    })
    .then(function (g) {
      assert.strictEqual(g.gecerli, true, 'geçerli kod kabul edilmeli');
      assert.ok(g.okul_adi, 'okul adı dönmeli');
    });
}

/* ---- 2. Öğrenci ---- */
function ogrenci() {
  return API.kayitOl('yeni@deneme.com', 'sifre123')
    .then(function () { return API.durumTazele(); })
    .then(function (p) {
      assert.strictEqual(p.rol, null, 'kayıt tamamlanmadan rol olmamalı');
      assert.strictEqual(p.kayitsiz, true, 'profili olmayan hesap kayitsiz dönmeli');
      return API.rpc('reh_ogrenci_kayit', {
        p_ad_soyad: 'Yeni Öğrenci', p_okul_kodu: 'ORNEK',
        p_sinif: 11, p_sube: 'A', p_okul_no: '900'
      });
    })
    .then(function (g) {
      assert.ok(g.hata, 'örnek okul koduyla öğrenci kaydı yapılamamalı');
      return API.rpc('reh_ogrenci_kayit', {
        p_ad_soyad: 'Yeni Öğrenci', p_okul_kodu: 'DENEME',
        p_sinif: 8, p_sube: 'A', p_okul_no: '900'
      });
    })
    .then(function (g) {
      assert.ok(g.hata, 'sınıf 9 ile 12 dışındaysa kayıt olmamalı');
      return API.rpc('reh_ogrenci_kayit', {
        p_ad_soyad: 'Yeni Öğrenci', p_okul_kodu: 'DENEME',
        p_sinif: 11, p_sube: 'A', p_okul_no: '900'
      });
    })
    .then(function (g) {
      assert.ok(g.ok, 'geçerli kayıt kabul edilmeli');
      return API.durumTazele();
    })
    .then(function (p) {
      assert.strictEqual(p.rol, 'ogrenci');
      assert.strictEqual(p.sinif, 11);
      assert.strictEqual(p.sube, 'A');

      var cev = {};
      window.ENV_ILGI.maddeler.forEach(function (m) { cev[m.n] = m.b === 'A' ? 5 : 2; });
      return API.rpc('reh_envanter_kaydet', {
        p_cevaplar: { ilgi: cev, bitti: { ilgi: true } }, p_yetenek_basladi: false
      });
    })
    .then(function (g) {
      assert.strictEqual(Object.keys(g.cevaplar.ilgi).length, 48, '48 madde kaydedilmeli');
      return API.rpc('reh_envanter_kaydet', {
        p_cevaplar: { ilgi: { 1: 1 }, bitti: {} }, p_yetenek_basladi: false
      });
    })
    .then(function (g) {
      assert.strictEqual(Object.keys(g.cevaplar.ilgi).length, 48,
        'tamamlanan envanter üzerine yazılamamalı');
      assert.strictEqual(g.cevaplar.bitti.ilgi, true, 'bitti işareti kaldırılamamalı');
      return API.rpc('reh_envanter_kaydet', { p_cevaplar: { yetenek: {} }, p_yetenek_basladi: true });
    })
    .then(function (g) {
      var ilkAn = g.cevaplar.yetenek_baslangic;
      assert.ok(ilkAn, 'yetenek testi başlayınca süre yazılmalı');
      return API.rpc('reh_envanter_kaydet', {
        p_cevaplar: { yetenek: { 1: 0 } }, p_yetenek_basladi: true
      }).then(function (g2) {
        assert.strictEqual(g2.cevaplar.yetenek_baslangic, ilkAn,
          'süre bir kez başlar, sayfayı yenilemek süre kazandırmaz');
      });
    })
    .then(function () {
      /* Öğrenci yönetici uçlarına erişememeli. */
      return API.rpc('reh_yonetici_okullar', {}).then(
        function () { throw new Error('öğrenci yönetici ucunu çağırabildi'); },
        function (e) { assert.ok(/Yetkisiz/.test(e.message), 'yetki hatası beklenirdi'); });
    });
}

/* ---- 3. Onay bekleyen rehber ---- */
function bekleyenRehber() {
  return API.girisYap('bekleyen@deneme.com', 'deneme')
    .then(function () { return API.durumTazele(); })
    .then(function (p) {
      assert.strictEqual(p.rol, 'rehber');
      assert.strictEqual(p.onayli, false, 'onaylanmamış rehber onayli false olmalı');
      return API.rpc('reh_rehber_ogrenciler', {}).then(
        function () { throw new Error('onaysız rehber öğrenci listesini aldı'); },
        function (e) { assert.ok(e.message.length > 0); });
    });
}

/* ---- 4. Onaylı rehber ---- */
function rehber() {
  return API.girisYap('rehber@deneme.com', 'deneme')
    .then(function () { return API.durumTazele(); })
    .then(function (p) {
      assert.strictEqual(p.rol, 'rehber');
      assert.strictEqual(p.onayli, true);
      assert.ok(p.okul_kodu, 'onaylı rehberin okul kodu olmalı');
      return API.rpc('reh_rehber_ogrenciler', {});
    })
    .then(function (liste) {
      var ornekler = liste.filter(function (o) { return o.demo; });
      var kendi = liste.filter(function (o) { return !o.demo; });
      assert.ok(ornekler.length >= 15, 'örnek sınıf listede olmalı');
      assert.ok(kendi.length >= 1, 'kendi okulunun öğrencisi listede olmalı');
      assert.ok(kendi.every(function (o) { return o.okul_no !== undefined; }));

      /* Örnek sınıftan beşini bitirmiş biri gerçekten puanlanabilmeli. */
      var tam = ornekler.filter(function (o) { return bittiSayisi(o.cevaplar) === 5; });
      assert.ok(tam.length >= 8, 'örnek sınıfta yeterince tamamlanmış öğrenci olmalı');

      var c = tam[0].cevaplar, gecen = { deger: {} };
      ['kisilik', 'ilgi', 'beceri', 'yetenek'].forEach(function (k) { gecen[k] = c[k]; });
      Object.keys(c.deger).forEach(function (n) {
        if (c.deger[n].length === 6) gecen.deger[n] = c.deger[n];
      });
      var profil = PUANLAMA.profilCikar({
        kisilik: window.ENV_KISILIK, ilgi: window.ENV_ILGI, deger: window.ENV_DEGER,
        beceri: window.ENV_BECERI, yetenek: window.ENV_YETENEK
      }, gecen);
      assert.strictEqual(profil.eksikEnvanter.length, 0, 'beş envanter de işlenmeli');
      assert.strictEqual(profil.hollandKodu.length, 3);
      assert.strictEqual(PUANLAMA.bolumOner(window.ENV_BOLUMLER, profil, 10, 3).liste.length, 10);

      /* Örnek sınıf kaydı değiştirilememeli. */
      return API.rpc('reh_envanter_ac', {
        p_ogrenci_id: ornekler[0].ogrenci_id, p_envanter: 'ilgi'
      });
    })
    .then(function (g) {
      assert.ok(g.hata, 'örnek sınıf kaydı yeniden açılamamalı');
    });
}

/* ---- 5. Yönetici ---- */
function yonetici() {
  var bekleyenId = null;
  return API.girisYap('yonetici@deneme.com', 'deneme')
    .then(function () { return API.durumTazele(); })
    .then(function (p) {
      assert.strictEqual(p.rol, 'yonetici');
      return API.rpc('reh_yonetici_rehberler', {});
    })
    .then(function (liste) {
      var bekleyen = liste.filter(function (r) { return !r.onayli; });
      assert.ok(bekleyen.length >= 1, 'onay bekleyen rehber olmalı');
      assert.ok(bekleyen[0].istenen_okul, 'istediği okul görünmeli');
      bekleyenId = bekleyen[0].profil_id;
      return API.rpc('reh_yonetici_onayla', { p_profil_id: bekleyenId, p_okul_id: null });
    })
    .then(function (g) {
      assert.ok(g.ok, 'onay çalışmalı');
      assert.strictEqual(g.okul_kodu.length, 6, 'onayda altı karakterli kod üretilmeli');
      assert.ok(!/[01IO8B]/.test(g.okul_kodu), 'karışan harfler kodda olmamalı');
      return API.rpc('reh_yonetici_rehberler', {});
    })
    .then(function (liste) {
      var o = liste.filter(function (r) { return r.profil_id === bekleyenId; })[0];
      assert.strictEqual(o.onayli, true, 'onaydan sonra onayli true olmalı');
      assert.ok(o.okul_kodu, 'okul kodu atanmalı');
      return API.rpc('reh_yonetici_okullar', {});
    })
    .then(function (reh_okullar) {
      assert.ok(reh_okullar.length >= 3, 'yeni okul listeye girmeli');
      var ornek = reh_okullar.filter(function (o) { return o.demo; });
      assert.strictEqual(ornek.length, 1, 'tek örnek okul olmalı');
      return API.rpc('reh_yonetici_ogrenciler', {});
    })
    .then(function (liste) {
      assert.ok(liste.length >= 18, 'yönetici bütün öğrencileri görmeli');
      assert.ok(liste.some(function (o) { return o.demo; }), 'örnek sınıf da görünmeli');
      assert.ok(liste.some(function (o) { return !o.demo; }), 'gerçek öğrenci de görünmeli');
      return API.rpc('reh_yonetici_kod_yenile', { p_okul_id: 'DENEME' });
    })
    .then(function (g) {
      assert.ok(g.ok && g.kod, 'kod yenilenebilmeli');
      assert.notStrictEqual(g.kod, 'DENEME', 'yeni kod eskisinden farklı olmalı');
      return API.rpc('reh_yonetici_kod_yenile', { p_okul_id: 'ORNEK' });
    })
    .then(function (g) {
      assert.ok(g.hata, 'örnek okulun kodu yenilenememeli');
      return API.rpc('reh_yonetici_onay_kaldir', { p_profil_id: bekleyenId });
    })
    .then(function (g) { assert.ok(g.ok, 'onay kaldırılabilmeli'); });
}

kodlar()
  .then(ogrenci)
  .then(bekleyenRehber)
  .then(rehber)
  .then(yonetici)
  .then(function () { console.log('deneme kipi sınaması geçti: öğrenci, rehber ve yönetici.'); })
  .catch(function (e) {
    console.error('SINAMA DÜŞTÜ: ' + e.message);
    process.exit(1);
  });
