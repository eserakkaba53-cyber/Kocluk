/*  BİYOSER KOÇLUK — SUNUCU AYARLARI
 *  Bu dosyayı bir kez oluşturursun, panel güncellemeleri bozmaz.
 *  service_role anahtarını ASLA buraya yazma.
 */
window.SUNUCU_AYAR = {
  url: 'https://hdcxmunvkxkffnsewfgp.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY3htdW52a3hrZmZuc2V3ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzA4MDMsImV4cCI6MjEwMjEwNjgwM30.SypEvxn5QXwyLtKdMorumeFhv1_ED-EPwghwjdMSYNw',
  // Tüm koç ve öğrencilerin geri sayımı / "yetişir mi" hesabı bu tarihe göre yapılır.
  // Değiştir → herkeste (mevcut ve sonradan kayıt olan) otomatik güncellenir. Biçim: YYYY-MM-DD
  sinavTarihi: "2027-06-20",

  /* ── GERİ SAYIM SAYFASI (yks-geri-sayim.html) ──────────────────────
     ÖSYM 2027 sınav takvimini HENÜZ AÇIKLAMADI (son yayımlanan takvim 2026).
     Aşağıdaki tarihler geçmiş yılların düzenine göre BEKLENEN tarihlerdir;
     sayfa bunu ziyaretçiye açıkça yazar.
     ÖSYM resmi takvimi açıkladığında:
       1) sinavTarihi + üç oturum tarihini gerçek tarihlerle değiştir,
       2) sinavResmi'yi true yap  → "beklenen tarih" uyarısı kalkar.
     Biçim: YYYY-MM-DDTSS:DD  (Türkiye saati)                              */
  sinavResmi: false,
  tytTarihi: "2027-06-19T10:15",
  aytTarihi: "2027-06-20T10:15",
  ydtTarihi: "2027-06-20T15:45",

  // ZİYARET SAYACI (GoatCounter) — kaç kişi girmiş görmek için.
  // BOŞ bırakırsan sayaç çalışmaz. GoatCounter hesabını açıp kodunu buraya yapıştır, örnek:
  //   gc: "https://biyoser.goatcounter.com/count"
  // (Sadece "biyoser" kısmını kendi seçtiğin kodla değiştirirsin.)
  gc: ""
};


/* ============================================================
   KOÇ VİDEOLARI
   ------------------------------------------------------------
   Koç giriş sayfası · Davet ve kullanım sekmesi · tanıtım sayfası

   id  : YouTube adresindeki kod (ZORUNLU)
         https://youtu.be/dQw4w9WgXcQ  →  dQw4w9WgXcQ
   b   : başlık
   a   : kısa açıklama   (istersen sil)
   sure: süre, ör. '4:12' (istersen sil)

   · id'si boş olan satır GÖRÜNMEZ.
   · HER SATIRIN SONUNDA VİRGÜL OLMALI (son satır hariç).
   ============================================================ */
window.VIDEOLAR = [
  { b:'1 · ÖĞRENCİ EKLEME',           a:'Hesap açma ve öğrenci ekleme',                id:'RPzk7lkXm7Y' },
  { b:'2 · HEDEF BELİRLEME',          a:'YÖK verisiyle bölüm seçimi, hedefe uzaklık',  id:'jbWGy8c-Ub0' },
  { b:'3 · DENEME SONUÇLARI',         a:'Deneme karnesini yapıştır, netler otomatik',  id:'2jN49XP5p9g' },
  { b:'4 · ÖDEVLER',                  a:'Konu seçimi, süre planı ve rutinler',         id:'qys0nXOuQio' },
  { b:'5 · KONU TAKİBİ',              a:'628 konuluk harita nasıl işaretlenir',        id:'vNScbFsC2H0' },
  { b:'6 · HAFTALIK VE DURUM TAKİBİ', a:'Öğrencinin genel takibi',                     id:'UcaOE0iuwqo' }
];


/* ============================================================
   ÖĞRENCİ VİDEOLARI
   ------------------------------------------------------------
   Öğrenci giriş ekranı · kayıt ekranı · kod ekranı ·
   Yardım sekmesi · tanıtım sayfası

   Bu AYRI bir listedir; koç videolarıyla karıştırma.
   ============================================================ */
window.OGRENCI_VIDEOLAR = [
  { b:'1 · ÖĞRENCİ PANELİ',        a:'Hesap açma, ödevler, denemeler ve konu takibi', id:'85bXcQvlQdM' },
  { b:'2 · Ödevlerimi işaretleme', a:'Yaptım / yarım / yapmadım ve soru dökümü',      id:'' },
  { b:'3 · Deneme sonucu girme',   a:'Netlerini panele nasıl eklersin',               id:'' },
  { b:'4 · Konularımı işaretleme', a:'Bitti, işleniyor, eksiğim var',                 id:'' },
  { b:'5 · Hedefe uzaklık',        a:'Bölüm seçimi ve yetişir mi hesabı',             id:'' }
];


