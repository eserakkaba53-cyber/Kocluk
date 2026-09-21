-- ---------------------------------------------------------------------
-- GEÇİCİ SİSTEM KİLİDİ
-- 21 Eylül 2026, 23:38 — saldırı sürerken sistemi yalnız yöneticiye açtık
--
-- DURUM: KİLİT ŞU AN AÇIK. Kapatma yolu en altta.
--
-- NEDEN BÖYLE
-- banned_until ile 222 kullanıcıya tek tek yazmak yerine tek anahtar:
-- açıp kapatması anında oluyor, kimsenin verisine dokunmuyor, geri alması
-- tek satır. engelli_mi() zaten 20 yetki yardımcısında ve 25 politikada
-- çağrılıyordu, kilit oraya bir koşul ekliyor.
--
-- KİLİTLENME TUZAĞI VE ÇÖZÜMÜ
-- Kapatma yetkisi yonetici_mi()'ye bağlansaydı, o da engelli_mi()'ye bağlı
-- olduğu için kilit açıkken false döner ve kilidi kapatacak kimse kalmazdı.
-- sistem_kilit_kapat() bu yüzden yonetici_mi() KULLANMIYOR, koclar.yonetici
-- sütununu doğrudan okuyor. Ayrıca sistem_kilit_ac() çağıranı her zaman muaf
-- listesine yazıyor, kendini dışarıda bırakması mümkün değil.
--
-- ÖLÇÜLEN SONUÇ (açma-kapama döngüsü, canlı)
--   kilit kapalıyken : yönetici 126 koç, normal koç 1 koç + 9 öğrenci
--   kilit açıkken    : yönetici 126 koç (değişmedi), koç ve öğrenci her
--                      tabloda 0
--   kapatma          : kilit açıkken de çalıştı, her şey geri geldi
--
-- AYRICA YAPILANLAR
--   Authentication > Sign In / Providers > "Allow new users to sign up" KAPALI
--     doğrulandı: /auth/v1/signup -> HTTP 422 signup_disabled
--   Yönetici dışındaki bütün oturumlar ve yenileme jetonları silindi
--     sonuç: 54 açık oturumun 54'ü de yöneticinin
--
-- KİLİDİN KAPSAMADIĞI ŞEY
-- GoTrue hâlâ jeton veriyor: kullanıcı şifresiyle giriş yapabilir, ama
-- paneli boş açılır ve her işlem başarısız olur. Jeton üretimini de durdurmak
-- için her kullanıcıya banned_until yazmak gerekirdi; kilit bilerek o yolu
-- seçmedi. anon rolü kilitten etkilenmiyor, açılış sayfası ve okul kodu
-- sorgusu çalışmaya devam ediyor.
-- ---------------------------------------------------------------------

create table if not exists public.sistem_kilit (
  tek        boolean primary key default true check (tek),
  acik       boolean not null default false,
  muaf       uuid[]  not null default '{}',
  neden      text    not null default '',
  baslatan   uuid,
  baslangic  timestamptz
);
alter table public.sistem_kilit enable row level security;
revoke all on table public.sistem_kilit from anon, authenticated;
insert into public.sistem_kilit (tek, acik) values (true, false) on conflict (tek) do nothing;

create or replace function public.engelli_mi()
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select
    coalesce(
      (select u.banned_until is not null and u.banned_until > now()
         from auth.users u where u.id = auth.uid()),
      false)
    or coalesce(
      (select s.acik and auth.uid() is not null and not (auth.uid() = any(s.muaf))
         from public.sistem_kilit s where s.tek),
      false);
$$;

create or replace function public.sistem_kilit_ac(p_neden text default '')
returns json language plpgsql security definer set search_path to 'public'
as $$
declare v_ben uuid := auth.uid();
begin
  if not public.yonetici_mi() then
    return json_build_object('ok', false, 'hata', 'Yetkin yok');
  end if;
  update public.sistem_kilit
     set acik = true,
         muaf = array(select distinct x from unnest(muaf || array[v_ben]) x where x is not null),
         neden = coalesce(p_neden,''), baslatan = v_ben, baslangic = now()
   where tek;
  return json_build_object('ok', true, 'muaf_sayisi',
    (select cardinality(muaf) from public.sistem_kilit where tek));
end $$;

create or replace function public.sistem_kilit_kapat()
returns json language plpgsql security definer set search_path to 'public'
as $$
begin
  -- yonetici_mi() KULLANILMIYOR: kilit açıkken o da false döner.
  if not coalesce((select k.yonetici from public.koclar k where k.id = auth.uid()), false) then
    return json_build_object('ok', false, 'hata', 'Yetkin yok');
  end if;
  update public.sistem_kilit
     set acik = false, neden = '', baslatan = null, baslangic = null
   where tek;
  return json_build_object('ok', true);
end $$;

create or replace function public.sistem_kilit_durum()
returns json language sql stable security definer set search_path to 'public'
as $$
  select json_build_object(
    'acik', s.acik, 'neden', s.neden, 'baslangic', s.baslangic,
    'muaf', (select coalesce(json_agg(u.email), '[]'::json)
               from auth.users u where u.id = any(s.muaf)))
  from public.sistem_kilit s
  where s.tek
    and coalesce((select k.yonetici from public.koclar k where k.id = auth.uid()), false);
$$;

revoke all on function public.sistem_kilit_ac(text)    from public, anon;
revoke all on function public.sistem_kilit_kapat()     from public, anon;
revoke all on function public.sistem_kilit_durum()     from public, anon;
grant execute on function public.sistem_kilit_ac(text)  to authenticated;
grant execute on function public.sistem_kilit_kapat()   to authenticated;
grant execute on function public.sistem_kilit_durum()   to authenticated;


-- =====================================================================
-- KİLİDİ KAPATMA
--
-- SQL Editor'den sistem_kilit_kapat() ÇALIŞMAZ: orada auth.uid() NULL,
-- fonksiyon "Yetkin yok" döner. Editörden kapatmanın yolu doğrudan
-- güncelleme:
--
--   update public.sistem_kilit set acik = false where tek;
--
-- Sonra Supabase panelinde Authentication > Sign In / Providers altındaki
-- "Allow new users to sign up" anahtarını geri aç.
--
-- Kullanıcılar kilit kaldırılınca yeniden giriş yapar: oturumları
-- silindiği için şifreleriyle girmeleri gerekir, veri kaybı yok.
--
-- DURUM SORGUSU
--   select acik, neden, baslangic,
--          (select string_agg(u.email,', ') from auth.users u where u.id = any(muaf)) as muaf
--   from public.sistem_kilit;
-- =====================================================================
