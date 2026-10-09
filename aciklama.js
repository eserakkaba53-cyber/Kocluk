/* ================= SAĞ AÇIKLAMA SÜTUNU (9 Eki 2026) =================
   Koç ve öğrenci panelinde sağda, sol rayla aynı renkte bir sütun. Ekrandaki her
   kartın hizasında üç kısa bilgi durur: kartın ne olduğu, ne işe yaradığı ve nasıl
   kullanıldığı. Kart, başlığıyla (h2) ya da içindeki bir öğeyle (sec) tanınır;
   sekme verilirse yalnız o sekmede eşleşir. Hangi panelde olduğumuzu sayfa
   window.ACIKLAMA_PANEL ile söyler ('koc' | 'ogrenci'). Dar ekranda sütun gizlenir. */
(function(){
  'use strict';

  var KOC = [
    // ---- Haftalık ----
    { tab:'hafta', sec:'.stats', bas:'Haftanın özeti',
      ne:'Bu haftanın ödev sayısı, devreden ödevler, haftalık hedef süre ve sınava kalan hafta.',
      ise:'Öğrencinin bu haftaki yükünü ve ödev uyumunu tek bakışta görürsün.',
      nasil:'Uyum, "Yapıldı" işaretli ödevlerin payıdır; kısmen yapılan yarım sayılır. Hedef süreye rutinler ve devreden ödevler de girer.' },
    { h2:/^Devreden ödevler/, bas:'Devreden ödevler',
      ne:'Geçmiş haftalarda verilip henüz "Yapıldı" işaretlenmemiş konu ödevleri.',
      ise:'Biriken işi görür, yeni ödev vermeden önce bunları kapattırırsın.',
      nasil:'"Kaç hafta" sütunu ödevin yaşını yazar, 3 haftada kırmızı olur. Durum düğmesiyle işaretlersin; "sil" onay sorduktan sonra ödevi tamamen kaldırır.' },
    { h2:/^Bu haftanın ödevleri/, bas:'Bu haftanın ödevleri',
      ne:'Bu hafta verilen konu ödevleri ve rutinler; öğrencinin çözdüğü soru, doğru-yanlış ve net bilgisiyle.',
      ise:'Öğrencinin işaretlediklerini kontrol eder, gerekirse durumu sen değiştirirsin.',
      nasil:'Durum düğmesi her tıklayışta Bekliyor, Yapıldı, Kısmen ve Yapılmadı arasında döner. Çarpı ödevi bu haftadan çıkarır. Öğrencinin yeni girdiklerini görmek için sayfayı yenile.' },
    { h2:/^Haftalık çalışma programı/, bas:'Haftalık çalışma programı',
      ne:'Bu haftanın ödevlerinin 15 dakikalık dilimlerle günlere yerleştirildiği takvim.',
      ise:'Öğrencinin hangi gün ne çalışacağını belirler; öğrenci aynı takvimi kendi panelinde görür.',
      nasil:'Blokları sürükleyip taşı, taşınan blok kilitlenir. "Yeniden dağıt" kilitlileri yerinde bırakıp gerisini baştan yerleştirir. Gri hücreler kapalı saatlerdir.' },

    // ---- Ödevler ----
    { h2:/^Tavsiye edilen haftalık ödev/, bas:'Tavsiye edilen haftalık ödev',
      ne:'Kalan konuları sınava kadar bitirecek tempoya göre panelin kurduğu haftalık plan.',
      ise:'Bu hafta hangi konuların verilmesi gerektiğini hesaplamakla uğraşmazsın.',
      nasil:'"Bu haftanın ödevlerini ver" planı ödev yapar ve eksik rutini ekler. "çıkar" bir konuyu plandan atar. Beyan tempodan düşükse kırmızı uyarı çıkar.' },
    { h2:/^Hızlı ödev ata/, bas:'Hızlı ödev ata',
      ne:'Her dersin bitmemiş ve henüz ödev verilmemiş ilk konusu.',
      ise:'Sıradaki konuyu tek tıkla ödev olarak verirsin.',
      nasil:'Satırdaki "ödev ver" konuyu bugünün tarihiyle ekler. "Hedefe göre öncelik" seçilirse konular hedef netine katkıya göre dizilir.' },
    { h2:/^Ödev ver/, bas:'Ödev ver',
      ne:'Belirli bir konuyu elle ödev verdiğin form.',
      ise:'Dersi, üniteyi ve konuyu kendin seçip soru hedefi ve not eklersin.',
      nasil:'Ders, ünite ve konu seç; soru hedefi boşsa Konular sekmesindeki sayı kullanılır. Düğmenin yanındaki satır haftanın toplam yükünü yazar, beyanı aşınca kırmızı olur.' },
    { h2:/^Rutin tanımı/, bas:'Rutin tanımı',
      ne:'Konudan bağımsız, her hafta tekrarlanan işler; örneğin paragraf ve problem soruları.',
      ise:'Bütün öğrencilerinin haftalık rutinini tek yerden belirlersin.',
      nasil:'Rutin kendiliğinden eklenmez; "Bu haftanın ödevlerini ver" düğmesiyle haftaya girer. Sonraki haftaya devretmez.' },
    { h2:/^Konu bazında ödev dökümü/, bas:'Konu bazında ödev dökümü',
      ne:'Her konunun kaç kez ödev verildiği ve o konudaki uyum.',
      ise:'Aynı konuyu tekrar tekrar verip vermediğini ve hangi konuda takıldığını görürsün.',
      nasil:'Uyumu düşük kalan konu, ödevi yeniden vermeden önce öğrenciyle konuşulmalı.' },
    { h2:/^Hafta \d/, bas:'Haftalık ödev tablosu',
      ne:'O haftanın ödevleri ve haftanın uyum yüzdesi.',
      ise:'Öğrencinin haftalar boyunca düzenini karşılaştırırsın.',
      nasil:'En yeni hafta en üstte. Uyum yapılanı tam, kısmen yapılanı yarım sayar; bekleyen ödevler de hesaba girdiği için hafta bitmeden düşük görünür.' }
  ];

  var OGR = [
    { h2:/^Geçen haftalardan kalanlar/, bas:'Geçen haftalardan kalanlar',
      ne:'Önceki haftalarda verilip "Yaptım" işaretlemediğin ödevler.',
      ise:'Biriken işlerin unutulmaz.',
      nasil:'Ödevi bitirince "Yaptım" de. İşaretleyene kadar her hafta burada kalır.' },
    { h2:/^Bu haftanın konu ödevleri/, bas:'Bu haftanın konu ödevleri',
      ne:'Öğretmeninin bu hafta verdiği konu ödevleri.',
      ise:'Hangi konuyu çalışacağını ve kaç soru çözeceğini gösterir.',
      nasil:'Her ödev için "Yaptım", "Yarım" ya da "Yapamadım" seç; soru hedefi varsa doğru, yanlış ve boş sayını da gir. Öğretmenin panelini yenileyince görür.' },
    { h2:/^Sabit rutin/, bas:'Sabit rutin',
      ne:'Her hafta tekrarlanan işler; örneğin paragraf ve problem soruları.',
      ise:'Düzenli pratik yapmanı sağlar.',
      nasil:'Hafta içinde çözdüğün soru sayısını gir; çubuk hedefe ne kadar yaklaştığını gösterir.' },
    { h2:/^Kendi çalışmam/, bas:'Kendi çalışmam',
      ne:'Öğretmeninin vermediği ama kendi başına çalıştığın konular.',
      ise:'Kendi çalışman da kayda geçer, öğretmenin de görür.',
      nasil:'Dersi, üniteyi ve konuyu seçip ekle; eklediğin çalışma yapılmış sayılır.' },
    { h2:/^Kendime rutin ekle/, bas:'Kendime rutin ekle',
      ne:'Her hafta tekrar eden, konuya bağlı olmayan kendi işlerin; örneğin paragraf ya da kelime çalışması.',
      ise:'Düzenli çalışmanı haftalık planına bağlarsın.',
      nasil:'Dersi ve rutinin adını yazıp ekle. Rutin, Sabit rutin kartına ve Programım takvimine kendiliğinden düşer.' },
    { h2:/^Kendine ödev ver/, bas:'Kendine ödev ver',
      ne:'Öğretmenin yoksa hedefine göre sıradaki konular.',
      ise:'Planını kendin kurarsın.',
      nasil:'Soru sayısını yaz ya da boş bırak, sonra listeden konuyu ödev olarak ekle.' },
    { h2:/^Tamamladıkların/, bas:'Tamamladıkların',
      ne:'Bitirip listeden çıkardığın ödevler.',
      ise:'Kaydın durur; öğretmenin hepsini görür.',
      nasil:'"Listeyi göster" ile açılır. Yanlışlıkla bitirdiysen "geri al" ile listeye döndür.' }
  ];

  var LISTE = (window.ACIKLAMA_PANEL === 'ogrenci') ? OGR : KOC;
  var KAPALI = false;
  try { KAPALI = localStorage.getItem('acRayKapali') === '1'; } catch (e) {}

  var css = document.createElement('style');
  css.textContent =
    '.ac-ray{width:300px;flex:none;background:var(--rail);color:#DCE6EA;position:relative;border-left:1px solid rgba(255,255,255,.08)}' +
    '.ac-ray.kapali{width:40px;cursor:pointer}' +
    '.ac-ust{padding:18px 16px 12px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:space-between;gap:8px}' +
    '.ac-ust b{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7FA8A5;font-weight:600}' +
    '.ac-ust button{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);color:#DCE6EA;padding:4px 9px;border-radius:5px;font-size:11.5px}' +
    '.ac-ust button:hover{background:rgba(255,255,255,.17)}' +
    '.ac-dikey{writing-mode:vertical-rl;transform:rotate(180deg);margin:18px auto;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#7FA8A5}' +
    '.ac-liste{position:relative}' +
    '.ac-not{position:absolute;left:14px;right:14px;background:rgba(255,255,255,.055);border-left:3px solid #4FB3A9;border-radius:0 6px 6px 0;padding:10px 12px 11px;font-size:12px;line-height:1.42}' +
    '.ac-not::before{content:"";position:absolute;left:-17px;top:13px;width:14px;height:2px;background:#4FB3A9}' +
    '.ac-not h4{margin:0 0 7px;font-size:13px;color:#fff;font-weight:650}' +
    '.ac-not .e{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#7FA8A5;margin-right:5px}' +
    '.ac-not p{margin:5px 0 0;color:#C6D5DB}' +
    '.ac-bos{padding:14px 16px;font-size:12px;color:#88A3AE}' +
    '@media(max-width:1180px){.ac-ray{display:none}}' +
    '@media print{.ac-ray{display:none}}';
  document.head.appendChild(css);

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function sekme(){ try { return (typeof TAB !== 'undefined') ? TAB : ''; } catch (e) { return ''; } }

  function bul(kart){
    var h = kart.querySelector('h2'), bas = '';
    if (h) bas = ((h.firstChild && h.firstChild.nodeType === 3) ? h.firstChild.textContent : h.textContent).trim();
    var t = sekme();
    for (var i = 0; i < LISTE.length; i++) {
      var e = LISTE[i];
      if (e.tab && e.tab !== t) continue;
      if (e.h2 && !e.h2.test(bas)) continue;
      if (e.sec && !kart.querySelector(e.sec)) continue;
      return e;
    }
    return null;
  }

  function ray(){
    var r = document.getElementById('acRay');
    if (r) return r;
    var app = document.querySelector('.app');
    if (!app) return null;
    r = document.createElement('aside');
    r.id = 'acRay'; r.className = 'ac-ray';
    r.setAttribute('aria-label', 'Kutuların açıklamaları');
    app.appendChild(r);
    return r;
  }

  function yerlestir(){
    var r = ray(); if (!r) return;
    var view = document.getElementById('view');
    var kartlar = view ? view.querySelectorAll('.card') : [];
    // Giriş ve kayıt ekranında sütun görünmez (şifre kutusu olan ekran).
    var giris = !!(view && view.querySelector('input[type=password]'));
    r.style.display = giris ? 'none' : '';
    if (giris) return;
    // Renk sol menüden okunur: koçta .rail, öğrencide .snav; temalar değişse de iki sütun aynı kalır.
    var sol = document.querySelector('.app > aside:not(.ac-ray)');
    if (sol) r.style.background = getComputedStyle(sol).backgroundColor;
    // Genişlik de sol menüyle aynı (koçta 246 px, dar ekranda 200 px); kapalıyken ince şerit.
    r.style.width = (KAPALI || !sol || !sol.offsetWidth) ? '' : sol.offsetWidth + 'px';
    r.classList.toggle('kapali', KAPALI);
    if (KAPALI) {
      r.innerHTML = '<div class="ac-dikey">Açıklamaları göster</div>';
      r.onclick = function(){ ac(false); };
      return;
    }
    r.onclick = null;
    r.innerHTML = '<div class="ac-ust"><b>Bu sayfada</b><button type="button">Gizle</button></div><div class="ac-liste"></div>';
    r.querySelector('.ac-ust button').onclick = function(ev){ ev.stopPropagation(); ac(true); };
    var liste = r.querySelector('.ac-liste'), ust = liste.getBoundingClientRect().top, adet = 0, kullanildi = [];
    NOTLAR = [];
    for (var i = 0; i < kartlar.length; i++) {
      var k = kartlar[i];
      if (!k.offsetParent) continue;                 // görünmeyen kart
      var e = bul(k); if (!e || kullanildi.indexOf(e) >= 0) continue;   // aynı tür kart (ör. haftalık tablolar) bir kez
      kullanildi.push(e);
      var d = document.createElement('div');
      d.className = 'ac-not';
      d.innerHTML = '<h4>' + esc(e.bas) + '</h4>' +
        '<p><span class="e">Ne</span>' + esc(e.ne) + '</p>' +
        '<p><span class="e">İşe yarar</span>' + esc(e.ise) + '</p>' +
        '<p><span class="e">Kullanım</span>' + esc(e.nasil) + '</p>';
      liste.appendChild(d);
      var kr = k.getBoundingClientRect();
      NOTLAR.push({ d: d, ust: Math.round(kr.top - ust), alt: Math.round(kr.bottom - ust), h: d.offsetHeight });
      adet++;
    }
    if (!adet && kartlar.length) { liste.innerHTML = '<div class="ac-bos">Bu sekmenin açıklamaları yakında eklenecek.</div>'; return; }
    konumla();
  }

  /* Not kartının hizasında başlar; uzun kart kaydırılırken ekranda kalır, kartın sonunu geçmez.
     Notlar üst üste binmez: her biri bir öncekinin altından başlar. */
  var NOTLAR = [];
  function konumla(){
    var r = document.getElementById('acRay'); if (!r || KAPALI) return;
    var liste = r.querySelector('.ac-liste'); if (!liste) return;
    var ekranUst = -liste.getBoundingClientRect().top + 12, son = 0;
    for (var i = 0; i < NOTLAR.length; i++) {
      var n = NOTLAR[i];
      var top = Math.min(Math.max(n.ust, ekranUst), Math.max(n.ust, n.alt - n.h));
      top = Math.max(top, son);
      n.d.style.top = top + 'px';
      son = top + n.h + 12;
    }
    liste.style.height = son + 'px';
  }
  var kaydirma = 0;
  window.addEventListener('scroll', function(){
    if (kaydirma) return;
    kaydirma = setTimeout(function(){ kaydirma = 0; konumla(); }, 16);
  }, { passive: true });

  function ac(kapat){
    KAPALI = kapat;
    try { localStorage.setItem('acRayKapali', kapat ? '1' : '0'); } catch (e) {}
    yerlestir();
  }

  var bekleyen = 0;
  // setTimeout: requestAnimationFrame arka plandaki sekmede hiç çalışmıyor.
  function sonra(){ if (bekleyen) return; bekleyen = setTimeout(function(){ bekleyen = 0; yerlestir(); }, 30); }

  function bagla(){
    if (typeof window.render === 'function' && !window.render.__ac) {
      var asil = window.render;
      window.render = function(){ var s = asil.apply(this, arguments); sonra(); return s; };
      window.render.__ac = true;
    }
    window.addEventListener('resize', sonra);
    var view = document.getElementById('view');
    if (view && window.ResizeObserver) new ResizeObserver(sonra).observe(view);
    sonra();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bagla); else bagla();
})();