/* ============================================================
   TANITIM SAYAÇLARI
   ------------------------------------------------------------
   Koç giriş sayfası · tanıtım sayfası

   BOŞ BIRAKIRSAN sunucudan canlı okunur (supabase-17-sayilar.sql
   çalıştırılmış olmalı) ve kendiliğinden güncellenir.

   Örnekler:
     window.SAYILAR = { ogretmen:'20',  ogrenci:'75'  };
     window.SAYILAR = { ogretmen:'+20', ogrenci:'+70' };
     window.SAYILAR = { ogretmen:'',    ogrenci:''    };   // canlı sayım
   ============================================================ */
window.SAYILAR = { ogretmen:'+40', ogrenci:'+70' };

window.BIYOSER_WP = '905325874992';   // ülke kodu, başında + ve boşluk yok


/* ============================================================
   FARK YAZIMI — yalnız değişeni yaz, görmediğini silme   (16 Eyl 2026)
   ------------------------------------------------------------
   İki panel de öğrencinin satırlarını açılışta okuyup her kayıtta TÜM
   satırları o kopyadan yazıyordu. Karşı taraf bu arada bir şey
   değiştirdiyse (öğrenci ödevi "yaptım" işaretledi, koç ödevi başka güne
   aldı, öğrenci deneme ekledi, öğrenci davet koduyla bağlandı) bayat
   kopya onu eziyor ya da siliyordu.

   Bu yardımcı açılışta okunan satırların izini tutar. Kayıtta yalnız
     · izden farklı ALANLARI            → degisen  (PATCH, alan alan)
     · izde hiç olmayan satırları       → yeni     (INSERT)
     · izde olup yerelde silinenleri    → silinen  (DELETE)
   gönderir. İzde olmayan uzak satıra DOKUNMAZ: onu karşı taraf yazmıştır.
   İz yoksa (çevrimdışı yükleme, ilk aktarım) her satır "yeni" sayılır ve
   eski davranış (tam upsert) sürer; silme yapılmaz.

   Kullanım:
     FARK.iz('odevler:'+ogrId, satirlar)             // açılışta, sunucu biçiminde
     var f = FARK.fark('odevler:'+ogrId, simdiki)    // {izYok, yeni, degisen:[{id,alan}], silinen}
     ... yaz ...
     FARK.iz('odevler:'+ogrId, simdiki)              // yazma tuttuysa izi tazele
   Bileşik anahtarlı tablo (konular): üçüncü bağımsız değişken anahtar
   fonksiyonu, ör. function(r){ return r.ders+'|'+r.konu; }
   ============================================================ */
window.FARK = (function(){
  var IZ = {};
  function d(x){ return JSON.stringify(x===undefined ? null : x); }
  function kimlik(r, anahtarAl){ return anahtarAl ? anahtarAl(r) : r.id; }
  return {
    iz: function(anahtar, satirlar, anahtarAl){
      var m = {};
      (satirlar || []).forEach(function(r){
        if(!r) return;
        var k = kimlik(r, anahtarAl); if(k == null) return;
        m[k] = JSON.parse(d(r));                   // derin kopya: sonradan değişmesin
      });
      IZ[anahtar] = m;
    },
    izVar: function(anahtar){ return !!IZ[anahtar]; },
    unut:  function(anahtar){ delete IZ[anahtar]; },
    fark: function(anahtar, simdiki, anahtarAl){
      var m = IZ[anahtar];
      if(!m) return { izYok:true, yeni:(simdiki || []).slice(), degisen:[], silinen:[] };
      var yeni = [], degisen = [], gorulen = {};
      (simdiki || []).forEach(function(r){
        if(!r) return;
        var k = kimlik(r, anahtarAl); if(k == null) return;
        gorulen[k] = 1;
        var eski = m[k];
        if(!eski){ yeni.push(r); return; }
        var alan = {}, n = 0;
        for(var a in r){
          if(a === 'id') continue;
          if(d(r[a]) !== d(eski[a])){ alan[a] = r[a]; n++; }
        }
        if(n) degisen.push({ id:k, alan:alan, satir:r });
      });
      var silinen = [];
      for(var k2 in m) if(!gorulen[k2]) silinen.push({ id:k2, satir:m[k2] });
      return { izYok:false, yeni:yeni, degisen:degisen, silinen:silinen };
    }
  };
})();
