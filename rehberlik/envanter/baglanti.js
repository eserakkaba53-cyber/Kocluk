/* Supabase bağlantısı ve ayarlar.
   ★ 20 Eyl 2026 — Biyoser'in kendi Supabase projesine bağlandı. Adres ve anon
   anahtar koçluk panelindekiyle birebir aynı (Biyoser code/sunucu.js). Aynı
   proje demek aynı kullanıcı havuzu demek: Biyoser hesabıyla buraya da girilir,
   ikinci şifre yok. Değerler sunucu.js'ten okunmuyor, buraya yazıldı; okunsaydı
   bu bölüm koçluk panelinin sürüm damgasına (?v=) bağlanır, o değiştiğinde
   burası eski sürümü istemeye devam ederdi. */

window.AYAR = {
  URL:  'https://hdcxmunvkxkffnsewfgp.supabase.co',
  ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY3htdW52a3hrZmZuc2V3ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzA4MDMsImV4cCI6MjEwMjEwNjgwM30.SypEvxn5QXwyLtKdMorumeFhv1_ED-EPwghwjdMSYNw',

  URUN:         'Kendini tanı',
  OGRETIM_YILI: '2026–2027',
  SAHIP:        'Biyoser'
};

/* anon anahtar tarayıcıda görünür, olması gereken budur.
   Veriyi koruyan şey anahtar değil, kurulum.sql'deki RLS ve security definer
   fonksiyonlar. Hiçbir tablo doğrudan okunamaz, her şey fonksiyondan geçer. */

window.OTURUM = { jwt: null, yenileme: null, bitis: 0, profil: null };

var OTURUM_ANAHTAR = 'kendini-tani-oturum';

