/* ═══════════════════════════════════════════════════════════════════
   mesaj.js — YÖNETİCİ MESAJLAŞMA (koç + öğrenci + yönetim ORTAK)

   Koçlar ve öğrenciler panellerinden yöneticiye yazar; yönetici Yönetim
   sekmesinden cevaplar. Aynı kutu iki panelde de kullanıldığı için tek
   dosyada durur (program.js / deneme.js ile aynı yaklaşım).

   Panel değişkenlerine bağımlı DEĞİLDİR. Kurulumda iki şey ister:
     cagir(rpcAdi, govde) -> Promise   : sunucu çağrısı
     ciz()                             : paneli yeniden çizdir
   ═══════════════════════════════════════════════════════════════════ */
window.MESAJ = (function(){
  'use strict';

  var C = null;
  var D = {
    sayac: 0,                 // rozet: okunmamış sayısı
    benim: null,              // kullanıcının kendi konuşması (dizi)
    konusmalar: null,         // yönetici: konuşma listesi
    acik: null,               // yönetici: açık konuşmanın kullanıcı kimliği
    acikVeri: null,           // yönetici: açık konuşmanın içeriği
    yukleniyor: false,
    hata: ''
  };

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
  }
  function zaman(t){
    if(!t) return '';
    try{
      var d=new Date(t), n=new Date();
      var ayni = d.toDateString()===n.toDateString();
      var ss = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
      return ayni ? ss : (String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+' '+ss);
    }catch(e){ return ''; }
  }
  function ciz(){ try{ if(C && C.ciz) C.ciz(); }catch(e){} }
  function cagir(ad, govde){
    if(!C || !C.cagir) return Promise.reject(new Error('Mesaj modülü kurulmadı.'));
    return C.cagir(ad, govde||{});
  }

  function kur(cfg){ C = cfg; }

  /* ── ROZET ────────────────────────────────────────────────────────
     Panel her açılışta bir kez çağırır. Sayı önbellekte tutulur ki
     her render'da sunucuya gidilmesin. */
  function sayac(){ return D.sayac|0; }
  function rozet(){
    var n = D.sayac|0;
    if(!n) return '';
    return '<span class="msj-rozet" title="'+n+' okunmamış mesaj">'+(n>99?'99+':n)+'</span>';
  }
  async function sayaciTazele(){
    try{ var n = await cagir('mesaj_sayaci'); D.sayac = (+n)||0; }
    catch(e){ D.sayac = 0; }
    ciz();
  }

  /* ── KULLANICI TARAFI ─────────────────────────────────────────── */
  async function benimYukle(){
    if(D.yukleniyor) return;
    D.yukleniyor = true; D.hata='';
    try{
      D.benim = await cagir('mesajlarim') || [];
      D.sayac = 0;                       // açınca yöneticinin cevapları okundu sayılır
    }catch(e){ D.hata = e.message||String(e); }
    D.yukleniyor = false; ciz();
  }
  async function gonder(){
    var el = document.getElementById('msjMetin');
    var m = (el ? el.value : '').trim();
    if(!m){ alert('Mesaj boş olamaz.'); return; }
    var btn = document.getElementById('msjGonder');
    if(btn){ btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }
    try{
      var r = await cagir('mesaj_gonder', {p_metin: m});
      if(!r || !r.ok) throw new Error((r && r.hata) || 'Gönderilemedi.');
      if(el) el.value='';
      D.benim = await cagir('mesajlarim') || [];
      D.hata='';
    }catch(e){ D.hata = e.message||String(e); }
    ciz();
  }

  /* ═══════════════════════════════════════════════════════════════
     ✓ / ✓✓ İŞARETİ                                    5 Eyl 2026
     Yalnız KENDİ gönderdiğin mesajda çıkar — karşı tarafınkinde
     anlamsız olurdu.
        ✓   iletildi : sunucuya yazıldı
        ✓✓  okundu   : karşı taraf konuşmayı açtı

     "Cihaza ulaştı" diye bir ara kademe YOK ve uydurulmuyor: panel bir
     web sayfası, arka planda çalışan bir uygulama değil; mesaj sunucuya
     yazıldığı an iletilmiş sayılır.

     okundu alanı TANIMSIZSA hiçbir şey çizilmez. Sebep: sunucudaki
     MESAJ-okundu-isareti.sql henüz çalıştırılmamış olabilir; o durumda
     her mesajı "okunmadı" göstermek yanlış bilgi vermek olurdu. */
  function tik(m, ben){
    if(!ben || !m || m.okundu === undefined || m.okundu === null) return '';
    return m.okundu
      ? ' <span class="msj-tik okundu" title="Okundu">✓✓</span>'
      : ' <span class="msj-tik" title="İletildi — henüz okunmadı">✓</span>';
  }

  function kartKullanici(){
    if(D.benim === null && !D.yukleniyor){ setTimeout(benimYukle, 10); }
    var liste;
    if(D.benim === null){
      liste = '<div class="empty">Yükleniyor…</div>';
    }else if(!D.benim.length){
      liste = '<div class="empty">Henüz mesaj yok. Aşağıdan yazabilirsin.</div>';
    }else{
      liste = '<div class="msj-akis">' + D.benim.map(function(m){
        var ben = (m.kimden === 'kullanici');
        return '<div class="msj '+(ben?'ben':'kars')+'">'+
                 '<div class="msj-ust">'+(ben?'Sen':'Yönetim')+' · '+esc(zaman(m.eklendi))+tik(m,ben)+'</div>'+
                 '<div class="msj-govde">'+esc(m.metin).replace(/\n/g,'<br>')+'</div>'+
               '</div>';
      }).join('') + '</div>';
    }
    return '<div class="card"><h2>Yönetime mesaj'+
      '<small>Sorun, öneri ya da soru yaz — yönetim buradan cevaplar.</small></h2>'+
      '<div class="body">'+
        (D.hata ? '<div class="flag bad" style="margin-bottom:10px"><span class="ic">!</span><span>'+esc(D.hata)+'</span></div>' : '')+
        liste+
        '<textarea id="msjMetin" rows="3" maxlength="2000" placeholder="Mesajını yaz…" style="margin-top:12px;resize:vertical"></textarea>'+
        '<button class="btn" id="msjGonder" style="margin-top:8px" onclick="MESAJ.gonder()">Gönder</button>'+
        '<div class="hint" style="margin-top:8px">Cevap geldiğinde bu sekmenin yanında bildirim işareti çıkar.</div>'+
      '</div></div>';
  }

  /* ── YÖNETİCİ TARAFI ──────────────────────────────────────────── */
  async function konusmalariYukle(){
    if(D.yukleniyor) return;
    D.yukleniyor = true; D.hata='';
    try{ D.konusmalar = await cagir('mesaj_konusmalar') || []; }
    catch(e){ D.hata = e.message||String(e); D.konusmalar = []; }
    D.yukleniyor = false; ciz();
  }
  async function ac(uid){
    D.acik = uid; D.acikVeri = null; ciz();
    try{
      var r = await cagir('mesaj_konusma', {p_kullanici: uid});
      if(!r || !r.ok) throw new Error((r && r.hata) || 'Açılamadı.');
      D.acikVeri = r;
      await sayaciTazele();              // okundu işaretlendi, rozet düşsün
      D.konusmalar = await cagir('mesaj_konusmalar') || [];
    }catch(e){ D.hata = e.message||String(e); }
    ciz();
  }
  function kapat(){ D.acik=null; D.acikVeri=null; ciz(); }
  async function yanitla(){
    var el = document.getElementById('msjYanit');
    var m = (el ? el.value : '').trim();
    if(!m){ alert('Mesaj boş olamaz.'); return; }
    try{
      var r = await cagir('mesaj_yanitla', {p_kullanici: D.acik, p_metin: m});
      if(!r || !r.ok) throw new Error((r && r.hata) || 'Gönderilemedi.');
      if(el) el.value='';
      var k = await cagir('mesaj_konusma', {p_kullanici: D.acik});
      if(k && k.ok) D.acikVeri = k;
      D.konusmalar = await cagir('mesaj_konusmalar') || [];
      D.hata='';
    }catch(e){ D.hata = e.message||String(e); }
    ciz();
  }
  async function sil(uid, ad){
    /* Silme İKİ TARAFTAN birden kaldırır — satırlar fiziksel olarak
       gidiyor. Geri alınamaz, o yüzden açıkça uyarılır. */
    if(!confirm((ad?('"'+ad+'" ile olan '):'Bu ')+'konuşmanın TAMAMI silinecek.\n\n'+
                'Mesajlar hem senin hem karşı tarafın ekranından kalkar.\n'+
                'Bu işlem GERİ ALINAMAZ.\n\nDevam edilsin mi?')) return;
    try{
      var r = await cagir('mesaj_sil', {p_kullanici: uid});
      if(!r || !r.ok) throw new Error((r && r.hata) || 'Silinemedi.');
      if(D.acik === uid){ D.acik=null; D.acikVeri=null; }
      D.konusmalar = await cagir('mesaj_konusmalar') || [];
      await sayaciTazele();
      D.hata='';
    }catch(e){ D.hata = e.message||String(e); }
    ciz();
  }

  function kartYonetici(){
    if(D.konusmalar === null && !D.yukleniyor){ setTimeout(konusmalariYukle, 10); }
    var hata = D.hata ? '<div class="flag bad" style="margin-bottom:10px"><span class="ic">!</span><span>'+esc(D.hata)+'</span></div>' : '';

    /* Açık konuşma görünümü */
    if(D.acik){
      var v = D.acikVeri;
      var kisi = (v && v.kisi) || {};
      var govde = !v ? '<div class="empty">Yükleniyor…</div>'
        : '<div class="msj-akis">' + (v.mesajlar||[]).map(function(m){
            var ben = (m.kimden === 'yonetici');
            return '<div class="msj '+(ben?'ben':'kars')+'">'+
                     '<div class="msj-ust">'+(ben?'Sen (yönetim)':esc(kisi.ad||'Kullanıcı'))+' · '+esc(zaman(m.eklendi))+tik(m,ben)+'</div>'+
                     '<div class="msj-govde">'+esc(m.metin).replace(/\n/g,'<br>')+'</div>'+
                   '</div>';
          }).join('') + '</div>';
      return '<div class="card"><h2>'+esc(kisi.ad||'Konuşma')+
        '<small>'+esc(kisi.rol||'')+' · mesajlar okundu işaretlendi</small></h2><div class="body">'+
        hata + govde +
        '<textarea id="msjYanit" rows="3" maxlength="2000" placeholder="Cevabını yaz…" style="margin-top:12px;resize:vertical"></textarea>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+
          '<button class="btn" onclick="MESAJ.yanitla()">Cevap gönder</button>'+
          '<button class="btn ghost" onclick="MESAJ.kapat()">Listeye dön</button>'+
          '<button class="btn danger" style="margin-left:auto" onclick="MESAJ.sil(\''+esc(D.acik)+'\',\''+esc((kisi.ad||'').replace(/'/g,''))+'\')">Konuşmayı sil</button>'+
        '</div>'+
        '<div class="hint" style="margin-top:8px">Silersen mesajlar karşı tarafın ekranından da kalkar.</div>'+
      '</div></div>';
    }

    /* Liste görünümü */
    var L = D.konusmalar;
    var ic;
    if(L === null)      ic = '<div class="empty">Yükleniyor…</div>';
    else if(!L.length)  ic = '<div class="empty">Henüz mesaj yok.</div>';
    else ic = '<table><thead><tr><th>Kim</th><th>Rol</th><th>Son mesaj</th><th class="num">Zaman</th><th class="num">Okunmamış</th><th></th></tr></thead><tbody>'+
      L.map(function(k){
        var okunmamis = +k.okunmamis||0;
        return '<tr'+(okunmamis?' style="background:var(--warn-bg)"':'')+'>'+
          '<td><b>'+esc(k.ad)+'</b></td>'+
          '<td style="color:var(--ink-3);font-size:12px">'+esc(k.rol)+'</td>'+
          '<td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink-2)">'+esc(k.sonmetin||k.sonMetin||'')+'</td>'+
          '<td class="num" style="color:var(--ink-3);font-size:12px">'+esc(zaman(k.son))+'</td>'+
          '<td class="num">'+(okunmamis?'<span class="msj-rozet">'+okunmamis+'</span>':'·')+'</td>'+
          '<td><button class="btn '+(okunmamis?'':'ghost')+' mini" onclick="MESAJ.ac(\''+esc(k.kullanici)+'\')">aç</button> '+
              '<button class="btn danger mini" onclick="MESAJ.sil(\''+esc(k.kullanici)+'\',\''+esc(String(k.ad||'').replace(/'/g,''))+'\')">sil</button></td>'+
        '</tr>';
      }).join('') + '</tbody></table>';

    return '<div class="card"><h2>Gelen mesajlar'+rozet()+
      '<small>Koç ve öğrencilerden gelen mesajlar. Okunmamış olanlar işaretlidir.</small></h2>'+
      '<div class="body" style="padding:0;overflow:auto">'+ (hata?('<div style="padding:14px 16px 0">'+hata+'</div>'):'') + ic + '</div>'+
      '<div class="body" style="border-top:1px solid var(--line-soft)">'+
        '<button class="btn ghost mini" onclick="MESAJ.tazele()">Yenile</button>'+
      '</div></div>';
  }

  async function tazele(){
    D.konusmalar = null; D.benim = null;
    await sayaciTazele();
    ciz();
  }

  /* Rozet ve akış için gereken stil — panellerin CSS'ine dokunmadan. */
  function stil(){
    if(document.getElementById('msj-stil')) return;
    var s=document.createElement('style'); s.id='msj-stil';
    s.textContent =
      '.msj-rozet{display:inline-block;min-width:18px;padding:0 5px;margin-left:6px;'+
        'border-radius:9px;background:var(--bad,#A73A2C);color:#fff;font-size:11px;'+
        'font-weight:700;line-height:18px;text-align:center;vertical-align:1px}'+
      '.msj-akis{display:flex;flex-direction:column;gap:8px;max-height:360px;overflow:auto;'+
        'padding:4px 2px}'+
      '.msj{max-width:82%;padding:8px 11px;border-radius:10px;font-size:13.5px;line-height:1.5}'+
      '.msj.ben{align-self:flex-end;background:var(--accent-soft,#e6eef5);'+
        'border:1px solid var(--line,#d8e2e8)}'+
      '.msj.kars{align-self:flex-start;background:var(--paper,#f4f6f8);'+
        'border:1px solid var(--line,#d8e2e8)}'+
      '.msj-ust{font-size:11px;color:var(--ink-3,#6E8E9B);margin-bottom:3px;font-family:var(--mono,monospace)}'+
      '.msj-govde{color:var(--ink,#12242e);word-break:break-word}'+
      /* tikler: okunmamis soluk, okunmus vurgulu — WhatsApp mantigi */
      '.msj-tik{font-family:var(--sans,sans-serif);letter-spacing:-2px;margin-left:2px;'+
      'color:var(--ink-3,#8aa0ab)}'+
      '.msj-tik.okundu{color:var(--accent,#2E4A7D);font-weight:700}';
    document.head.appendChild(s);
  }

  return { kur:kur, stil:stil,
           sayac:sayac, rozet:rozet, sayaciTazele:sayaciTazele,
           kartKullanici:kartKullanici, gonder:gonder,
           kartYonetici:kartYonetici, ac:ac, kapat:kapat, yanitla:yanitla, sil:sil,
           tazele:tazele };
})();
