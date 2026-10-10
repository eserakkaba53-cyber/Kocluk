-- ============================================================
-- ÖZEL DERS — SINIFA SONRADAN KATILAN ÖĞRENCİ ESKİ SINIF ÖDEVLERİNİ ALIR
--                                                    10 Eki 2026
-- İSTEK
--   "Sınıfa sonradan eklenen öğrenciler de eski sınıf ödevlerini
--    görebilsin ve çözebilsin." (kullanıcı onayıyla uygulandı)
--
-- BUGÜNKÜ DURUM
--   Sınıfa ödev verilince ödev, sınıfın o anki her üyesine ayrı
--   oz_odevler satırı olarak yazılıyor (OZEL-DERS-sinif-gruplari.sql).
--   Hangi satırların aynı sınıf ödevinden geldiği tutulmuyordu, bu yüzden
--   sonradan katılan öğrenciye kopyalanacak bir şey bulunamıyordu.
--
-- TASARIM
--   oz_odevler.grup_id   : ödev sınıfa verildiyse o sınıf.
--   oz_odevler.grup_odev : aynı sınıf ödevinin bütün kopyalarında aynı uuid
--                          (öğretmen paneli sınıfa ödev verirken yazar).
--   Öğrenci bir sınıfa girince (yeni kayıt ya da sınıf değişikliği) tetikleyici
--   o sınıfın her grup_odev'inden bir kopyayı, sonuçları boş kalemlerle öğrenciye
--   yazar. Teslim tarihi geçmişse yeni teslim bir hafta sonrası olur. Öğrencide
--   o grup_odev zaten varsa ikinci kez yazılmaz.
--
-- GEÇMİŞ VERİ
--   Aynı sınıfta aynı gün, aynı teslim tarihi ve aynı test setiyle en az 2
--   öğrenciye ve sınıfın en az yarısına verilmiş ödevler sınıf ödevi sayılıp
--   işaretlenir, ardından sınıfların bütün üyeleri eşitlenir.
--   UYGULANDI 10 Eki 2026: 8 sınıf ödevi işaretlendi, 6 sınıfta 17 öğrenciye
--   18 ödev (156 kalem) kopyalandı. Yedek: yedek.oz_odevler_20261010 (202),
--   yedek.oz_kalemler_20261010 (1545).
--
-- YEDEK: yedek şeması (API'ye açık değil). Geri alma: en alttaki blok.
-- ============================================================

-- 0) YEDEK ---------------------------------------------------------
create schema if not exists yedek;
revoke all on schema yedek from public, anon, authenticated;
create table if not exists yedek.oz_odevler_20261010 as select * from public.oz_odevler;
create table if not exists yedek.oz_kalemler_20261010 as select * from public.oz_kalemler;

-- 1) SÜTUNLAR ------------------------------------------------------
alter table public.oz_odevler
  add column if not exists grup_id uuid references public.oz_gruplar(id) on delete set null,
  add column if not exists grup_odev uuid;
create index if not exists oz_odevler_grup_odev on public.oz_odevler(grup_odev);
create index if not exists oz_odevler_grup on public.oz_odevler(grup_id);

-- 2) EŞİTLEME ------------------------------------------------------
create or replace function public.oz_sinif_odev_esitle(p_ogr uuid)
returns integer language plpgsql security definer set search_path to 'public' as $function$
declare
  v_grup uuid; v_arsiv boolean; r record; v_yeni uuid; n integer := 0;
