/*  BİYOSER KOÇLUK — SUNUCU AYARLARI
 *  Bu dosyayı bir kez oluşturursun, panel güncellemeleri bozmaz.
 *  service_role anahtarını ASLA buraya yazma.
 */
window.SUNUCU_AYAR = {
  url: 'https://hdcxmunvkxkffnsewfgp.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY3htdW52a3hrZmZuc2V3ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzA4MDMsImV4cCI6MjEwMjEwNjgwM30.SypEvxn5QXwyLtKdMorumeFhv1_ED-EPwghwjdMSYNw'
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
  { b:'5 · KONU TAKİBİ',              a:'612 konuluk harita nasıl işaretlenir',        id:'vNScbFsC2H0' },
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
