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
        /* ★ 27 Eyl 2026 — Kayıtlı ve onaylı adrese GoTrue 200 + BOŞ identities
           döner ve posta göndermez. Bu da 'doğrulama gerekli' sayılıyordu:
           Biyoser koç ya da öğrencisi buradan kaydolunca hiç gelmeyecek postayı
           bekliyordu. Kullanıcı havuzu ortak, giriş yapması yeter. */
        if (Array.isArray(g.identities) && !g.identities.length)
          throw new Error('Bu e-posta ile zaten bir Biyoser hesabı var. Giriş ekranından aynı e-posta ve şifreyle gir; şifreni unuttuysan "Şifremi unuttum"u kullan.');
        return { dogrulama_gerekli: true };
      });
  },

  girisYap: function (eposta, sifre) {
    return API.auth('/auth/v1/token?grant_type=password',
      { email: eposta, password: sifre }).then(API.oturumKur)
      .catch(function (x) {
        /* Onaylanmamış hesap: yazının yanında yeni posta isteyebileceği ekran. */
        if (x.kod === 'email_not_confirmed' && window.kayitTamam)
          kayitTamam({ durum: 'onaysiz', eposta: eposta,
            rol: /panel\.html$/.test(location.pathname) ? 'reh-ogretmen' : 'reh-ogrenci' });
        throw x;
      });
  },

  sifreUnuttum: function (eposta) {
    /* ★ 20 Eyl 2026 — redirect_to yazılmazsa Supabase projenin Site URL'ini
       kullanır, o da biyoser.com.tr ana sayfasıdır: rehber öğretmen yeni şifre
       ekranını hiç göremez. Adresin Supabase panelinde
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
        if (!r.ok) {
          var h = new Error(API.authMesaji(g, r.status));
          h.kod = g.error_code || '';   /* email_not_confirmed gibi: ekranı seçmek için */
          throw h;
        }
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
    if (m.indexOf('different from the old') >= 0)
      return 'Yeni şifre eskisiyle aynı olamaz.';
    if (m.indexOf('password should be') >= 0 || m.indexOf('password must') >= 0)
      return 'Şifre en az 6 karakter olmalı.';
    if (m.indexOf('email not confirmed') >= 0)
      return 'E-postanı doğrulaman gerekiyor. Gelen kutunu kontrol et.';
    if (m.indexOf('unable to validate email') >= 0 || m.indexOf('invalid email') >= 0)
      return 'E-posta adresi geçerli görünmüyor.';
    if (m.indexOf('only request this after') >= 0)
      return 'Bu adrese az önce posta gönderildi. Gelen kutuna bak; gelmediyse bir dakika sonra yeniden dene.';
    if (m.indexOf('rate limit') >= 0 || durum === 429)
      return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
    /* E-posta sınırında ya da posta gönderilemeyince GoTrue hesabı açmaz. */
    if (m.indexOf('error sending') >= 0)
      return 'Onay postası şu an gönderilemedi, hesap açılmadı. Birkaç dakika sonra yeniden kaydol.';
    /* auth.users tetikleyicisi (geçici posta kara listesi) patlarsa istemciye
       yalnız 'Database error saving new user' gelir, Türkçe metin gelmez. */
    if (m.indexOf('database error') >= 0)
      return 'Bu e-posta adresiyle hesap açılamadı. Geçici posta servisleri kabul edilmiyor; Gmail, Outlook ya da okul adresinle kaydol.';
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

/* ---- Şifre sıfırlama dönüşü ----
   ★ 27 Eyl 2026 — sifreUnuttum() bağlantıyı bu sayfaya döndürüyordu ama hiçbir
   rehberlik sayfası dönüşü okumuyordu: kullanıcı "bağlantı gönderildi" yazısını
   görüyor, bağlantıya tıklayınca düz giriş ekranına düşüyor, şifresi hiç
   değişmiyordu. Dönüş iki biçimde gelir:
     #access_token=…&refresh_token=…&type=recovery    geçerli bağlantı
     #error=access_denied&error_code=otp_expired       kullanılmış / süresi dolmuş
   Geçerli bağlantıda yeni şifre sorulur; kaydedilince oturum açılır ve sayfa
   yenilenir. Jeton adres çubuğundan hemen silinir. Üç sayfanın CSS'i farklı,
   ekran kendi stilini taşır (renkler kayit-tamam.js ile aynı). */