begin
  select grup_id, arsiv into v_grup, v_arsiv from oz_ogrenciler where id = p_ogr;
  if v_grup is null or v_arsiv then return 0; end if;
  for r in
    select distinct on (o.grup_odev) o.id, o.grup_odev, o.teslim
    from oz_odevler o
    where o.grup_id = v_grup and o.grup_odev is not null and not o.kendi
      and not exists (select 1 from oz_odevler x where x.ogrenci_id = p_ogr and x.grup_odev = o.grup_odev)
    order by o.grup_odev, o.olusturma
  loop
    insert into oz_odevler(ogrenci_id, verilis, teslim, kendi, grup_id, grup_odev)
    values (p_ogr, current_date,
            case when r.teslim is null then null
                 when r.teslim >= current_date then r.teslim
                 else current_date + 7 end,
            false, v_grup, r.grup_odev)
    returning id into v_yeni;
    insert into oz_kalemler(odev_id, test_id, ad, link, unite, konu, soru)
    select v_yeni, k.test_id, k.ad, k.link, k.unite, k.konu, k.soru
    from oz_kalemler k where k.odev_id = r.id;
    n := n + 1;
  end loop;
  return n;
end $function$;

create or replace function public.oz_sinif_odev_tetik()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if new.grup_id is not null and not new.arsiv
     and (tg_op = 'INSERT' or new.grup_id is distinct from old.grup_id or (old.arsiv and not new.arsiv)) then
    perform public.oz_sinif_odev_esitle(new.id);
  end if;
  return null;
end $function$;

drop trigger if exists tg_oz_sinif_odev on public.oz_ogrenciler;
create trigger tg_oz_sinif_odev after insert or update of grup_id, arsiv on public.oz_ogrenciler
  for each row execute function public.oz_sinif_odev_tetik();

-- Yalnız tetikleyici çağırır; API'den kimse çalıştıramaz.
revoke all on function public.oz_sinif_odev_esitle(uuid) from public, anon, authenticated;
revoke all on function public.oz_sinif_odev_tetik() from public, anon, authenticated;

-- 3) GEÇMİŞ SINIF ÖDEVLERİNİ İŞARETLE -----------------------------
with od as (
  select o.id, o.ogrenci_id, s.grup_id, o.verilis, o.teslim,
         (select string_agg(k.test_id || ':' || k.ad, '|' order by k.test_id, k.ad)
            from oz_kalemler k where k.odev_id = o.id) as imza
  from oz_odevler o join oz_ogrenciler s on s.id = o.ogrenci_id
  where not o.kendi and s.grup_id is not null and o.grup_odev is null
), setler as (
  select grup_id, verilis, teslim, imza, gen_random_uuid() as gk
  from od where imza is not null
  group by grup_id, verilis, teslim, imza
  having count(distinct ogrenci_id) >= 2
     -- Sınıfın en az yarısına verilmiş olmalı: 27 kişilik 9 A'da yalnız 3 öğrenciye
     -- verilmiş bir ödev vardı, sınıf ödevi sayılsaydı 24 kişiye yanlışlıkla kopyalanacaktı.
     and count(distinct ogrenci_id) * 2 >= (select count(*) from oz_ogrenciler s2
                                             where s2.grup_id = od.grup_id and not s2.arsiv)
)
update oz_odevler o set grup_id = s.grup_id, grup_odev = s.gk
from od join setler s
  on s.grup_id = od.grup_id and s.verilis = od.verilis
 and s.teslim is not distinct from od.teslim and s.imza = od.imza
where o.id = od.id;

-- 4) SONRADAN KATILMIŞ ÖĞRENCİLERİ EŞİTLE --------------------------
select sum(public.oz_sinif_odev_esitle(id)) as kopyalanan_odev
from oz_ogrenciler where grup_id is not null and not arsiv;

-- ============================================================
-- GERİ ALMA
--   drop trigger if exists tg_oz_sinif_odev on public.oz_ogrenciler;
--   drop function if exists public.oz_sinif_odev_tetik();
--   drop function if exists public.oz_sinif_odev_esitle(uuid);
--   -- eşitlemenin yazdığı kopyalar (yedekte olmayan sınıf ödevleri):
--   delete from public.oz_odevler o where o.grup_odev is not null
--     and not exists (select 1 from yedek.oz_odevler_20261010 y where y.id = o.id);
--   alter table public.oz_odevler drop column if exists grup_odev, drop column if exists grup_id;
-- ============================================================
