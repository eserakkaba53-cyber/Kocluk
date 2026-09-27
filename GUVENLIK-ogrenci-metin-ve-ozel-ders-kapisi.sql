-- =====================================================================
-- ÖĞRENCİ SATIRI TEMİZLİĞİ + ÖZEL DERS TALEP KAPISI (27 Eyl 2026)
-- ---------------------------------------------------------------------
-- 1) Öğrenci kendi ogrenciler satırını güncelleyebiliyor (ogr_duzenle).
--    Sınıf, alan, hedef puan/sıralama, taban alanları ve hedef netler koç
--    panelinde birkaç yerde kaçışsız basılıyordu: öğrenci bu alanlara HTML
--    yazarsa koçun tarayıcısında çalışır, koçun oturumu çalınabilirdi.
--    Panel düzeltildi (kocluk-sunucu.html); bu tetikleyici aynı işaretleri
--    kaynağında atar, panelde gözden kaçan bir yer kalsa da işe yaramaz.
--    Kim yazarsa yazsın (öğrenci, koç, yönetici) çalışır.
--
-- 2) Özel ders talepleri (od_acik, od_kabul) her aktif koça açıktı; deneme
--    hesabı açan herkes talep görüp kabul edebilir, kabulde öğrencinin adı
--    ve telefonu açılırdı. Artık yalnız ücretli koç paketleri (koc,
--    ogretmen, sinif, okul, ozel) ve yönetici. Deneme ve öğrenci paketine
--    açık hata metni döner. Listeyi değiştirmek için aşağıdaki in (...).
-- =====================================================================

create or replace function public.ogrenciler_temizle()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  -- Kısa alanlar: meşru değer rakam ya da kısa etiket; tırnaklar da gider.
  new.sinif        := translate(new.sinif,        '<>"''', '');
  new.alan         := translate(new.alan,         '<>"''', '');
  new.hedef_puan   := translate(new.hedef_puan,   '<>"''', '');
  new.hedef_sira   := translate(new.hedef_sira,   '<>"''', '');
  new.taban_puan   := translate(new.taban_puan,   '<>"''', '');
  new.taban_sira   := translate(new.taban_sira,   '<>"''', '');
  new.taban_yil    := translate(new.taban_yil,    '<>"''', '');
  new.telefon      := translate(new.telefon,      '<>"''', '');
  new.veli_telefon := translate(new.veli_telefon, '<>"''', '');
  -- Serbest metin: yalnız etiket açan işaretler.
  new.ad             := translate(new.ad,             '<>', '');
  new.bolum          := translate(new.bolum,          '<>', '');
  new.eposta         := translate(new.eposta,         '<>', '');
  new.veli_ad        := translate(new.veli_ad,        '<>', '');
  new.veli_onay_notu := translate(new.veli_onay_notu, '<>', '');
  -- JSON: < ve > JSON'da yapı işareti değil, silmek geçerliliği bozmaz.
  new.hedef_netler := translate(new.hedef_netler::text, '<>', '')::jsonb;
  new.program      := translate(new.program::text,      '<>', '')::jsonb;
  return new;
end $$;

drop trigger if exists tg_ogrenciler_temizle on public.ogrenciler;
create trigger tg_ogrenciler_temizle
  before insert or update on public.ogrenciler
  for each row execute function public.ogrenciler_temizle();

-- ---------------------------------------------------------------------
-- od_koc_mu(): dört özel ders fonksiyonunun kapısı (od_acik, od_kabul,
-- od_koc_liste, od_koc_profil_yaz). Politikalarda kullanılmıyor.
-- ---------------------------------------------------------------------
create or replace function public.od_koc_mu()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.engelli_mi()
     or not exists (select 1 from koclar k where k.id = auth.uid() and k.aktif) then
    return false;
  end if;
  if not exists (select 1 from koclar k
                 where k.id = auth.uid()
                   and (k.yonetici
                        or lower(coalesce(k.paket, 'deneme')) in ('koc','ogretmen','sinif','okul','ozel'))) then
    raise exception 'Özel ders talepleri ücretli koç paketlerinde açık.';
  end if;
  return true;
end $$;

-- ---------------------------------------------------------------------
-- DENEME (kurulumdan sonra, geri alınır; son satırdaki hata bilerek):
-- do $$ declare r record; begin
--   update ogrenciler set alan = '<svg/onload=1>', sinif = sinif || '"x'
--    where id = (select id from ogrenciler limit 1) returning alan, sinif into r;
--   raise exception 'TEST alan=[%] sinif=[%]', r.alan, r.sinif;
-- end $$;
-- Beklenen: alan=[svg/onload=1], sinif tırnaksız.
-- ---------------------------------------------------------------------
