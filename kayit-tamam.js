/* ---------------------------------------------------------------------
   KAYIT TAMAM — e-posta onayı ekranı
   25 Eylül 2026

   Kullanıcılar kayıt olduktan sonra ekranda bir şey değişmediğini söylüyordu:
   paneller küçük bir "Hesap açıldı" yazısı gösterip giriş ekranına dönüyordu,
   kimse e-postasını onaylaması gerektiğini fark etmiyordu.

   Bu dosya altı kayıt yolunun hepsinde aynı tam ekran onay ekranını açar:
     koç · öğrenci · özel ders öğretmen · özel ders öğrenci ·
     rehberlik öğrenci · rehber öğretmen

   NEDEN AYRI SAYFAYA YÖNLENDİRMİYOR
   Öğrenci panelleri öğretmenin davet kodunu (Biyoser: BEKLEYENKOD, özel
   ders: BEKLEYEN_KOD = "BIYO-XXXX-XXXX") yalnız bellekte tutuyor ve adres
   çubuğundan siliyor. Başka sayfaya gidilse kod kaybolur, öğrenci giriş
   yaptığında boş bir kod kutusuyla karşılaşırdı. Bu ekran panelin ÜSTÜNDE
   açılır; kapatınca kullanıcı olduğu gibi duran giriş ekranına düşer.

   Stil çakışmasın diye Shadow DOM içinde çizilir: altı panelin altısının da
   kendi CSS'i var, bu ekran hiçbirinden etkilenmez, hiçbirini etkilemez.

   Kullanım:  kayitTamam({ rol:'koc', eposta:'ali@x.com', kapat:fn })
   rol: koc | ogrenci | ozel-ogretmen | ozel-ogrenci | reh-ogrenci | reh-ogretmen
   --------------------------------------------------------------------- */
