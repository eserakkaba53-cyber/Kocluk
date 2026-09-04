/* ═══════════════════════════════════════════════════════════════════
   deneme.js — DENEME KONU ANALİZİ (koç + öğrenci ORTAK)

   Neden ayrı dosya: koç ve öğrenci panelleri aynı mantığın iki ayrı
   kopyasını taşıyor ve zamanla ayrışıyorlar (parseKarne iki yerde ayrı
   yazılmış, öğrencininki konu analizi yapmıyor). Bu modül ortak parçayı
   tek yerde tutar; program.js ile aynı yaklaşım.

   Panel değişkenlerine BAĞIMLI DEĞİLDİR — ihtiyacı olan her şey
   parametreyle gelir. Böylece iki panelde de aynı şekilde çalışır.
   ═══════════════════════════════════════════════════════════════════ */
window.SINAVANALIZ = (function(){
  'use strict';

  /* Doğru oranı bu eşiğin ALTINDA olan konu "zayıf" sayılır.
     Eskiden ölçüt "en az 2 denemede çıktı" idi; bu, çok soru çıkan ama
     iyi yapılan konuları da listeye sokuyordu. Asıl mesele konunun kaç
     kez çıktığı değil, ne kadarının DOĞRU yapıldığı. */
  var ZAYIF_ESIK = 0.5;

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
  }

  /* ── TOPLAMA ─────────────────────────────────────────────────────
     exams: [{id, an:[{sub,konu,unite,tip:'y'|'b',adet,ss}]}]

     ss = o konudan denemede çıkan TOPLAM soru. Aynı konunun 'y' ve 'b'
     satırları AYNI ss'i taşır; toplarken çift saymamak için deneme
     içinde konu bazında BİR KEZ alınır.

     Eski kayıtlarda ss yoktur (o zaman kaydedilmiyordu) — onların oranı
     hesaplanamaz, oran:null döner ve çağıran taraf ayrı gösterir. */
  function tekrarEden(exams){
    var agg = {};
    (exams||[]).forEach(function(e){
      if(!e || !e.an || !e.an.length) return;
      var konuBazli = {};
      e.an.forEach(function(a){
        if(!a || !a.konu) return;
        var k = a.sub + '||' + a.konu;
        var t = konuBazli[k];
        if(!t) t = konuBazli[k] = {sub:a.sub, unite:a.unite||'', konu:a.konu, ss:0, y:0, b:0};
        if(a.tip === 'y')      t.y += (+a.adet || 0);
        else if(a.tip === 'b') t.b += (+a.adet || 0);
        var ss = +a.ss || 0;
        if(ss > t.ss) t.ss = ss;          // çift saymayı önler
        if(!t.unite && a.unite) t.unite = a.unite;
      });
      Object.keys(konuBazli).forEach(function(k){
        var t = konuBazli[k], x = agg[k];
        if(!x) x = agg[k] = {sub:t.sub, unite:t.unite, konu:t.konu,
                             ss:0, y:0, b:0, denler:{}, kac:0};
        x.ss += t.ss; x.y += t.y; x.b += t.b;
        var did = e.id || ('_'+x.kac);
        if(!x.denler[did]){ x.denler[did] = 1; x.kac++; }
        if(!x.unite && t.unite) x.unite = t.unite;
      });
    });

    return Object.keys(agg).map(function(k){
      var r = agg[k];
      /* Doğru = toplam soru − yanlış − boş. Karne bazen tutarsız gelir,
         negatife düşmesin diye 0'a kırpılır. */
      var dogru = r.ss ? Math.max(0, r.ss - r.y - r.b) : null;
      var oran  = r.ss ? dogru / r.ss : null;
      return { sub:r.sub, unite:r.unite, konu:r.konu,
               soru:r.ss, dogru:dogru, y:r.y, b:r.b,
               oran:oran, kac:r.kac };
    });
  }

  /* Zayıf konular: oranı bilinen ve eşiğin altında olanlar.
     En kötüden iyiye, eşitlikte çok soru çıkan öne. */
  function zayiflar(satirlar){
    return satirlar
      .filter(function(r){ return r.oran !== null && r.oran < ZAYIF_ESIK; })
      .sort(function(a,b){ return (a.oran - b.oran) || (b.soru - a.soru); });
  }

  /* Oranı hesaplanamayanlar (eski kayıtlar). Bilgi amaçlı ayrı gösterilir;
     "zayıf" olduklarını İDDİA ETMEYİZ — soru sayıları bilinmiyor. */
  function oransizlar(satirlar){
    return satirlar
      .filter(function(r){ return r.oran === null && (r.y + r.b) > 0; })
      .sort(function(a,b){ return (b.y + b.b) - (a.y + a.b); });
  }

  /* ── KART ────────────────────────────────────────────────────────
     opts: { dersAdi(sub)->metin, durumOf(sub,konu)->0..3, ipucu:metin }  */
  function zayifKart(exams, opts){
    opts = opts || {};
    var hepsi = tekrarEden(exams);
    var z = zayiflar(hepsi);
    var yok = oransizlar(hepsi);
    if(!z.length && !yok.length) return '';

    var ad  = opts.dersAdi  || function(s){ return s; };
    var dur = opts.durumOf  || function(){ return 0; };
    var ETIKET = ['Görülmedi','İşleniyor','Bitti','Eksik'];
    var yuzde = function(o){ return Math.round(o*100) + '%'; };

    var satir = function(r){
      var d = dur(r.sub, r.konu) || 0;
      /* Oran ne kadar düşükse o kadar kırmızı: %25 altı acil. */
      var renk = r.oran < 0.25 ? 'var(--bad)' : 'var(--warn-ink,var(--warn))';
      return '<tr>' +
        '<td>' + esc(ad(r.sub)) + '</td>' +
        '<td style="color:var(--ink-3);font-size:12px">' + esc(r.unite) + '</td>' +
        '<td><b>' + esc(r.konu) + '</b></td>' +
        '<td class="num" style="font-weight:650">' + r.soru + '</td>' +
        '<td class="num" style="color:var(--ok)">' + (r.dogru || '·') + '</td>' +
        '<td class="num" style="color:var(--bad)">' + (r.y || '·') + '</td>' +
        '<td class="num" style="color:var(--warn)">' + (r.b || '·') + '</td>' +
        '<td class="num" style="font-weight:700;color:' + renk + '">' + yuzde(r.oran) + '</td>' +
        '<td class="num" style="color:var(--ink-3)">' + r.kac + '</td>' +
        '<td><span class="pill s' + (d===2?1:d===3?3:d===1?2:0) + '">' + ETIKET[d] + '</span></td>' +
      '</tr>';
    };

    var h = '<div class="card"><h2>Zayıf konular — doğru oranı %50\'nin altında (' + z.length + ')' +
      '<small>Konunun kaç denemede çıktığı değil, ne kadarının doğru yapıldığı ölçülür.</small></h2>';

    if(z.length){
      h += '<div class="body" style="padding:0;max-height:440px;overflow:auto">' +
        '<table><thead><tr>' +
          '<th>Ders</th><th>Ünite</th><th>Konu</th>' +
          '<th class="num">Soru</th><th class="num">Doğru</th>' +
          '<th class="num">Yanlış</th><th class="num">Boş</th>' +
          '<th class="num">Doğru oranı</th><th class="num">Deneme</th>' +
          '<th>Konu durumu</th>' +
        '</tr></thead><tbody>' + z.map(satir).join('') + '</tbody></table></div>';
    } else {
      h += '<div class="body"><div class="empty">%50 altında konu yok — bu iyi haber.</div></div>';
    }

    if(yok.length){
      h += '<div class="body" style="border-top:1px solid var(--line-soft)">' +
        '<div class="hint"><b>' + yok.length + ' konu bu listede yok</b> çünkü o denemelerde ' +
        'konunun kaç soru getirdiği kaydedilmemiş — oran hesaplanamıyor. ' +
        'Bunlar soru sayısı kaydedilmeden önce girilmiş eski denemeler: ' +
        esc(yok.slice(0,6).map(function(r){ return r.konu; }).join(' · ')) +
        (yok.length > 6 ? ' …' : '') + '</div></div>';
    }

    h += '<div class="body" style="border-top:1px solid var(--line-soft)"><div class="hint">' +
      (opts.ipucu || '<b>"Bitti" işaretli ama doğru oranı düşük konu, bitmemiştir.</b> ' +
       'Konular sekmesinden <b>Eksik</b>\'e çek — ödev listesine geri döner.') +
      '</div></div></div>';
    return h;
  }

  return { tekrarEden:tekrarEden, zayiflar:zayiflar, oransizlar:oransizlar,
           zayifKart:zayifKart, ESIK:ZAYIF_ESIK };
})();
