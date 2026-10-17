/* ═══════════════════════════════════════════════════════════════════
   karne-pdf.js — KARNE PDF'İ YÜKLE, SAYFAYI SEÇ, OKU (koç + öğrenci ORTAK)

   Yayıncı sınıfın bütün karnelerini tek PDF'te veriyor. Kullanıcı PDF'i
   açıp her şeyi kopyalamak yerine dosyayı seçer; istenen sayfanın metni
   kutuya yazılır ve panelin kendi okuyucusu (applyKarne / karneOku)
   çalışır. Metin TARAYICIDA çıkarılır, dosya hiçbir yere gönderilmez.

   pdf.js yalnız dosya seçilince cdnjs'ten yüklenir, iki dosya da bütünlük
   (SRI, sha512) denetiminden geçer. isEvalSupported:false — 3.11 sürümü
   kötü niyetli yazı tipiyle kod çalıştırmaya açık (CVE-2024-4367); bu
   ayar o yolu kapatır.

   Okuyucular kopyala-yapıştır metninin SATIR düzenini bekliyor. pdf.js
   ise metni parça parça verir, bir kelimeyi birkaç parçaya bölebilir
   ("Mat" + "ematik"). Parçalar y'ye göre satırlara toplanır, satırlar
   yukarıdan aşağı, parçalar soldan sağa dizilir; aralığı dar olan
   parçalar boşluksuz, geniş olanlar tek boşlukla birleşir.

   Panelin norm() ve esc() işlevlerini kullanır; ikisi de iki panelde aynı.
   ═══════════════════════════════════════════════════════════════════ */
