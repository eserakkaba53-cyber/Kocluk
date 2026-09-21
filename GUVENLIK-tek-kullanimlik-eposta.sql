-- ---------------------------------------------------------------------
-- 21 Eylül 2026 — Tek kullanımlık e-posta alan adlarını kayıtta engelle
--
-- DURUM: CANLIDA UYGULANDI (21 Eylül 2026, ~20:40). Bu dosya kaydın kendisi;
-- yeniden çalıştırmak zararsız (create if not exists / or replace / on conflict).
-- Uçtan uca doğrulandı: mailinator adresiyle /auth/v1/signup isteği
-- HTTP 500 + 23514 ile reddedildi, hesap oluşmadı.
--
-- NEDEN
-- 18:37'de e-posta doğrulaması açıldıktan sonra saldırgan önce proton.me,
-- yandex.com, outlook.com ve tutanota.com adreslerini ikişer saniye arayla
-- deneyip hangisinin tuttuğuna baktı (19:16:04, :06, :08, :10). Sonra gelen
-- kutusunu program üzerinden okunabilen geçici posta servislerine geçti ve
-- onay bağlantısına tıklayarak doğrulamayı aştı:
--   julee1cf8@i9.auroracovia.com      19:16:56  onayladı
--   isadora1d87@7wi.guidemaxima.com   19:19:19  onayladı
--   tedda2616@t8.imagesthere.com      19:55:51  onayladı
--   tarsuss2b0f@8g.inovel26.com       20:17:04  onayladı
--   pier2b95@hg.imagesthere.com       20:19:17  onayladı, reh_yonetici_ata ile yönetici oldu
--
-- Bu servisler rastgele ALT alan adı veriyor (i9., 7wi., rs., t8., 8g., hg.),
-- o yüzden tam konak adını değil KAYITLI alan adını (son iki etiket)
-- karşılaştırıyoruz.
--
-- NEREYE
-- auth.users üzerinde BEFORE INSERT. Beş kayıt yolunun (koç paneli, öğrenci
-- paneli, özel ders öğrenci, özel ders koç, rehberlik) hepsi aynı uçtan
-- geçtiği için tek yerde durdurmak beş dosyayı düzenlemekten kısa.
--
-- GERİ ALMAK İÇİN
--   drop trigger if exists tg_eposta_kara_liste on auth.users;
-- ---------------------------------------------------------------------

create table if not exists public.eposta_kara_liste (
  alan    text primary key,
  eklendi timestamptz not null default now(),
  neden   text not null default ''
);

-- Tabloya kimse dokunamaz: yalnız SECURITY DEFINER tetikleyici okur.
alter table public.eposta_kara_liste enable row level security;
revoke all on table public.eposta_kara_liste from anon, authenticated;

insert into public.eposta_kara_liste (alan, neden) values
  ('mailinator.com',   '21 Eyl 2026 saldirisi'),
  ('kanye.com',        '21 Eyl 2026 saldirisi'),
  ('kanyewest.com',    '21 Eyl 2026 saldirisi'),
  ('imagesthere.com',  '21 Eyl 2026 saldirisi, alt alan adi veriyor'),
  ('guidemaxima.com',  '21 Eyl 2026 saldirisi, alt alan adi veriyor'),
  ('auroracovia.com',  '21 Eyl 2026 saldirisi, alt alan adi veriyor'),
  ('inovel26.com',     '21 Eyl 2026 saldirisi, alt alan adi veriyor'),
  ('mailna.co',        'gecici posta'),
  ('guerrillamail.com','gecici posta'),
  ('sharklasers.com',  'guerrillamail takma adi'),
  ('yopmail.com',      'gecici posta'),
  ('temp-mail.org',    'gecici posta'),
  ('10minutemail.com', 'gecici posta'),
  ('trashmail.com',    'gecici posta'),
  ('dispostable.com',  'gecici posta'),
  ('maildrop.cc',      'gecici posta'),
  ('getnada.com',      'gecici posta'),
  ('tempmail.com',     'gecici posta'),
  ('mohmal.com',       'gecici posta'),
  ('emailondeck.com',  'gecici posta'),
  ('throwawaymail.com','gecici posta'),
  ('fakeinbox.com',    'gecici posta'),
  ('mailcatch.com',    'gecici posta'),
  ('moakt.com',        'gecici posta'),
  ('tempr.email',      'gecici posta'),
  ('tmpmail.org',      'gecici posta'),
  ('inboxkitten.com',  'gecici posta'),
  ('mintemail.com',    'gecici posta'),
  ('spamgourmet.com',  'gecici posta'),
  ('mytemp.email',     'gecici posta')
on conflict (alan) do nothing;

-- Kayıtlı alan adı: konağın son iki etiketi. i9.auroracovia.com -> auroracovia.com
create or replace function public.eposta_kok_alan(p_eposta text)
returns text
language sql
immutable
set search_path to 'public'
as $$
  select case
    when position('@' in coalesce(p_eposta,'')) = 0 then ''
    else (
      select string_agg(parca, '.' order by sira)
      from (
        select parca, sira
        from unnest(string_to_array(lower(split_part(p_eposta,'@',2)), '.'))
             with ordinality as t(parca, sira)
        order by sira desc
        limit 2
      ) son
    )
  end;
$$;

create or replace function public.eposta_kara_liste_denetle()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_alan text;
  v_kok  text;
begin
  v_alan := lower(split_part(coalesce(new.email,''), '@', 2));
  if v_alan = '' then
    return new;                              -- telefon/OAuth kaydı, karışma
  end if;
  v_kok := public.eposta_kok_alan(new.email);

  if exists (select 1 from public.eposta_kara_liste k
             where k.alan = v_alan or k.alan = v_kok) then
    raise exception
      'Bu e-posta servisi kabul edilmiyor. Gmail, Outlook ya da okul adresinle kaydol.'
      using errcode = 'check_violation';
  end if;

  return new;
end $$;

drop trigger if exists tg_eposta_kara_liste on auth.users;
create trigger tg_eposta_kara_liste
  before insert on auth.users
  for each row execute function public.eposta_kara_liste_denetle();

-- ---------------------------------------------------------------------
-- DENETİM — kurulumdan sonra çalıştır.
-- Beklenen: kara_liste_adedi 30, tetikleyici 'var',
-- kok_alan testleri auroracovia.com ve gmail.com döner.
-- ---------------------------------------------------------------------
-- select
--   (select count(*) from public.eposta_kara_liste)                    as kara_liste_adedi,
--   (select count(*) from pg_trigger
--      where tgrelid='auth.users'::regclass
--        and tgname='tg_eposta_kara_liste')                            as tetikleyici,
--   public.eposta_kok_alan('julee1cf8@i9.auroracovia.com')             as test_alt_alan,
--   public.eposta_kok_alan('ogrenci@gmail.com')                        as test_normal;

-- Yeni alan adı eklemek için (tetikleyiciye dokunmadan):
--   insert into public.eposta_kara_liste (alan, neden)
--   values ('yenisite.com', 'neden') on conflict (alan) do nothing;
