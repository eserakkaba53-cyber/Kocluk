-- =====================================================================
-- ÖZEL DERS: SINIFA KATILAN ÖĞRENCİNİN KADEMESİ (28 Eyl 2026)
-- ---------------------------------------------------------------------
-- Sorun: öğrenci sınıf koduyla katılınca oz_grup_katil sinif yazmıyordu,
-- tablo varsayılanı '11. Sınıf' giriyordu. 9 A, 9 B, 10 A, 10 B, 12A ve
-- 12 B sınıflarındaki 111 öğrenci 11. Sınıf görünüyordu.
--
-- Kural (oz_ad_kademe): sınıf adındaki ilk bağımsız 9/10/11/12 sayısı
-- 'N. Sınıf' olur; sayı yoksa ve adda "mezun" geçiyorsa 'Mezun'; ikisi de
-- yoksa kademe bilinmez ve hiçbir şeye dokunulmaz. Panel yeni sınıfı artık
-- kademe seçtirip "9 A" gibi adla açıyor (aynı kural panelde kademeOf).
--
-- 1) Öğrenci bir sınıfa girince (ekleme ya da grup_id değişimi) sınıfın
--    kademesi yazılır. Tek tetikleyici bütün yolları kapsar: kodla katılma,
--    öğretmenin sınıfa taşıması, adla eşleşen davetli öğrenci. Öğretmenin
--    Bilgiler sekmesinde elle verdiği kademe korunur (grup_id değişmedikçe
--    tetikleyici çalışmaz).
-- 2) Sınıfın adı değişince (örn. yeni yılda "9 A" → "10 A") kademesi eski
--    sınıf kademesiyle aynı olan öğrenciler yeni kademeye geçer; eski adda
--    kademe yoksa varsayılan '11. Sınıf' taşıyanlar geçer. Elle verilmiş
--    farklı kademe korunur.
-- =====================================================================

create or replace function public.oz_ad_kademe(ad text)
returns text
language sql
immutable
set search_path = public
as $$
  select coalesce(substring(ad from '(?:^|[^0-9])(9|10|11|12)(?:[^0-9]|$)') || '. Sınıf',
                  case when ad ~* 'mezun' then 'Mezun' end);
$$;

create or replace function public.oz_ogrenci_kademe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare k text;
begin
  if new.grup_id is not null and (tg_op = 'INSERT' or new.grup_id is distinct from old.grup_id) then
    select public.oz_ad_kademe(g.ad) into k from public.oz_gruplar g where g.id = new.grup_id;
    if k is not null then new.sinif := k; end if;
  end if;
  return new;
end $$;

drop trigger if exists tg_oz_ogrenci_kademe on public.oz_ogrenciler;
create trigger tg_oz_ogrenci_kademe
  before insert or update of grup_id on public.oz_ogrenciler
  for each row execute function public.oz_ogrenci_kademe();

create or replace function public.oz_grup_kademe_yay()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare eski text := public.oz_ad_kademe(old.ad);
        yeni text := public.oz_ad_kademe(new.ad);
begin
  if yeni is not null and yeni is distinct from eski then
    update public.oz_ogrenciler
       set sinif = yeni
     where grup_id = new.id
       and sinif = coalesce(eski, '11. Sınıf');
  end if;
  return new;
end $$;

drop trigger if exists tg_oz_grup_kademe_yay on public.oz_gruplar;
create trigger tg_oz_grup_kademe_yay
  after update of ad on public.oz_gruplar
  for each row execute function public.oz_grup_kademe_yay();

-- Yeni işlevler PUBLIC üzerinden anon'a açık doğar (bkz. GUVENLIK-anon-yetki-kisma.sql).
revoke execute on function public.oz_ad_kademe(text) from public, anon;
revoke execute on function public.oz_ogrenci_kademe() from public, anon;
revoke execute on function public.oz_grup_kademe_yay() from public, anon;

-- Mevcut kayıtlar: yalnız varsayılan '11. Sınıf' taşıyanlar sınıfının
-- kademesine çekilir; elle verilmiş farklı bir kademe korunur.
update public.oz_ogrenciler o
   set sinif = public.oz_ad_kademe(g.ad)
  from public.oz_gruplar g
 where o.grup_id = g.id
   and public.oz_ad_kademe(g.ad) is not null
   and o.sinif = '11. Sınıf'
   and public.oz_ad_kademe(g.ad) <> '11. Sınıf';

-- ---------------------------------------------------------------------
-- DENEME (geri alınır; son satırdaki hata bilerek):
-- do $$ declare g9 uuid; g12 uuid; k uuid; o record; s text; n int; begin
--   select id, koc_id into g9, k from oz_gruplar where ad = '9 A' limit 1;
--   select id into g12 from oz_gruplar where ad = '12A' limit 1;
--   insert into oz_ogrenciler(koc_id, ad, grup_id) values (k, 'Kademe Sinama', g9) returning * into o;
--   s := 'ekleme: ' || o.sinif;
--   update oz_ogrenciler set grup_id = g12 where id = o.id returning * into o;
--   s := s || ' | tasima: ' || o.sinif;
--   update oz_ogrenciler set sinif = '10. Sınıf' where id = o.id;
--   update oz_ogrenciler set grup_id = g12 where id = o.id returning * into o;
--   s := s || ' | ayni sinifa yeniden: ' || o.sinif;
--   update oz_gruplar set ad = '10 A Sinama' where id = g9;
--   select count(*) into n from oz_ogrenciler where grup_id = g9 and sinif = '10. Sınıf';
--   s := s || ' | 9 A -> 10: ' || n || ' ogrenci 10. Sinif';
--   raise exception 'TEST %', s;
-- end $$;
-- Beklenen: ekleme: 9. Sınıf | tasima: 12. Sınıf | ayni sinifa yeniden: 10. Sınıf | 9 A -> 10: 24 ogrenci 10. Sinif
-- ---------------------------------------------------------------------