(function () {
  var hp = new URLSearchParams((location.hash || '').replace(/^#/, ''));
  var jwt = hp.get('type') === 'recovery' ? hp.get('access_token') : null;
  var hata = hp.get('error_code') || hp.get('error');
  if (!jwt && !hata) return;
  var oturum = jwt ? { access_token: jwt, refresh_token: hp.get('refresh_token'),
                       expires_in: +hp.get('expires_in') || 3600 } : null;
  history.replaceState(null, '', location.pathname + location.search);

  var DUGME = 'display:block;width:100%;min-height:50px;margin-top:16px;border:0;border-radius:12px;' +
    'background:#E8873A;color:#03182B;font:inherit;font-weight:700;font-size:16px;cursor:pointer';
  var SADE = 'display:block;margin:12px auto 0;border:0;background:none;color:#9FB2BD;' +
    'font:inherit;font-size:14.5px;text-decoration:underline;cursor:pointer';
  var GIRDI = 'display:block;width:100%;box-sizing:border-box;margin-top:10px;min-height:48px;padding:10px 14px;' +
    'border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);' +
    'color:#fff;font:inherit;font-size:16px';

  function kur() {
    var perde = document.createElement('div');
    perde.setAttribute('role', 'dialog');
    perde.setAttribute('aria-modal', 'true');
    perde.setAttribute('aria-labelledby', 'ys-baslik');
    perde.style.cssText = 'position:fixed;inset:0;z-index:2147483000;overflow-y:auto;display:flex;' +
      'align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;' +
      'background:radial-gradient(130% 80% at 50% -10%,#123a57 0%,#0B2D45 34%,#03182B 72%,#020f1c 100%);' +
      'color:#DDE7EC;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif';
    var kutu = document.createElement('div');
    kutu.style.cssText = 'width:100%;max-width:420px';
    function ekle(etiket, metin, css) {
      var e = document.createElement(etiket);
      if (metin) e.textContent = metin;
      if (css) e.style.cssText = css;
      kutu.appendChild(e);
      return e;
    }
    function kapat() { if (perde.parentNode) perde.parentNode.removeChild(perde); }
    var BASLIK = 'margin:0;font-family:inherit;font-size:27px;font-weight:800;letter-spacing:-.02em;line-height:1.15;color:#fff';
    var METIN = 'margin:12px 0 4px;font-size:16px;color:#B9C8D1';

    if (!oturum) {
      ekle('h2', 'Bu bağlantı artık geçerli değil.', BASLIK).id = 'ys-baslik';
      ekle('p', 'Şifre sıfırlama bağlantıları tek kullanımlık ve süreli. Bazı posta servisleri ' +
        'bağlantıyı güvenlik taraması için senden önce açabiliyor. Giriş ekranında e-postanı ' +
        'yazıp "Şifremi unuttum"a yeniden bas.', METIN);
      var don = ekle('button', 'Giriş ekranına dön', DUGME);
      don.type = 'button'; don.onclick = kapat;
    } else {
      ekle('h2', 'Yeni şifreni belirle.', BASLIK).id = 'ys-baslik';
      ekle('p', 'En az 6 karakter. Kaydedince bu sayfada oturumun açılır.', METIN);
      var s1 = ekle('input', null, GIRDI);
      s1.type = 'password'; s1.autocomplete = 'new-password';
      s1.placeholder = 'Yeni şifre'; s1.setAttribute('aria-label', 'Yeni şifre');
      var s2 = ekle('input', null, GIRDI);
      s2.type = 'password'; s2.autocomplete = 'new-password';
      s2.placeholder = 'Yeni şifre (tekrar)'; s2.setAttribute('aria-label', 'Yeni şifre tekrar');
      var kaydet = ekle('button', 'Şifreyi kaydet', DUGME);
      kaydet.type = 'button';
      var not = ekle('div', '', 'margin-top:12px;min-height:1.3em;font-size:14.5px;color:#F5A69F');
      not.setAttribute('role', 'alert');
      var vazgec = ekle('button', 'Vazgeç', SADE);
      vazgec.type = 'button'; vazgec.onclick = kapat;

      kaydet.onclick = function () {
        var a = s1.value;
        if (a.length < 6) { not.textContent = 'Şifre en az 6 karakter olmalı.'; s1.focus(); return; }
        if (a !== s2.value) { not.textContent = 'İki şifre aynı değil.'; s2.focus(); return; }
        kaydet.disabled = true; kaydet.textContent = 'Kaydediliyor…'; not.textContent = '';
        fetch(AYAR.URL + '/auth/v1/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'apikey': AYAR.ANON,
                     'Authorization': 'Bearer ' + oturum.access_token },
          body: JSON.stringify({ password: a })
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (g) {
            if (!r.ok) throw new Error(r.status === 401 || r.status === 403
              ? 'Bağlantının süresi dolmuş. Giriş ekranında "Şifremi unuttum"a yeniden bas.'
              : API.authMesaji(g, r.status));
            API.oturumKur(oturum);
            location.reload();
          });
        }).catch(function (x) {
          not.textContent = x.message || 'Bağlantı kurulamadı. İnternetini kontrol et.';
          kaydet.disabled = false; kaydet.textContent = 'Şifreyi kaydet';
        });
      };
      s2.addEventListener('keydown', function (e) { if (e.key === 'Enter') kaydet.click(); });
    }
    perde.appendChild(kutu);
    document.body.appendChild(perde);
    var ilk = kutu.querySelector('input,button');
    if (ilk) ilk.focus();
  }
  if (document.body) kur(); else document.addEventListener('DOMContentLoaded', kur);
})();