window.karnePdf = (function(){
  'use strict';

  var KOK = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var LIB_SRI = 'sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ==';
  var ISCI_SRI = 'sha512-BbrZ76UNZq5BhH7LL7pn9A4TKQpQeNCHOo65/akfelcIBbcVvYWOFQKPXIrykE3qZxYjmDX573oa4Ywsc7rpTw==';

  /* Yazı yüksekliği cinsinden. 16 gerçek sınıf PDF'inde (6 farklı üretici)
     ölçüldü: satır payı 0,4-0,65 ve aralık 0,05-0,35 arasında okunan
     netler hiç değişmiyor; seçilen değerler bu düzlüğün ortasında. */
  var SATIR_TOL = 0.5;      // taban çizgileri bu kadar yakınsa aynı satır
  var BOSLUK = 0.15;        // parçalar arası aralık (ya da binme) bundan büyükse boşluk

  var yukleme = null;
  function pdfjsYukle(){
    if(!yukleme){
      yukleme = new Promise(function(ok, hata){
        if(window.pdfjsLib) return ok(window.pdfjsLib);
        var s = document.createElement('script');
        s.src = KOK + 'pdf.min.js';
        s.integrity = LIB_SRI;
        s.crossOrigin = 'anonymous';
        s.onload = function(){ window.pdfjsLib ? ok(window.pdfjsLib) : hata(new Error('pdfjsLib yok')); };
        s.onerror = function(){ hata(new Error('pdf.js yüklenemedi')); };
        document.head.appendChild(s);
      }).then(function(lib){
        /* İşçi dosyasını pdf.js başka kökenden importScripts ile alır; orada
           bütünlük denetimi yapılamaz. fetch'in integrity seçeneği doğrular,
           doğrulanan içerik aynı kökenden blob adresiyle verilir. */
        return fetch(KOK + 'pdf.worker.min.js', {integrity: ISCI_SRI, credentials: 'omit'})
          .then(function(r){ if(!r.ok) throw new Error('işçi ' + r.status); return r.blob(); })
          .then(function(b){ lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(b); return lib; });
      });
      yukleme.catch(function(){ yukleme = null; });   // bağlantı dönünce yeniden denenebilsin
    }
    return yukleme;
  }

  /* Bir sayfanın metin parçalarını kopyala-yapıştır satırlarına çevirir. */
  function satirlar(ogeler){
    var p = [];
    ogeler.forEach(function(o){
      if(!o.str || !o.str.trim()) return;      // boşluk parçası: aralık konumdan ölçülür
      var t = o.transform, h = Math.hypot(t[2], t[3]) || o.height || 1;
      p.push({s: o.str, x: t[4], y: t[5], w: o.width, h: h});
    });
    p.sort(function(a, b){ return b.y - a.y || a.x - b.x; });
    var sat = [];
    p.forEach(function(o){
      var s = sat[sat.length - 1];
      if(s && s.y - o.y <= SATIR_TOL * Math.min(s.h, o.h)) s.o.push(o);
      else sat.push({y: o.y, h: o.h, o: [o]});
    });
    return sat.map(function(s){
      s.o.sort(function(a, b){ return a.x - b.x; });
      var m = '', on = null;
      s.o.forEach(function(o){
        /* Üst üste binme de ayrı hücredir: uzun konu adı yandaki sayının
           altına taşar ("analiz eder." + "1"); yapışmasın. */
        if(on && Math.abs(o.x - (on.x + on.w)) > BOSLUK * Math.min(on.h, o.h)) m += ' ';
        m += o.s; on = o;
      });
      return m.replace(/\s+/g, ' ').trim();
    }).join('\n');
  }

  /* PDF verisi → sayfa metinleri (sıra korunur). */
  function sayfalar(veri){
    return pdfjsYukle().then(function(lib){ return metinler(lib, veri); });
  }
  function metinler(lib, veri){
    return lib.getDocument({data: veri, isEvalSupported: false}).promise.then(function(pdf){
      var is = [];
      for(var i = 1; i <= pdf.numPages; i++)
        is.push(pdf.getPage(i)
          .then(function(s){ return s.getTextContent(); })
          .then(function(tc){ return satirlar(tc.items); }));
      return Promise.all(is).then(function(m){ pdf.destroy(); return m; },
                                  function(e){ pdf.destroy(); throw e; });
    });
  }

  function uyari(m){
    return '<div class="flag warn" style="margin:10px 0 0"><span class="ic">!</span><span>' + m + '</span></div>';
  }
  var BOS_SAYFA = 'Bu sayfada okunabilir metin yok; PDF taranmış bir görüntü olabilir. Netleri elle gir.';

  /* Seçilen sayfanın metnini kutuya yazar, panelin okuyucusunu çalıştırır.
     true: metin TEK bir PDF sayfası; okuyucu öğrenci sayacına bakmaz
     (sayaç bazı karnelerde tek sayfayı iki öğrenci sayıyor). */
  function oku(metin, o, durum){
    if(!metin.trim()){ durum.innerHTML = uyari(BOS_SAYFA); return; }
    durum.innerHTML = '';
    var t = document.getElementById(o.metinId);
    if(t) t.value = metin;
    o.oku(true);
  }

  /* Çok sayfalı PDF: sayfa sorulur; ad tek sayfada geçiyorsa o sayfa önerilir. */
  function secici(kutu, m, o){
    var ara = norm(o.ad || '');
    var bulunan = [];
    if(ara) m.forEach(function(t, i){ if(norm(t).indexOf(ara) >= 0) bulunan.push(i + 1); });
    var ogr = !!o.ogrenci;
    var soru = ogr ? 'Karnen kaçıncı sayfada?' : 'Öğrencinin karnesi kaçıncı sayfada?';
    var adDurum = bulunan.length === 1
      ? (ogr ? 'Adın ' : 'Adı ') + bulunan[0] + '. sayfada geçiyor.'
      : bulunan.length > 1
        ? (ogr ? 'Adın' : 'Ad') + ' birden çok sayfada geçiyor; doğru sayfayı sen seç.'
        : (ogr ? 'Adın' : 'Ad') + ' hiçbir sayfada bulunamadı; sayfa numarasını sen yaz.';
    var id = o.kutuId + 'No';
    kutu.innerHTML =
      '<form novalidate style="margin-top:10px">' +
        '<label for="' + id + '" style="display:block;margin-bottom:6px">Bu PDF\'te <b>' + esc(m.length) +
          ' sayfa</b> var. ' + soru + '</label>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<input type="number" id="' + id + '" min="1" max="' + esc(m.length) + '" step="1" style="width:90px"' +
            (bulunan.length === 1 ? ' value="' + esc(bulunan[0]) + '"' : '') + '>' +
          '<button type="submit" class="btn mini">Bu sayfayı oku</button>' +
        '</div>' +
        '<div class="hint">' + esc(adDurum) + '</div>' +
        '<div aria-live="polite"></div>' +
      '</form>';
    var form = kutu.querySelector('form'), durum = form.lastChild;
    form.querySelector('input').focus();       // sıradaki adım; ekran okuyucu soruyu okur
    form.onsubmit = function(e){
      e.preventDefault();
      var v = form.querySelector('input').value.trim(), n = Number(v);
      if(!/^\d+$/.test(v) || n < 1 || n > m.length){
        durum.innerHTML = uyari('Sayfa numarası 1 ile ' + esc(m.length) + ' arasında olmalı.');
        return;
      }
      oku(m[n - 1], o, durum);
    };
  }

  /* Dosya seçilince çağrılır:
     karnePdf.sec(input, {metinId, kutuId, ad, oku, ogrenci})
       metinId: karne metninin yazılacağı textarea
       kutuId : seçici ve iletilerin çizileceği kutu
       ad     : sayfası aranacak öğrencinin adı
       oku    : panelin okuyucusu (applyKarne / karneOku)
       ogrenci: true ise iletiler öğrenciye ("Karnen kaçıncı sayfada?") */
  var sira = 0;
  function sec(girdi, o){
    var dosya = girdi.files && girdi.files[0];
    girdi.value = '';                          // aynı dosya yeniden seçilebilsin
    var kutu = document.getElementById(o.kutuId);
    if(!dosya || !kutu) return;
    var no = ++sira;                           // okunurken yeni dosya seçilirse eskisi yazılmasın
    kutu.innerHTML = '<div class="hint" aria-live="polite">PDF okunuyor…</div>';
    var asama = 'yukle';
    pdfjsYukle()
      .then(function(lib){ asama = 'dosya'; return dosya.arrayBuffer().then(function(b){ return metinler(lib, b); }); })
      .then(function(m){
        if(no !== sira) return;
        if(m.length === 1){ kutu.innerHTML = '<div></div>'; oku(m[0], o, kutu.firstChild); }
        else secici(kutu, m, o);
      }, function(){
        if(no !== sira) return;
        kutu.innerHTML = uyari(asama === 'yukle'
          ? 'PDF okuyucu yüklenemedi. İnternet bağlantını kontrol edip yeniden dene ya da karne metnini kopyalayıp yapıştır.'
          : 'PDF açılamadı. Dosya bozuk ya da şifreli olabilir; karne metnini kopyalayıp yapıştırmayı dene.');
      });
  }

  return {sec: sec, sayfalar: sayfalar};
})();
