/* Hata kaydı (2 Eki 2026)
   Sayfada yakalanmayan JavaScript hatalarını ve yakalanmamış promise
   retlerini Supabase'deki hata_kayitlari tablosuna yazar; koç panelinde
   Yönetim > Hatalar kartı listeler. Kurulum: HATA-KAYDI-kurulum.sql
   Kişisel veri gitmez: kullanıcı kimliği yok (anon anahtar), e-posta ve
   jetonlar maskelenir, sayfanın yalnız yolu yazılır (sorgu ve # jeton
   taşıyabilir). Sayfa başına en çok 5 kayıt, aynı hata bir kez. Tarayıcı
   eklentilerinin hataları, ayrıntısız "Script error." ve ağ kopmaları
   (kod hatası değil) atlanır. */
(function () {
  if (window.__hataKurulu || !window.fetch) return;
  window.__hataKurulu = true;

  var URL_ = 'https://hdcxmunvkxkffnsewfgp.supabase.co';
  var ANAHTAR = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY3htdW52a3hrZmZuc2V3ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzA4MDMsImV4cCI6MjEwMjEwNjgwM30.SypEvxn5QXwyLtKdMorumeFhv1_ED-EPwghwjdMSYNw';
  var AG = /^(TypeError: )?(Failed to fetch|NetworkError when attempting to fetch resource\.?|Load failed|The network connection was lost\.?)$|AbortError|aborted/i;
  var gonderilen = 0, gorulen = {};

  function temizle(s, n) {
    return String(s == null ? '' : s)
      .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-posta]')
      .replace(/eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]+/g, '[jeton]')
      .replace(/((?:access|refresh)_token|token_hash|token|code)=[^&\s#]+/gi, '$1=[gizli]')
      .slice(0, n);
  }

  function gonder(mesaj, kaynak, yigin) {
    if (!mesaj || gonderilen >= 5 || AG.test(mesaj)) return;
    var anahtar = mesaj + '|' + kaynak;
    if (gorulen[anahtar]) return;
    gorulen[anahtar] = 1;
    gonderilen++;
    try {
      fetch(URL_ + '/rest/v1/rpc/hata_yaz', {
        method: 'POST',
        keepalive: true,
        headers: { apikey: ANAHTAR, Authorization: 'Bearer ' + ANAHTAR, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_sayfa: location.pathname.slice(0, 120),
          p_mesaj: temizle(mesaj, 300),
          p_kaynak: temizle(kaynak, 200),
          p_yigin: temizle(yigin, 1500),
          p_tarayici: String(navigator.userAgent || '').slice(0, 200)
        })
      }).catch(function () {});
    } catch (e) {}
  }

  window.addEventListener('error', function (e) {
    var dosya = e.filename || '';
    if (!e.message || e.message === 'Script error.' || /^[a-z-]+-extension:/i.test(dosya)) return;
    gonder(e.message, dosya.replace(/^https?:\/\/[^/]+/, '') + ':' + e.lineno + ':' + e.colno,
           e.error && e.error.stack);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason || {}, m = r.message || String(r);
    if (!AG.test(m)) gonder('Yakalanmamış: ' + m, '', r.stack);
  });
})();