(function () {
  'use strict';

  /* Altı panel de aynı Supabase projesini kullanıyor. anon anahtar herkese
     açık olması gereken değerdir; veriyi koruyan RLS ve fonksiyonlardır. */
  var SB_URL = 'https://hdcxmunvkxkffnsewfgp.supabase.co';
  var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY3htdW52a3hrZmZuc2V3ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzA4MDMsImV4cCI6MjEwMjEwNjgwM30.SypEvxn5QXwyLtKdMorumeFhv1_ED-EPwghwjdMSYNw';
  var GONDEREN = 'bilgi@biyoser.com.tr';
  var BEKLEME_SN = 60;                 /* GoTrue aynı adrese 60 sn'den sık göndermiyor */

  var ROLLER = {
    'koc':           { ad: 'Koç hesabın' },
    'ogrenci':       { ad: 'Öğrenci hesabın',
                       devam: 'Öğretmeninin kodunu yazdıysan giriş yapınca kendiliğinden bağlanırsın.' },
    'ozel-ogretmen': { ad: 'Özel ders öğretmen hesabın' },
    'ozel-ogrenci':  { ad: 'Özel ders öğrenci hesabın',
                       devam: 'Öğretmeninin davet kodu bu sekmede bekliyor, giriş yapınca kendiliğinden kullanılır.' },
    'reh-ogrenci':   { ad: 'Kendini Tanı hesabın',
                       devam: 'Giriş yapınca kaydın kaldığı yerden devam eder, verdiğin cevaplar kaybolmaz.' },
    'reh-ogretmen':  { ad: 'Rehber öğretmen hesabın',
                       devam: 'Giriş yapınca rehber kaydın kaldığı yerden devam eder.' }
  };

  /* Bilinen posta sağlayıcıları. Gmail araması "in:anywhere" ile Spam'i de
     kapsar, çocuk postayı hangi klasörde olursa olsun bulur. */
  function saglayici(eposta) {
    var alan = String(eposta || '').split('@')[1] || '';
    alan = alan.toLowerCase();
    if (/^(gmail|googlemail)\.com$/.test(alan))
      return { etiket: 'Gmail'+'’'+'i aç', url: 'https://mail.google.com/mail/u/0/#search/in%3Aanywhere+from%3Abiyoser.com.tr' };
    if (/^(hotmail|outlook|live|msn)\.(com|com\.tr|co\.uk|fr|de)$/.test(alan))
      return { etiket: 'Outlook'+'’'+'u aç', url: 'https://outlook.live.com/mail/0/' };
    if (/^(icloud|me|mac)\.com$/.test(alan))
      return { etiket: 'iCloud Mail'+'’'+'i aç', url: 'https://www.icloud.com/mail' };
    if (/^yandex\.(com|com\.tr|ru)$/.test(alan))
      return { etiket: 'Yandex Posta'+'’'+'yı aç', url: 'https://mail.yandex.com.tr' };
    if (/^yahoo\.(com|com\.tr)$/.test(alan))
      return { etiket: 'Yahoo Mail'+'’'+'i aç', url: 'https://mail.yahoo.com' };
    return null;
  }

  var AY = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];

  /* Metin hiçbir zaman innerHTML ile basılmaz: eposta dışarıdan gelen bir değer. */
  function el(etiket, sinif, metin) {
    var e = document.createElement(etiket);
    if (sinif) e.className = sinif;
    if (metin != null) e.textContent = metin;
    return e;
  }

  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box}',
    '.perde{position:fixed;inset:0;z-index:2147483000;overflow-y:auto;-webkit-overflow-scrolling:touch;',
    '  background:radial-gradient(130% 80% at 50% -10%,#123a57 0%,#0B2D45 34%,#03182B 72%,#020f1c 100%);',
    '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;',
    '  color:#DDE7EC;-webkit-font-smoothing:antialiased;line-height:1.55}',
    '.kap{position:relative;max-width:560px;margin:0 auto;padding:clamp(56px,8vh,84px) 20px 44px}',
    '.kapat{position:absolute;top:14px;right:14px;width:42px;height:42px;border-radius:50%;',
    '  border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#DDE7EC;',
    '  font-family:inherit;font-weight:400;font-size:22px;line-height:1;cursor:pointer;display:grid;place-items:center}',
    '.kapat:hover{background:rgba(255,255,255,.12)}',

    /* ---- zarf: uçak postası kenarı, pul, damga, alıcı etiketi ---- */
    '.zarfSar{perspective:900px}',
    '.zarf{position:relative;aspect-ratio:1.62/1;border-radius:10px;padding:9px;',
    '  background:repeating-linear-gradient(135deg,#E8873A 0 13px,#FBF6EC 13px 20px,#0B2D45 20px 33px,#FBF6EC 33px 40px);',
    '  box-shadow:0 34px 60px -22px rgba(0,0,0,.72),0 12px 24px -12px rgba(0,0,0,.5);',
    '  transform-origin:50% 100%}',
    '.kagit{position:absolute;inset:9px;border-radius:5px;background:#FBF6EC;overflow:hidden;',
    '  background-image:linear-gradient(180deg,rgba(18,36,48,.035),rgba(18,36,48,0) 40%)}',
    '.pul{position:absolute;top:8%;right:6%;width:17%;aspect-ratio:.82/1;background:#fff;padding:7px;',
    '  -webkit-mask:radial-gradient(circle at 50% 50%,#000 64%,transparent 66%) 0 0/9px 9px repeat,linear-gradient(#000,#000) 4px 4px/calc(100% - 8px) calc(100% - 8px) no-repeat;',
    '          mask:radial-gradient(circle at 50% 50%,#000 64%,transparent 66%) 0 0/9px 9px repeat,linear-gradient(#000,#000) 4px 4px/calc(100% - 8px) calc(100% - 8px) no-repeat;',
    '  filter:drop-shadow(0 1px 0 rgba(0,0,0,.08))}',
    '.pulIc{width:100%;height:100%;border-radius:2px;background:linear-gradient(160deg,#0B2D45,#03182B);',
    '  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4%}',
    '.pulIc svg{width:46%;height:auto}',
    '.pulIc span{font-size:clamp(6px,1.5vw,9px);font-weight:900;letter-spacing:.08em;color:#F5A661;white-space:nowrap}',
    '.damga{position:absolute;top:4%;right:17%;width:30%;color:rgba(18,36,48,.62);transform:rotate(-13deg);',
    '  mix-blend-mode:multiply;pointer-events:none}',
    '.damga svg{display:block;width:100%;height:auto}',
    '.etiket{position:absolute;left:9%;right:9%;bottom:15%}',
    '.etiket small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.2em;color:#7E939F;margin-bottom:6px}',
    '.adres{font-family:"SF Mono","JetBrains Mono",Consolas,Menlo,monospace;font-weight:700;color:#122430;',
    '  font-size:clamp(15px,4.2vw,21px);line-height:1.25;overflow-wrap:anywhere;',
    '  padding-bottom:8px;border-bottom:1.5px solid rgba(18,36,48,.22)}',
    '.adres.bos{color:#7E939F;font-weight:500}',
    '.yanlis{margin:12px 2px 0;font-size:12.5px;color:#9FB2BD;text-align:center}',

    /* ---- metin ---- */
    '.gov{text-align:left;margin-top:34px}',
    'h2{margin:0;font-size:clamp(27px,5.6vw,36px);font-weight:800;letter-spacing:-.022em;line-height:1.12;color:#fff}',
    'h2 em{font-style:normal;color:#F5A661}',
    '.alt{margin:12px 0 0;font-size:16.5px;color:#B9C8D1}',
    '.alt b{color:#fff;font-weight:700}',

    /* iki adım: gerçekten bir sıra, numaralar bunu söylüyor */
    'ol{list-style:none;margin:26px 0 0;padding:0;display:grid;gap:12px}',
    'li{display:grid;grid-template-columns:34px 1fr;gap:14px;align-items:start;',
    '  padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08)}',
    'li .no{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;',
    '  background:#E8873A;color:#03182B;font-weight:900;font-size:16px}',
    'li b{display:block;color:#fff;font-size:16px;font-weight:700;line-height:1.35;margin-top:5px}',
    'li span{display:block;font-size:13.5px;color:#9FB2BD;margin-top:3px}',

    /* düğmeler */
    '.dugmeler{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}',
    '.btn{flex:1 1 200px;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;',
    '  padding:12px 20px;border-radius:12px;font-family:inherit;font-weight:700;font-size:15.5px;line-height:1.2;cursor:pointer;text-decoration:none;',
    '  border:1.5px solid transparent;transition:transform .15s,background .15s,border-color .15s}',
    '.btn:hover{transform:translateY(-1px)}',
    '.btn.dolu{background:#E8873A;color:#03182B;box-shadow:0 10px 22px -10px rgba(232,135,58,.7)}',
    '.btn.dolu:hover{background:#F5A661}',
    '.btn.bos{background:transparent;color:#DDE7EC;border-color:rgba(255,255,255,.22)}',
    '.btn.bos:hover{border-color:rgba(255,255,255,.45);background:rgba(255,255,255,.05)}',
    '.btn:focus-visible,.kapat:focus-visible,.yeniden:focus-visible,input:focus-visible{outline:3px solid #F5A661;outline-offset:3px}',

    /* posta gelmedi mi */
    '.yardim{margin-top:30px;padding-top:22px;border-top:1px dashed rgba(255,255,255,.16)}',
    '.yardim h3{margin:0 0 8px;font-size:15px;font-weight:800;color:#fff}',
    '.yardim p{margin:0 0 10px;font-size:14px;color:#9FB2BD}',
    '.yardim p b{color:#DDE7EC;font-family:"SF Mono","JetBrains Mono",Consolas,Menlo,monospace;font-weight:700;font-size:13.5px}',
    '.satir{display:flex;flex-wrap:wrap;gap:10px;align-items:center}',
    '.satir input{flex:1 1 220px;min-height:44px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);',
    '  background:rgba(255,255,255,.06);color:#fff;font-family:inherit;font-weight:500;font-size:15px}',
    '.yeniden{min-height:44px;padding:10px 16px;border-radius:10px;border:1.5px solid #2FA79E;background:transparent;',
    '  color:#8FE0D6;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer}',
    '.yeniden:hover:not(:disabled){background:rgba(47,167,158,.12)}',
    '.yeniden:disabled{opacity:.55;cursor:default}',
    '.durum{margin-top:10px;font-size:13.5px;min-height:1.2em}',
    '.durum.ok{color:#8FE0D6}.durum.hata{color:#F5A69F}',

    /* açılış: zarf aşağıdan gelip yerine oturur, damga ardından basılır */
    '@keyframes gel{0%{opacity:0;transform:translateY(46px) rotateX(24deg) rotate(-4deg)}',
    '  70%{opacity:1;transform:translateY(-4px) rotateX(0) rotate(.6deg)}100%{transform:none}}',
    '@keyframes bas{0%{opacity:0;transform:rotate(-13deg) scale(1.7)}60%{opacity:1;transform:rotate(-13deg) scale(.94)}',
    '  100%{opacity:1;transform:rotate(-13deg) scale(1)}}',
    '@keyframes belir{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
    '.zarf{animation:gel .75s cubic-bezier(.22,.68,.32,1) both}',
    '.damga{animation:bas .45s cubic-bezier(.22,.68,.32,1) .62s both}',
    '.gov{animation:belir .5s ease .35s both}',
    '@media (prefers-reduced-motion:reduce){.zarf,.damga,.gov{animation:none}.btn:hover{transform:none}}',
    '@media (max-width:420px){.kap{padding-left:16px;padding-right:16px}li{padding:12px 13px}}'
  ].join('\n');

  /* DNA sarmalı: Biyoser logosundaki işaret, pulun içinde */
  var DNA = '<svg viewBox="0 0 30 48" fill="none" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M8 2C8 12 22 14 22 24S8 36 8 46" stroke="#E8873A" stroke-width="3.4"/>' +
    '<path d="M22 2C22 12 8 14 8 24S22 36 22 46" stroke="#F5A661" stroke-width="3.4" opacity=".55"/>' +
    '<g stroke="#FBF6EC" stroke-width="2" opacity=".75">' +
    '<line x1="10" y1="6" x2="20" y2="6"/><line x1="11" y1="19" x2="19" y2="19"/>' +
    '<line x1="11" y1="29" x2="19" y2="29"/><line x1="10" y1="42" x2="20" y2="42"/></g></svg>';

  function damgaSVG(gun, ay, yil) {
    return '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<defs><path id="yay" d="M17,60 a43,43 0 1,1 86,0"/></defs>' +
      '<circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="3.2"/>' +
      '<circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<text font-family="Segoe UI,Arial,sans-serif" font-size="11.5" font-weight="800" letter-spacing="3.2" fill="currentColor">' +
      '<textPath href="#yay" startOffset="50%" text-anchor="middle">BİYOSER</textPath></text>' +
      '<text x="60" y="61" text-anchor="middle" font-family="Consolas,monospace" font-size="17" font-weight="800" fill="currentColor">' +
      gun + ' ' + ay + '</text>' +
      '<text x="60" y="80" text-anchor="middle" font-family="Consolas,monospace" font-size="12" font-weight="700" fill="currentColor">' +
      yil + '</text></svg>';
  }

  var acik = null;

  window.kayitTamam = function (ayar) {
    ayar = ayar || {};
    if (acik) acik.kapat(true);

    var rol = ROLLER[ayar.rol] || { ad: 'Hesabın' };
    var eposta = String(ayar.eposta || '').trim();
    var eGecerli = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(eposta);
    var onceki = document.activeElement;

    var konak = el('div');
    konak.setAttribute('data-kayit-tamam', '');
    var golge = konak.attachShadow ? konak.attachShadow({ mode: 'open' }) : konak;
    var stil = el('style'); stil.textContent = CSS; golge.appendChild(stil);

    var perde = el('div', 'perde');
    perde.setAttribute('role', 'dialog');
    perde.setAttribute('aria-modal', 'true');
    perde.setAttribute('aria-labelledby', 'kt-baslik');
    var kap = el('div', 'kap');
    perde.appendChild(kap);

    var kapatBtn = el('button', 'kapat', '×');
    kapatBtn.type = 'button';
    kapatBtn.setAttribute('aria-label', 'Kapat ve giriş ekranına dön');
    kap.appendChild(kapatBtn);

    /* ---- zarf ---- */
    var simdi = new Date();
    var zarfSar = el('div', 'zarfSar');
    var zarf = el('div', 'zarf');
    zarf.setAttribute('role', 'img');
    zarf.setAttribute('aria-label', eGecerli ? (eposta + ' adresine gönderilmiş bir onay postası') : 'Gönderilmiş bir onay postası');
    var kagit = el('div', 'kagit');
    var pul = el('div', 'pul'); var pulIc = el('div', 'pulIc');
    pulIc.innerHTML = DNA; pulIc.appendChild(el('span', null, 'BİYOSER'));
    pul.appendChild(pulIc);
    var damga = el('div', 'damga');
    damga.innerHTML = damgaSVG(String(simdi.getDate()).padStart(2, '0'), AY[simdi.getMonth()], simdi.getFullYear());
    var etiket = el('div', 'etiket');
    etiket.appendChild(el('small', null, 'ALICI'));
    var adres = el('div', 'adres' + (eGecerli ? '' : ' bos'), eGecerli ? eposta : 'kayıt olduğun e-posta adresi');
    etiket.appendChild(adres);
    kagit.appendChild(pul); kagit.appendChild(damga); kagit.appendChild(etiket);
    zarf.appendChild(kagit); zarfSar.appendChild(zarf);
    kap.appendChild(zarfSar);
    if (eGecerli) kap.appendChild(el('p', 'yanlis', 'Adres yanlış mı? Bu ekranı kapatıp doğru adresle yeniden kaydol.'));

    /* ---- metin ---- */
    var gov = el('div', 'gov');
    var h = el('h2'); h.id = 'kt-baslik';
    h.appendChild(document.createTextNode('Hesabın açıldı. '));
    h.appendChild(el('em', null, 'Bir adım kaldı.'));
    gov.appendChild(h);
    var alt = el('p', 'alt');
    alt.appendChild(document.createTextNode(rol.ad + ' hazır, ama giriş yapabilmen için '));
    alt.appendChild(el('b', null, 'e-posta adresini onaylaman'));
    alt.appendChild(document.createTextNode(' gerekiyor. Onaylamadan giriş yapmayı denersen içeri alınmazsın.'));
    gov.appendChild(alt);

    var ol = el('ol');
    var li1 = el('li'); li1.appendChild(el('div', 'no', '1'));
    var li1m = el('div'); li1m.appendChild(el('b', null, 'E-postandaki onay bağlantısına tıkla'));
    li1m.appendChild(el('span', null, 'Postayı ' + GONDEREN + ' gönderdi; bir iki dakika içinde gelir.'));
    li1.appendChild(li1m); ol.appendChild(li1);
    var li2 = el('li'); li2.appendChild(el('div', 'no', '2'));
    var li2m = el('div'); li2m.appendChild(el('b', null, 'Bu sekmeye dön ve giriş yap'));
    li2m.appendChild(el('span', null, rol.devam || 'Bu sekmeyi açık bırak; onaydan sonra aynı e-posta ve şifreyle girersin.'));
    li2.appendChild(li2m); ol.appendChild(li2);
    gov.appendChild(ol);

    var dugmeler = el('div', 'dugmeler');
    var sag = eGecerli ? saglayici(eposta) : null;
    if (sag) {
      var ac = el('a', 'btn dolu', sag.etiket + ' ↗');
      ac.href = sag.url; ac.target = '_blank'; ac.rel = 'noopener noreferrer';
      dugmeler.appendChild(ac);
    }
    var don = el('button', 'btn ' + (sag ? 'bos' : 'dolu'), 'Giriş ekranına dön');
    don.type = 'button';
    dugmeler.appendChild(don);
    gov.appendChild(dugmeler);

    /* ---- posta gelmedi mi ---- */
    var yardim = el('div', 'yardim');
    yardim.appendChild(el('h3', null, 'Posta gelmedi mi?'));
    var p1 = el('p');
    p1.appendChild(document.createTextNode('Önce Gereksiz / Spam klasörüne bak. Gönderen: '));
    p1.appendChild(el('b', null, GONDEREN));
    yardim.appendChild(p1);
    yardim.appendChild(el('p', null, 'Orada da yoksa yeniden gönder.'));
    var satir = el('div', 'satir');
    var giris = null;
    if (!eGecerli) {
      giris = el('input'); giris.type = 'email'; giris.placeholder = 'Kayıt olduğun e-posta';
      giris.autocomplete = 'email'; giris.setAttribute('aria-label', 'Kayıt olduğun e-posta');
      satir.appendChild(giris);
    }
    var yeniden = el('button', 'yeniden', 'Postayı yeniden gönder');
    yeniden.type = 'button';
    satir.appendChild(yeniden);
    yardim.appendChild(satir);
    var durum = el('div', 'durum'); durum.setAttribute('role', 'status'); durum.setAttribute('aria-live', 'polite');
    yardim.appendChild(durum);
    gov.appendChild(yardim);
    kap.appendChild(gov);

    golge.appendChild(perde);
    document.body.appendChild(konak);
    var eskiTasma = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    /* ---- yeniden gönderme ---- */
    var sayac = null;
    function geriSay(sn) {
      clearInterval(sayac);
      var kalan = sn;
      yeniden.disabled = true;
      yeniden.textContent = 'Yeniden gönder (' + kalan + ' sn)';
      sayac = setInterval(function () {
        kalan--;
        if (kalan <= 0) { clearInterval(sayac); yeniden.disabled = false; yeniden.textContent = 'Postayı yeniden gönder'; return; }
        yeniden.textContent = 'Yeniden gönder (' + kalan + ' sn)';
      }, 1000);
    }
    /* Kayıt anında GoTrue zaten bir posta gönderdi: ilk 60 sn içinde yeniden
       göndermek 429 döner. Düğme o süre kilitli başlar. */
    geriSay(BEKLEME_SN);

    yeniden.onclick = function () {
      var adr = eGecerli ? eposta : String(giris.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(adr)) {
        durum.className = 'durum hata'; durum.textContent = 'Geçerli bir e-posta adresi yaz.';
        if (giris) giris.focus();
        return;
      }
      yeniden.disabled = true; yeniden.textContent = 'Gönderiliyor…';
      durum.className = 'durum'; durum.textContent = '';
      fetch(SB_URL + '/auth/v1/resend', {
        method: 'POST',
        headers: { 'apikey': SB_ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'signup', email: adr })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (g) { return { r: r, g: g }; });
      }).then(function (s) {
        if (s.r.ok) {
          durum.className = 'durum ok';
          durum.textContent = 'Yeni onay postası gönderildi. Gelmezse Gereksiz klasörüne bak.';
          geriSay(BEKLEME_SN);
        } else if (s.r.status === 429) {
          durum.className = 'durum hata';
          durum.textContent = 'Çok sık denendi. Bir dakika sonra tekrar dene.';
          geriSay(BEKLEME_SN);
        } else {
          durum.className = 'durum hata';
          durum.textContent = 'Gönderilemedi: ' + (s.g.msg || s.g.error_description || s.g.message || ('sunucu ' + s.r.status));
          yeniden.disabled = false; yeniden.textContent = 'Postayı yeniden gönder';
        }
      }).catch(function () {
        durum.className = 'durum hata';
        durum.textContent = 'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.';
        yeniden.disabled = false; yeniden.textContent = 'Postayı yeniden gönder';
      });
    };

    /* ---- kapatma, klavye, odak ---- */
    function odaklanabilir() {
      return Array.prototype.slice.call(perde.querySelectorAll('button,a[href],input'))
        .filter(function (x) { return !x.disabled; });
    }
    function tus(e) {
      if (e.key === 'Escape') { e.preventDefault(); kapat(); return; }
      if (e.key !== 'Tab') return;
      var liste = odaklanabilir(); if (!liste.length) return;
      var ilk = liste[0], son = liste[liste.length - 1];
      var aktif = golge.activeElement || document.activeElement;
      if (e.shiftKey && aktif === ilk) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && aktif === son) { e.preventDefault(); ilk.focus(); }
    }
    function kapat(sessiz) {
      clearInterval(sayac);
      document.removeEventListener('keydown', tus, true);
      document.documentElement.style.overflow = eskiTasma;
      if (konak.parentNode) konak.parentNode.removeChild(konak);
      acik = null;
      if (!sessiz) {
        if (typeof ayar.kapat === 'function') { try { ayar.kapat(); } catch (x) {} }
        if (onceki && onceki.focus) { try { onceki.focus(); } catch (x) {} }
      }
    }
    kapatBtn.onclick = function () { kapat(); };
    don.onclick = function () { kapat(); };
    document.addEventListener('keydown', tus, true);

    setTimeout(function () { (sag ? dugmeler.firstChild : don).focus(); }, 60);

    acik = { kapat: kapat };
    return acik;
  };
})();
