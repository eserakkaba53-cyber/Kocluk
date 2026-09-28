-- =====================================================================
-- ÖZEL DERS: SINIFA KATILAN ÖĞRENCİNİN KADEMESİ (28 Eyl 2026)
-- ---------------------------------------------------------------------
-- Sorun: öğrenci sınıf koduyla katılınca oz_grup_katil sinif yazmıyordu,
-- tablo varsayılanı '11. Sınıf' giriyordu. 9 A, 9 B, 10 A, 10 B, 12A ve
-- 12 B sınıflarındaki 111 öğrenci 11. Sınıf görünüyordu.
--
-- Çözüm: öğrenci bir sınıfa girdiğinde (ekleme ya da grup_id değişimi)
-- sınıfın ADINDAKİ kademe yazılır. Addaki ilk bağımsız 9/10/11/12 sayısı
-- 'N. Sınıf' olur; sayı yoksa ve adda "mezun" geçiyorsa 'Mezun'. Adında
-- kademe yoksa dokunulmaz. Tek tetikleyici bütün yolları kapsar: kodla
-- katılma, öğretmenin sınıfa taşıması, adla eşleşen davetli öğrenci.
-- Öğretmenin Bilgiler sekmesinde elle değiştirdiği kademe korunur, çünkü
-- grup_id değişmedikçe tetikleyici çalışmaz. Panel de yeni sınıfı artık
-- kademe seçtirip "9 A" gibi adla açıyor.
-- =====================================================================

create or replace function public.oz_ogrenci_kademe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare k text;
begin
  if new.grup_id is not null and (tg_op = 'INSERT' or new.grup_id is distinct from old.grup_id) then
    select coalesce(substring(g.ad from '(?:^|[^0-9])(9|10|11|12)(?:[^0-9]|$)') || '. Sınıf',
                    case when g.ad ~* 'mezun' then 'Mezun' end)
      into k
      from public.oz_gruplar g
     where g.id = new.grup_id;
    if k is not null then new.sinif := k; end if;
  end if;
  return new;
end $$;
-- Yeni işlev PUBLIC üzerinden anon'a açık doğar (bkz. GUVENLIK-anon-yetki-kisma.sql).
revoke execute on function public.oz_ogrenci_kademe() from public, anon;

drop trigger if exists tg_oz_ogrenci_kademe on public.oz_ogrenciler;
create trigger tg_oz_ogrenci_kademe
  before insert or update of grup_id on public.oz_ogrenciler
  for each row execute function public.oz_ogrenci_kademe();

-- Mevcut kayıtlar: yalnız varsayılan '11. Sınıf' taşıyanlar sınıfının
-- kademesine çekilir; elle verilmiş farklı bir kademe korunur.
update public.oz_ogrenciler o
   set sinif = x.k
  from (select g.id,
               coalesce(substring(g.ad from '(?:^|[^0-9])(9|10|11|12)(?:[^0-9]|$)') || '. Sınıf',
                        case when g.ad ~* 'mezun' then 'Mezun' end) as k
          from public.oz_gruplar g) x
 where o.grup_id = x.id
   and x.k is not null
   and o.sinif = '11. Sınıf'
   and x.k <> '11. Sınıf';

-- ---------------------------------------------------------------------
-- DENEME (geri alınır; son satırdaki hata bilerek):
-- do $$ declare g9 uuid; g12 uuid; k uuid; o record; s text; begin
--   select id, koc_id into g9, k from oz_gruplar where ad = '9 A' limit 1;
--   select id into g12 from oz_gruplar where ad = '12A' limit 1;
--   insert into oz_ogrenciler(koc_id, ad, grup_id) values (k, 'Kademe Sinama', g9) returning * into o;
--   s := 'ekleme: ' || o.sinif;
--   update oz_ogrenciler set grup_id = g12 where id = o.id returning * into o;
--   s := s || ' | tasima: ' || o.sinif;
--   update oz_ogrenciler set sinif = '10. Sınıf' where id = o.id;
--   update oz_ogrenciler set grup_id = g12 where id = o.id returning * into o;
--   s := s || ' | ayni sinifa yeniden: ' || o.sinif;
--   raise exception 'TEST %', s;
-- end $$;
-- Beklenen: ekleme: 9. Sınıf | tasima: 12. Sınıf | ayni sinifa yeniden: 10. Sınıf
-- ---------------------------------------------------------------------