window.API = {

  kuruldu: function () {
    return AYAR.URL.indexOf('BURAYA') === -1 && AYAR.ANON.indexOf('BURAYA') === -1;
  },

  /* ---- Oturumun saklanması ---- */

  oturumYaz: function () {
    try {
      localStorage.setItem(OTURUM_ANAHTAR, JSON.stringify({
        jwt: OTURUM.jwt, yenileme: OTURUM.yenileme, bitis: OTURUM.bitis
      }));
    } catch (e) { /* özel pencerede yazamayabilir, akışı bozmaz */ }
  },

  oturumOku: function () {
    try {
      var v = JSON.parse(localStorage.getItem(OTURUM_ANAHTAR) || 'null');
      if (!v || !v.jwt) return false;
      OTURUM.jwt = v.jwt; OTURUM.yenileme = v.yenileme; OTURUM.bitis = v.bitis || 0;
      return true;
    } catch (e) { return false; }
  },

  oturumSil: function () {
    OTURUM.jwt = null; OTURUM.yenileme = null; OTURUM.bitis = 0; OTURUM.profil = null;
    try { localStorage.removeItem(OTURUM_ANAHTAR); } catch (e) { /* yoksay */ }
  },

  oturumKur: function (g) {
    OTURUM.jwt = g.access_token;
    OTURUM.yenileme = g.refresh_token;
    OTURUM.bitis = Date.now() + ((g.expires_in || 3600) * 1000);
    API.oturumYaz();
    return g;
  },

  /* ---- Auth ---- */

  kayitOl: function (eposta, sifre) {
    /* ★ 20 Eyl 2026 — ROL DAMGASI ZORUNLU. Bu proje Biyoser ile ortak ve
       auth.users üzerinde yeni_kullanici() tetikleyicisi var:
         if coalesce(new.raw_user_meta_data->>'rol','koc') <> 'koc' then return new;
       yani rol yazılmazsa 'koc' varsayılıyor ve kayıt olan herkese koclar
       tablosunda 7 günlük deneme hesabı açılıyor. Özel ders panelinde bu tam
       olarak yaşandı, temizlik betiği yazmak gerekti
       (Biyoser code/OZEL-DERS-ogrencileri-koc-degil.sql). Buradaki kayıt lise
       öğrencisi ve rehber öğretmen; hiçbiri koç değil. */
    return API.auth('/auth/v1/signup',
      { email: eposta, password: sifre, data: { rol: 'rehberlik' } })
      .then(function (g) {
        /* Supabase'de e-posta doğrulaması açıksa oturum gelmez.
           O durumda kullanıcıya e-postasına bakması söylenir. */
        if (g.access_token) return API.oturumKur(g);
        if (g.session && g.session.access_token) return API.oturumKur(g.session);
        return { dogrulama_gerekli: true };
      });
  },

  girisYap: function (eposta, sifre) {
    return API.auth('/auth/v1/token?grant_type=password',
      { email: eposta, password: sifre }).then(API.oturumKur);
  },

  sifreUnuttum: function (eposta) {
    /* ★ 20 Eyl 2026 — redirect_to yazılmazsa Supabase projenin Site URL'ini
       kullanır, o da koçluk panelidir: rehber öğretmen yeni şifre ekranını hiç
       göremez, koç panelinde bulur kendini. Adresin Supabase panelinde
       Authentication > URL Configuration > Redirect URLs listesinde olması da
       gerekir, yoksa sessizce Site URL'e düşürülür. */
    var geri = encodeURIComponent(location.href.split('#')[0].split('?')[0]);
    return API.auth('/auth/v1/recover?redirect_to=' + geri, { email: eposta });
  },

  cikis: function () {
    var j = OTURUM.jwt;
    API.oturumSil();
    if (!j || !API.kuruldu()) return Promise.resolve();
    /* ★ 20 Eyl 2026 — scope=local. Kapsam yazılmazsa GoTrue genel çıkış yapar ve
       o kullanıcının BÜTÜN yenileme jetonlarını iptal eder; aynı tarayıcıda açık
       duran koçluk paneli bir sonraki tazelemede dışarı atılır. Aynı auth
       kullanıcısını iki sistem paylaştığı için kapsam şart. */
    return fetch(AYAR.URL + '/auth/v1/logout?scope=local', {
      method: 'POST',
      headers: { 'apikey': AYAR.ANON, 'Authorization': 'Bearer ' + j }
    }).catch(function () { /* çıkış yereldeyse yeter */ });
  },

  auth: function (yol, govde) {
    if (!API.kuruldu())
      return Promise.reject(new Error('Supabase ayarları girilmemiş. baglanti.js dosyasını düzenle.'));
    return fetch(AYAR.URL + yol, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': AYAR.ANON },
      body: JSON.stringify(govde)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (g) {
        if (!r.ok) throw new Error(API.authMesaji(g, r.status));
        return g;
      });
    });
  },

  /* Supabase'in İngilizce hata metinlerini okunur Türkçeye çeviriyoruz.
     Öğrenci "Invalid login credentials" cümlesinden ne yapacağını anlamıyor. */
  authMesaji: function (g, durum) {
    var m = (g.error_description || g.msg || g.message || '').toLowerCase();
    if (m.indexOf('invalid login') >= 0)
      return 'E-posta ya da şifre hatalı. Şifreni unuttuysan aşağıdaki bağlantıyı kullan.';
    if (m.indexOf('already registered') >= 0 || m.indexOf('already been registered') >= 0)
      return 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.';
    if (m.indexOf('password should be') >= 0 || m.indexOf('password must') >= 0)
      return 'Şifre en az 6 karakter olmalı.';
    if (m.indexOf('email not confirmed') >= 0)
      return 'E-postanı doğrulaman gerekiyor. Gelen kutunu kontrol et.';
    if (m.indexOf('unable to validate email') >= 0 || m.indexOf('invalid email') >= 0)
      return 'E-posta adresi geçerli görünmüyor.';
    if (m.indexOf('rate limit') >= 0 || durum === 429)
      return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
    return g.error_description || g.msg || g.message || ('Sunucu hatası (' + durum + ')');
  },

  /* Jeton bitmeden tazeler. Öğrenci 45 dakikalık yetenek testinin
     ortasında oturumu düşerse cevapları kaydedilemez. */
  jetonHazirla: function () {
    if (!OTURUM.jwt) return Promise.resolve(null);
    if (Date.now() < OTURUM.bitis - 120000) return Promise.resolve(OTURUM.jwt);
    if (!OTURUM.yenileme) { API.oturumSil(); return Promise.resolve(null); }
    return API.auth('/auth/v1/token?grant_type=refresh_token',
      { refresh_token: OTURUM.yenileme })
      .then(function (g) { API.oturumKur(g); return OTURUM.jwt; })
      .catch(function () { API.oturumSil(); return null; });
  },

  /* ---- Veri çağrıları ---- */

  rpc: function (fn, args) {
    return API.jetonHazirla().then(function (j) {
      return API.cagir(fn, args, j || AYAR.ANON);
    });
  },

  /* Giriş yapılmadan çağrılabilen tek uç: okul kodu sorgusu. */
  rpcAnon: function (fn, args) {
    return API.cagir(fn, args, AYAR.ANON);
  },

  cagir: function (fn, args, jeton) {
    if (!API.kuruldu())
      return Promise.reject(new Error('Supabase ayarları girilmemiş. baglanti.js dosyasını düzenle.'));
    return fetch(AYAR.URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': AYAR.ANON,
        'Authorization': 'Bearer ' + jeton
      },
      body: JSON.stringify(args || {})
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (g) {
        if (!r.ok) throw new Error((g && (g.message || g.hint)) || ('Sunucu hatası (' + r.status + ')'));
        return g;
      });
    });
  },

  /* Sekme kapanırken bekleyen kaydı göndermek için. Normal fetch unload
     sırasında kesiliyor, keepalive isteğini tarayıcı arka planda bitiriyor. */
  ucusta: function (fn, args) {
    if (!API.kuruldu() || !OTURUM.jwt) return;
    try {
      fetch(AYAR.URL + '/rest/v1/rpc/' + fn, {
        method: 'POST', keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          'apikey': AYAR.ANON,
          'Authorization': 'Bearer ' + OTURUM.jwt
        },
        body: JSON.stringify(args || {})
      });
    } catch (e) { /* kapanış anında yapılacak bir şey yok */ }
  },

  /* ---- Rol ve profil ---- */

  durumTazele: function () {
    return API.rpc('reh_durumum', {}).then(function (g) {
      OTURUM.profil = g || null;
      return OTURUM.profil;
    });
  },

  /* Sayfa açılışında: saklı oturum varsa rolü öğren, yoksa null dön. */
  baslat: function () {
    if (!API.oturumOku()) return Promise.resolve(null);
    return API.durumTazele().catch(function () { API.oturumSil(); return null; });
  }
};
