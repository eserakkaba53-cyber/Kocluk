/* Bot doğrulaması (Cloudflare Turnstile) — 27 Eyl 2026
   Supabase Auth'ta captcha açıkken kayıt, şifreyle giriş, şifre sıfırlama ve
   posta yeniden gönderme istekleri jetonsuz reddedilir. Bu dosya fetch'i sarar
   ve yalnız o uçlara giden isteklere taze bir jeton ekler; sayfalardaki
   çağrılar olduğu gibi kalır, sonradan eklenen bir form da kendiliğinden
   kapsanır. Jeton tek kullanımlık, her istekte bileşen yeniden çizilir.
   Çoğu kişi hiçbir şey görmez; Cloudflare şüphelenirse ekranın altında bir
   kutu çıkar, tıklanınca istek devam eder.
   Yerelde (localhost, file:) Cloudflare'in her zaman geçen deneme anahtarı
   kullanılır; Supabase'de captcha açıldıktan sonra yerel giriş çalışmaz.
   Aynı dosyada iki adımlı giriş yardımcısı da var (ikiAdimTamamla). */
(function () {
  if (window.__dogrulamaKurulu || !window.fetch) return;
  window.__dogrulamaKurulu = true;

  var yerel = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var SITE = yerel ? '1x00000000000000000000AA' : '0x4AAAAAAFFQmby3osT4G1bs';
  var UC = /\/auth\/v1\/(signup|recover|resend|otp|magiclink)(\?|$)|\/auth\/v1\/token\?grant_type=password/;
  var HATA = 'Bot doğrulaması tamamlanamadı. Sayfayı yenileyip tekrar dene.';
  var yukleme = null;

  function yukle() {
    if (window.turnstile) return Promise.resolve();
    if (!yukleme) yukleme = new Promise(function (tamam, red) {
      window.__turnstileHazir = tamam;
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__turnstileHazir';
      s.onerror = function () {
        yukleme = null;
        red(new Error('Bot doğrulaması yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.'));
      };
      document.head.appendChild(s);
    });
    return yukleme;
  }

  function jeton() {
    return yukle().then(function () {
      return new Promise(function (tamam, red) {
        var kutu = document.createElement('div');
        kutu.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647';
        document.body.appendChild(kutu);
        var id, bitti = false;
        function son(hata, j) {
          if (bitti) return true;
          bitti = true;
          setTimeout(function () { try { turnstile.remove(id); } catch (e) {} kutu.remove(); }, 0);
          if (hata) red(new Error(HATA)); else tamam(j);
          return true;
        }
        id = turnstile.render(kutu, {
          sitekey: SITE, appearance: 'interaction-only', language: 'tr',
          callback: function (j) { son(false, j); },
          'error-callback': function () { return son(true); },
          'timeout-callback': function () { son(true); }
        });
      });
    });
  }

  var asil = window.fetch.bind(window);

  /* İki adımlı giriş (TOTP). Hesapta doğrulanmış faktör varsa ve oturum aal2
     değilse doğrulama uygulamasındaki kodu sorar ve aal2 oturumunu döndürür;
     gerek yoksa null. Yönetici yetkisi veritabanında aal2 ister
     (GUVENLIK-yonetici-iki-adim.sql). Hata nesnesinde kod = HTTP durumu. */
  window.ikiAdimTamamla = function (url, anahtar, jeton) {
    var aal;
    try { aal = JSON.parse(atob(jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal; } catch (e) {}
    if (aal === 'aal2') return Promise.resolve(null);
    function cagir(yol, govde) {
      return asil(url.replace(/\/+$/, '') + yol, {
        method: govde ? 'POST' : 'GET',
        headers: { apikey: anahtar, Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json' },
        body: govde ? JSON.stringify(govde) : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok) return j;
          var h = new Error(j.msg || j.message || j.error_description || ('HTTP ' + r.status));
          h.kod = r.status;
          throw h;
        });
      });
    }
    return cagir('/auth/v1/user').then(function (u) {
      var f = (u.factors || []).filter(function (x) { return x.factor_type === 'totp' && x.status === 'verified'; })[0];
      if (!f) return null;
      return (function sor(mesaj) {
        return (window.ikiAdimKodSor || kodKutusu)(mesaj).then(function (kod) {
          if (kod === null) throw new Error('İki adımlı giriş tamamlanmadı. Yeniden giriş yapıp doğrulama uygulamandaki kodu yaz.');
          return cagir('/auth/v1/factors/' + f.id + '/challenge', {})
            .then(function (c) { return cagir('/auth/v1/factors/' + f.id + '/verify', { challenge_id: c.id, code: kod.replace(/\s/g, '') }); })
            .catch(function (e) {
              if (e.kod === 400 || e.kod === 422) return sor('Kod tutmadı ya da süresi geçti. Uygulamadaki güncel 6 haneli kodu yaz.');
              throw e;
            });
        });
      })('Doğrulama uygulamasında Biyoser satırındaki 6 haneli kodu yaz.');
    });
  };

  /* Kod kutusu. prompt() uygulama içi tarayıcılarda (WhatsApp, Instagram,
     masaüstü uygulama panelleri) çoğu zaman açılmıyor; sayfa içi kutu her
     yerde çalışır. Vazgeç = null. */
  function kodKutusu(mesaj) {
    return new Promise(function (tamam) {
      var ort = document.createElement('div');
      ort.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(10,31,51,.6);' +
        'display:flex;align-items:center;justify-content:center;padding:16px';
      ort.innerHTML =
        '<form style="background:#fff;color:#0a1f33;border-radius:14px;padding:22px;width:100%;max-width:340px;' +
        'font:15px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.35)">' +
        '<b style="display:block;font-size:17px;margin-bottom:6px">İki adımlı giriş</b><p style="margin:0 0 12px"></p>' +
        '<input inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="123456" aria-label="6 haneli kod" ' +
        'style="width:100%;box-sizing:border-box;font-size:22px;letter-spacing:4px;text-align:center;padding:10px;' +
        'border:1.5px solid #9fb0bf;border-radius:10px">' +
        '<div style="display:flex;gap:8px;margin-top:14px">' +
        '<button type="button" style="flex:1;padding:10px;border-radius:10px;border:1px solid #9fb0bf;background:#fff;color:#0a1f33;font:inherit">Vazgeç</button>' +
        '<button type="submit" style="flex:1;padding:10px;border-radius:10px;border:0;background:#1f6f63;color:#fff;font:inherit;font-weight:700">Doğrula</button>' +
        '</div></form>';
      var f = ort.firstChild, g = f.querySelector('input');
      f.querySelector('p').textContent = mesaj;
      function bitir(v) { ort.remove(); tamam(v); }
      f.onsubmit = function (e) { e.preventDefault(); bitir(g.value); };
      f.querySelector('button[type=button]').onclick = function () { bitir(null); };
      document.body.appendChild(ort);
      g.focus();
    });
  }

  window.fetch = function (girdi, ayar) {
    var url = String((girdi && girdi.url) || girdi);
    if (!UC.test(url) || !ayar || typeof ayar.body !== 'string') return asil(girdi, ayar);
    var govde;
    try { govde = JSON.parse(ayar.body); } catch (e) { return asil(girdi, ayar); }
    return jeton().then(function (j) {
      govde.gotrue_meta_security = { captcha_token: j };
      return asil(girdi, Object.assign({}, ayar, { body: JSON.stringify(govde) }));
    }).then(function (r) {
      if (r.ok) return r;
      /* GoTrue'nun İngilizce captcha hatasını sayfaların okuduğu alanlara Türkçe yaz. */
      return r.clone().text().then(function (t) {
        if (!/captcha/i.test(t)) return r;
        return new Response(JSON.stringify({ error: HATA, error_description: HATA, msg: HATA, message: HATA }),
          { status: r.status, headers: { 'Content-Type': 'application/json' } });
      });
    });
  };
})();
