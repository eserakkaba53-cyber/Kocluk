-- =====================================================================
-- YÖNETİCİ İÇİN İKİ ADIMLI GİRİŞ (27 Eyl 2026)
-- ---------------------------------------------------------------------
-- Yönetici yetkisinin üç kapısı var; öteki bütün yönetici işlevleri ve
-- politikalar bunlardan geçer:
--   yonetici_mi()      koçluk (28 işlev + konu_eslesme, koclar politikaları)
--   reh_yonetici_mi()  rehberlik (9 işlev)
--   od_yonetici_mu()   özel ders talepleri (5 işlev)
-- Hesapta DOĞRULANMIŞ bir TOTP faktörü varsa bu kapılar yalnız aal2
-- oturumda (şifre + doğrulama kodu) açılır. Faktörü olmayan hesapta davranış
-- değişmez; faktör koç panelinde Yönetim > İki adımlı giriş kartından kurulur.
-- Şifre çalınsa bile kodsuz oturum yönetici işlemi yapamaz.
--
-- Telefon kaybolursa: Supabase > Authentication > Users > hesap > MFA
-- faktörünü sil (ya da SQL: delete from auth.mfa_factors where user_id = ...).
-- =====================================================================

create or replace function public.mfa_tamam()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f
                     where f.user_id = auth.uid() and f.status = 'verified');
$$;

create or replace function public.yonetici_mi()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not public.engelli_mi()
     and coalesce((select yonetici from public.koclar where id = auth.uid()), false)
     and public.mfa_tamam();
$$;

create or replace function public.reh_yonetici_mi()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select not public.engelli_mi()
     and exists (select 1 from reh_profiller where auth_id = auth.uid() and rol = 'yonetici')
     and public.mfa_tamam();
$$;

create or replace function public.od_yonetici_mu()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not public.engelli_mi()
     and exists (select 1 from koclar k where k.id = auth.uid() and k.aktif and k.yonetici)
     and public.mfa_tamam();
$$;

-- ---------------------------------------------------------------------
-- DENEME (geri alınır; son satırdaki hata bilerek):
-- do $$ declare y uuid := (select id from koclar where yonetici limit 1); s text; begin
--   perform set_config('request.jwt.claims', json_build_object('sub', y, 'aal', 'aal1')::text, true);
--   s := 'faktorsuz aal1: ' || yonetici_mi();
--   insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
--     values (gen_random_uuid(), y, 'deneme', 'totp', 'verified', now(), now(), 'x');
--   s := s || ' | faktorlu aal1: ' || yonetici_mi();
--   perform set_config('request.jwt.claims', json_build_object('sub', y, 'aal', 'aal2')::text, true);
--   s := s || ' | faktorlu aal2: ' || yonetici_mi();
--   raise exception 'TEST %', s;
-- end $$;
-- Beklenen: faktorsuz aal1: true | faktorlu aal1: false | faktorlu aal2: true
-- ---------------------------------------------------------------------
