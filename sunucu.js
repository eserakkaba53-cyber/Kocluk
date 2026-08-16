/*  BİYOSER KOÇLUK — SUNUCU AYARLARI
 *  Bu dosyayı bir kez oluşturursun, panel güncellemeleri bozmaz.
 *  service_role anahtarını ASLA buraya yazma.
 */
window.SUNUCU_AYAR = {
  url: 'https://hdcxmunvkxkffnsewfgp.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY3htdW52a3hrZmZuc2V3ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzA4MDMsImV4cCI6MjEwMjEwNjgwM30.SypEvxn5QXwyLtKdMorumeFhv1_ED-EPwghwjdMSYNw'
};


/* ============================================================
   KULLANIM VİDEOLARI
   ------------------------------------------------------------
   BU BLOĞU mevcut sunucu.js dosyanın SONUNA EKLE.
   Dosyayı değiştirme — içindeki anahtar orada kalmalı.

   id  : YouTube adresindeki kod (ZORUNLU)
         https://www.youtube.com/watch?v=dQw4w9WgXcQ  →  dQw4w9WgXcQ
         https://youtu.be/dQw4w9WgXcQ                 →  dQw4w9WgXcQ
   b   : başlık
   a   : kısa açıklama        (istersen sil)
   sure: süre, ör. '4:12'     (istersen sil — yazmazsan görünmez)

   · id'si boş olan satır ekranda GÖRÜNMEZ.
   · Video eklemek için bir satırı kopyalayıp altına yapıştır.
   · Hiç video istemiyorsan: window.VIDEOLAR = [];
   ============================================================ */
window.VIDEOLAR = [
  { b:'1 · ÖĞRENCİ EKLEME',    a:'Hesap açma ve panelin genel tanıtımı',       id:'RPzk7lkXm7Y' },
  { b:'2 · HEDEF BELİRLEME',       a:'Veli onayı, kayıt ve davet kodu gönderme',   id:'jbWGy8c-Ub0' },
  { b:'3 · DENEME SONUÇLARI',         a:'Deneme karnesini yapıştır, netler otomatik', id:'2jN49XP5p9g' },
  { b:'4 · ÖDEVLER', a:'Konu seçimi, süre planı ve rutinler',        id:'qys0nXOuQio' },
  { b:'5 · KONU TAKİBİ',          a:'612 konuluk harita nasıl işaretlenir',       id:'vNScbFsC2H0' },
  { b:'6 · HAFTALIK VE DURUM TAKİVİ',        a:'YÖK verisiyle bölüm seçimi, hedefe uzaklık', id:'UcaOE0iuwqo' }
];
