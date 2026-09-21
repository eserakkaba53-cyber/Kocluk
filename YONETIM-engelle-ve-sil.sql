-- ---------------------------------------------------------------------
-- Yönetici panelinde kullanıcı ENGELLEME ve SİLME
-- 21 Eylül 2026
--
-- DURUM: CANLIDA UYGULANDI ve UÇTAN UCA DOĞRULANDI (21 Eyl 2026, 22:15).
--   20 fonksiyon sarmalandı, 25 politika yamalandı (yamasız kalan 0),
--   10 tabloya yazma kilidi, 3 yeni yönetici RPC'si.
--   Ölçülen sonuç: engellenen kullanıcı için koclar=1 -> koclar=0, açık
--   oturum 0, yenileme jetonu 0. Engel kalkınca aktif değeri geri geldi.
--   Meşru kullanıcılarda hiçbir kayıp yok: yönetici 122 koç, normal koç
--   kendi 9 öğrencisi, öğrenci kendi kaydı.
--   Sınama fonksiyonları canlıda duruyor: engel_sinama(uuid),
--   engel_sinama_rls(uuid), engel_aktif_sinama(), engel_uctan_uca().
--   Hiçbirine anon/authenticated yetkisi verilmedi.
--
-- İSTEK
-- "blokladığım veya sildiğim an hiçbir işlem yapamasın", üç sistemde birden
-- (Biyoser koçluk, özel ders oz_*, rehberlik reh_*).
--
-- NEDEN MEVCUT "aktif" KUTUSU YETMİYOR
-- koclar.aktif yalnız lisans_gecerli() içinde okunuyor, o da YALNIZ yazma
-- politikalarında çağrılıyor. Canlı pg_policies dökümünden: 65 politikanın
-- 41'i bir yetki yardımcısından geçiyor, 22'si doğrudan auth.uid() ile
-- karşılaştırıyor. Okuma tarafı ve özel ders modülünün tamamı ikinci gruptaydı.
--
-- NEDEN YALNIZ banned_until DA YETMİYOR
-- JWT_EXP = 3600 (canlıdan okundu). Elindeki erişim jetonu bir saat daha
-- geçerli kalır; GoTrue yalnız YENİ jeton üretimini reddeder. Oturum zaman
-- kutusu ve hareketsizlik zaman aşımı Pro plana ait, bu projede kapalı.
--
-- BEŞ KATMAN
--   1. auth.users.banned_until          -> yeni giriş ve jeton tazeleme durur
--   2. auth.sessions + refresh_tokens   -> tazeleme zinciri kopar
--   3. engelli_mi() 16 yetki yardımcısında -> yardımcıdan geçen 41 politika kapanır
--   4. 22 politikaya doğrudan engel şartı  -> ham auth.uid() kullananlar kapanır
--   5. Politikasız tablolara yazma tetikleyicisi -> SECURITY DEFINER RPC'ler
--      RLS'i atlar ama tetikleyiciyi atlayamaz
--
-- BİR FONKSİYONA BİLEREK DOKUNULMADI
-- ogrenci_hesabi_mi() bir yetki kapısı DEĞİL, kimlik sınıflandırıcısı. Koç
-- paneli onu öğrencileri DIŞARIDA TUTMAK için kullanıyor
-- (kocluk-sunucu.html:8423 `if(ogrHesap){ sbCikis(); ... }`). Sarmalansaydı
-- engellenen öğrencide false dönerdi ve kişi o kapıdan GEÇERDİ. Ters etki.
--
-- GERİ ALMAK İÇİN
--   Bölüm 8'deki geri alma bloğu yorumda duruyor.
-- ---------------------------------------------------------------------


-- =====================================================================
-- 1. ENGEL DENETİMİ
-- =====================================================================

create or replace function public.engelli_mi()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    (select u.banned_until is not null and u.banned_until > now()
       from auth.users u where u.id = auth.uid()),
    false);
$$;

comment on function public.engelli_mi() is
  'Yonetici engellediginde true doner. Canlida olculdu: oturumsuz cagrida, '
  'banned_until bos olan butun kullanicilarda ve gecmis tarihte false.';


-- =====================================================================
-- 2. YETKİ YARDIMCILARI — engel denetimi sarmalanıyor
--    Gövdeler yeniden yazılmadı, özgün ifade parantez içinde korundu.
-- =====================================================================

create or replace function public.lisans_gecerli(koc uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi() and coalesce(
    (select k.aktif
       and ( k.lisans_bitis is null and k.deneme_bitis is null
          or k.lisans_bitis >= current_date
          or k.deneme_bitis >= current_date )
       and not coalesce((select u.banned_until is not null and u.banned_until > now()
                           from auth.users u where u.id = k.id), false)
     from public.koclar k where k.id = koc),
    false);
$$;
-- İki denetim var: engelli_mi() ÇAĞIRANI, ikinci alt sorgu HEDEF KOÇU
-- denetler. Öğrenci, koçu engellendiğinde de yazamamalı.

create or replace function public.kocum_mu(o uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi() and exists (
    select 1 from public.ogrenciler where id = o and koc_id = auth.uid());
$$;

create or replace function public.kocum_yazabilir(o uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi() and exists (
    select 1 from public.ogrenciler g
    where g.id = o and g.koc_id = auth.uid()
      and public.lisans_gecerli(g.koc_id));
$$;

create or replace function public.ogrencim_mi(o uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi() and exists (
    select 1 from public.ogrenciler where id = o and auth_id = auth.uid());
$$;

create or replace function public.ogrencim_yazabilir(o uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi() and exists (
    select 1 from public.ogrenciler g
    where g.id = o and g.auth_id = auth.uid()
      and public.lisans_gecerli(g.koc_id));
$$;

create or replace function public.yonetici_mi()
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi()
     and coalesce((select yonetici from public.koclar where id = auth.uid()), false);
$$;

create or replace function public.benim_ogrenci_id()
returns uuid language sql stable security definer set search_path to 'public'
as $$
  select case when public.engelli_mi() then null else
    (select id from public.ogrenciler where auth_id = auth.uid() limit 1) end;
$$;

create or replace function public.oz_kocum()
returns uuid language sql stable security definer set search_path to 'public'
as $$
  select case when public.engelli_mi() then null else
    (select koc_id from oz_ogrenciler where auth_id = auth.uid()) end;
$$;

create or replace function public.oz_kocum_mu(o uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi() and exists (
    select 1 from oz_ogrenciler where id = o and koc_id = auth.uid());
$$;

create or replace function public.oz_ben_ogrenci()
returns uuid language sql stable security definer set search_path to 'public'
as $$
  select case when public.engelli_mi() then null else
    (select id from oz_ogrenciler where auth_id = auth.uid()) end;
$$;

create or replace function public.od_koc_mu()
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi() and exists (
    select 1 from koclar k where k.id = auth.uid() and k.aktif);
$$;

-- ozel_ders_sikayet ve ozel_ders_engel tablolarının tek kapısı bu.
create or replace function public.od_yonetici_mu()
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select not public.engelli_mi() and exists (
    select 1 from koclar k where k.id = auth.uid() and k.aktif and k.yonetici);
$$;

create or replace function public.reh_rolum()
returns text language sql stable security definer set search_path to 'public', 'extensions'
as $$
  select case when public.engelli_mi() then null else
    (select rol from reh_profiller where auth_id = auth.uid()) end;
$$;

create or replace function public.reh_rehber_mi()
returns boolean language sql stable security definer set search_path to 'public', 'extensions'
as $$
  select not public.engelli_mi() and exists (
    select 1 from reh_profiller
    where auth_id = auth.uid() and rol = 'rehber' and onayli);
$$;

create or replace function public.reh_yonetici_mi()
returns boolean language sql stable security definer set search_path to 'public', 'extensions'
as $$
  select not public.engelli_mi() and exists (
    select 1 from reh_profiller where auth_id = auth.uid() and rol = 'yonetici');
$$;

create or replace function public.reh_benim_profilim_id()
returns uuid language sql stable security definer set search_path to 'public', 'extensions'
as $$
  select case when public.engelli_mi() then null else
    (select id from reh_profiller where auth_id = auth.uid()) end;
$$;


-- =====================================================================
-- 3. POLİTİKA YAMALARI
--    Yeni ifade ELLE yazılmıyor: canlı tanım pg_get_expr ile okunup
--    "not engelli_mi() and (özgün)" biçiminde sarmalanıyor. Böylece bir
--    ifadeyi yanlış kopyalayıp politikayı sessizce değiştirme riski yok.
--    Tekrar çalıştırmak zararsız: içinde engelli_mi geçen politika atlanır.
-- =====================================================================

do $$
declare
  r record;
  v_sql text;
  v_sayi int := 0;
begin
  for r in
    select c.relname as tablo, p.polname as politika,
           pg_get_expr(p.polqual, p.polrelid)      as qual,
           pg_get_expr(p.polwithcheck, p.polrelid) as chk
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      -- İfadesinde auth.uid() geçen HER politika. "Zaten bir yardımcıdan
      -- geçiyor" diye elemek YANLIŞ olurdu: oz_kat_oku ve oz_koc_oku gibi
      -- ifadeler `(koc_id = auth.uid()) OR (koc_id = oz_kocum())` biçiminde;
      -- sağdaki yardımcıyı sarmalamak OR'un SOL dalını kapatmıyor.
      -- Zaten kapalı bir politikayı ikinci kez sarmalamak zararsız.
      and coalesce(pg_get_expr(p.polqual, p.polrelid), '') ||
          coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') like '%auth.uid()%'
      and coalesce(pg_get_expr(p.polqual, p.polrelid), '') ||
          coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') not like '%engelli_mi%'
  loop
    v_sql := format('alter policy %I on public.%I', r.politika, r.tablo);
    if r.qual is not null then
      v_sql := v_sql || format(' using (not public.engelli_mi() and (%s))', r.qual);
    end if;
    if r.chk is not null then
      v_sql := v_sql || format(' with check (not public.engelli_mi() and (%s))', r.chk);
    end if;
    execute v_sql;
    v_sayi := v_sayi + 1;
    raise notice 'yamandi: %.%', r.tablo, r.politika;
  end loop;
  raise notice 'toplam % politika yamandi', v_sayi;
end $$;

-- Kuru çalıştırma sonucu (21 Eyl 2026): 25 politika yamalanıyor, 29 politika
-- auth.uid() hiç geçmediği ve yalnız sarmalanan yardımcılardan geçtiği için
-- dokunulmuyor. Toplam 54, kapsam tam.


-- =====================================================================
-- 4. POLİTİKASIZ TABLOLAR — yazma tetikleyicisi
--    Bu tablolarda RLS açık ama politika yok; tek kapı SECURITY DEFINER
--    fonksiyonlar ve onlar RLS'i atlıyor. Tetikleyiciyi atlayamazlar.
--    Böylece od_talep_ac, od_sikayet, reh_envanter_kaydet, reh_ogrenci_kayit,
--    reh_rehber_kayit, mesaj_gonder gibi onlarca fonksiyonun gövdesine
--    tek tek dokunmadan yazma tarafı kapanıyor.
-- =====================================================================

create or replace function public.engel_yazma_kilidi()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.engelli_mi() then
    raise exception 'Hesabın engellendi, bu işlem yapılamaz.'
      using errcode = 'insufficient_privilege';
  end if;
  return coalesce(NEW, OLD);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'ozel_ders', 'ozel_ders_sikayet', 'ozel_ders_engel',
    'reh_profiller', 'reh_envanter_yanitlari', 'reh_okullar',
    'mesajlar', 'oz_odevler', 'oz_kalemler', 'oz_konu'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists tg_engel_yazma on public.%I', t);
      execute format(
        'create trigger tg_engel_yazma before insert or update or delete on public.%I '
        'for each row execute function public.engel_yazma_kilidi()', t);
      raise notice 'yazma kilidi: %', t;
    end if;
  end loop;
end $$;


-- =====================================================================
-- 5. OKUMA KAPISI OLAN İKİ FONKSİYON
--    Bunlar SECURITY DEFINER ve hiçbir yardımcıdan geçmiyor.
-- =====================================================================

-- reh_durumum(): rehberlik panelinin açılış çağrısı. Engelli kullanıcıda
-- profil, okul kodu ve envanter cevaplarının tamamını döndürüyordu.
create or replace function public.reh_durumum()
returns json
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  p reh_profiller%rowtype;
  o reh_okullar%rowtype;
  y reh_envanter_yanitlari%rowtype;
begin
  if auth.uid() is null then
    return json_build_object('rol', null);
  end if;
  -- ★ 21 Eyl 2026 — engel denetimi. Panel 'rol' null görünce giriş ekranına döner.
  if public.engelli_mi() then
    return json_build_object('rol', null, 'engelli', true);
  end if;

  select * into p from reh_profiller where auth_id = auth.uid();
  if not found then
    return json_build_object('rol', null, 'kayitsiz', true,
      'eposta', (select email from auth.users where id = auth.uid()));
  end if;

  if p.okul_id is not null then
    select * into o from reh_okullar where id = p.okul_id;
  end if;

  if p.rol = 'ogrenci' then
    select * into y from reh_envanter_yanitlari where ogrenci_id = p.id;
  end if;

  return json_build_object(
    'rol', p.rol, 'ad_soyad', p.ad_soyad, 'eposta', p.eposta,
    'onayli', p.onayli, 'sinif', p.sinif, 'sube', p.sube, 'okul_no', p.okul_no,
    'okul_adi', coalesce(o.ad, p.istenen_okul), 'okul_kodu', o.kod,
    'cevaplar', coalesce(y.cevaplar, '{}'::jsonb)
  );
end $$;

-- od_taleplerim(): öğrencinin özel ders taleplerini döndürüyor, kapısı yok.
create or replace function public.od_taleplerim()
returns table(id uuid, brans text, aciklama text, tarih date, saat text, durum text,
              yenile_hak integer, koc_ad text, itiraz text, ogr_yildiz integer,
              koc_yildiz integer, olusma timestamp with time zone, koc_ort numeric,
              koc_ders bigint, engelli boolean, engel_neden text)
language sql stable security definer set search_path to 'public'
as $$
  select d.id, d.brans, d.aciklama, d.tarih, d.saat, d.durum,
    d.yenile_hak, d.koc_ad, d.itiraz, d.ogr_yildiz, d.koc_yildiz, d.olusma,
    (select round(avg(x.ogr_yildiz)::numeric,1) from ozel_ders x
      where x.koc_id = d.koc_id and x.durum='bitti' and x.ogr_yildiz is not null),
    (select count(*) from ozel_ders x where x.koc_id = d.koc_id and x.durum='bitti'),
    od_engelli_mi(auth.uid()), od_engel_neden(auth.uid())
  from ozel_ders d
  where d.ogr_auth = auth.uid()
    and not public.engelli_mi()          -- ★ 21 Eyl 2026
  order by d.olusma desc;
$$;


-- =====================================================================
-- 6. YÖNETİCİ İŞLEMLERİ
-- =====================================================================

create or replace function public.yonetici_engelle(hedef uuid, neden text default '')
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_mail text; v_ad text; v_aktif boolean;
begin
  if not public.yonetici_mi() then
    return json_build_object('ok', false, 'hata', 'Yetkin yok');
  end if;
  if hedef = auth.uid() then
    return json_build_object('ok', false, 'hata', 'Kendi hesabını engelleyemezsin');
  end if;

  select u.email into v_mail from auth.users u where u.id = hedef;
  if v_mail is null then
    return json_build_object('ok', false, 'hata', 'Hesap bulunamadı');
  end if;

  -- ★ Denetim bulgusu: silmede "başka yöneticiyi koruma" vardı, engellemede
  --   yoktu. Bir yönetici diğerini anında devre dışı bırakabiliyordu.
  if coalesce((select yonetici from public.koclar where id = hedef), false) then
    return json_build_object('ok', false, 'hata',
      'Bu hesap yönetici. Önce yönetici yetkisini kaldır.');
  end if;

  select k.ad, k.aktif into v_ad, v_aktif from public.koclar k where k.id = hedef;

  -- 1. Yeni giriş ve jeton tazeleme dursun. 'infinity' yerine uzak tarih:
  --    GoTrue'nun Go tarafında sonsuz zaman damgasıyla uğraşmak gereksiz risk.
  --    ★ onceki_aktif saklanıyor: engel kaldırılınca koç yazabilir hâle dönsün.
  update auth.users
     set banned_until = '2999-12-31 00:00:00+00'::timestamptz,
         raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
           jsonb_build_object('engel', jsonb_build_object(
             'tarih', now(), 'neden', coalesce(neden, ''), 'yapan', auth.uid(),
             'onceki_aktif', coalesce(v_aktif, true)))
   where id = hedef;

  -- 2. Açık oturumlar ve yenileme jetonları kopsun.
  --    refresh_tokens.user_id VARCHAR, sessions.user_id UUID (canlıdan doğrulandı).
  delete from auth.refresh_tokens where user_id = hedef::text;
  delete from auth.sessions        where user_id = hedef;

  -- 3. Koç satırı pasife düşsün.
  update public.koclar set aktif = false where id = hedef;

  return json_build_object('ok', true, 'eposta', v_mail, 'ad', coalesce(v_ad, ''));
end $$;

create or replace function public.yonetici_engel_kaldir(hedef uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_mail text; v_onceki boolean;
begin
  if not public.yonetici_mi() then
    return json_build_object('ok', false, 'hata', 'Yetkin yok');
  end if;
  select u.email, (u.raw_app_meta_data #>> '{engel,onceki_aktif}')::boolean
    into v_mail, v_onceki
  from auth.users u where u.id = hedef;
  if v_mail is null then
    return json_build_object('ok', false, 'hata', 'Hesap bulunamadı');
  end if;

  update auth.users
     set banned_until = null,
         raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'engel'
   where id = hedef;

  -- ★ Denetim bulgusu: aktif geri alınmazsa "engeli kaldırdım ama hâlâ
  --   çalışmıyor" durumu çıkıyordu, çünkü lisans_gecerli() k.aktif şartına
  --   bağlı. Engelden ÖNCEKİ değer neyse ona dönülüyor.
  update public.koclar set aktif = coalesce(v_onceki, true) where id = hedef;

  return json_build_object('ok', true, 'eposta', v_mail,
    'aktif', coalesce(v_onceki, true));
end $$;

create or replace function public.yonetici_hesap_sil(hedef uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_mail text; v_ogr int; n int;
begin
  if not public.yonetici_mi() then
    return json_build_object('ok', false, 'hata', 'Yetkin yok');
  end if;
  if hedef = auth.uid() then
    return json_build_object('ok', false, 'hata', 'Kendi hesabını silemezsin');
  end if;
  select u.email into v_mail from auth.users u where u.id = hedef;
  if v_mail is null then
    return json_build_object('ok', false, 'hata', 'Hesap bulunamadı');
  end if;
  if coalesce((select yonetici from public.koclar where id = hedef), false) then
    return json_build_object('ok', false, 'hata',
      'Bu hesap yönetici. Önce yönetici yetkisini kaldır.');
  end if;

  -- Bu kişinin KOÇ olarak sahip olduğu öğrenciler. koclar satırı kaskadla
  -- gidince bunlar da gider.
  select count(*) into v_ogr from public.ogrenciler where koc_id = hedef;

  -- Kaskad zinciri (01-tablolar.sql'deki FK tanımlarından):
  --   koclar.id        -> auth.users ON DELETE CASCADE
  --   ogrenciler.koc_id-> koclar     ON DELETE CASCADE  (öğrenciler gider)
  --   ogrenciler.auth_id-> auth.users ON DELETE SET NULL (BAŞKA bir koçun
  --     öğrencisiyse kaydı KALIR, yalnız hesap bağlantısı kopar — istenen bu)
  --   oz_koclar.id, oz_ogrenciler.auth_id, reh_profiller.auth_id, cihazlar
  delete from auth.users where id = hedef;
  get diagnostics n = row_count;

  return json_build_object('ok', n > 0, 'eposta', v_mail, 'silinen_ogrenci', v_ogr);
end $$;


-- =====================================================================
-- 7. koc_listesi() — panele "engelli" bayrağı
-- =====================================================================

create or replace function public.koc_listesi()
returns json language sql stable security definer set search_path to 'public'
as $$
  select coalesce(json_agg(x order by x->>'ad'), '[]'::json) from (
    select json_build_object(
      'id', k.id, 'ad', k.ad, 'kurum', k.kurum,
      'telefon', k.telefon,
      'eposta', (select u.email from auth.users u where u.id = k.id),
      'paket', k.paket, 'paket_adi', public.paket_adi(k.paket),
      'limit', public.paket_limiti(k.paket),
      'ogrenci', (select count(*) from public.ogrenciler o where o.koc_id = k.id and o.arsivlendi = false),
      'lisans_bitis', k.lisans_bitis, 'deneme_bitis', k.deneme_bitis,
      'gecerli', public.lisans_gecerli(k.id),
      'ucretli', (k.lisans_bitis is not null and k.lisans_bitis >= current_date),
      'aktif', k.aktif, 'cihaz_limiti', k.cihaz_limiti,
      'kvkk_onay', k.kvkk_onay, 'kayit', k.olusturuldu, 'notlar', k.notlar,
      'yonetici', k.yonetici,
      'engelli', coalesce((select u.banned_until is not null and u.banned_until > now()
                             from auth.users u where u.id = k.id), false),
      'engel_neden', (select u.raw_app_meta_data #>> '{engel,neden}'
                        from auth.users u where u.id = k.id),
      'engel_tarih', (select u.raw_app_meta_data #>> '{engel,tarih}'
                        from auth.users u where u.id = k.id),
      'son_giris', (select max(c.son_giris) from public.cihazlar c where c.kullanici = k.id),
      'bugun_aktif', coalesce(
        (select max(c.son_giris)::date = current_date from public.cihazlar c where c.kullanici = k.id),
        false)
    ) as x
    from public.koclar k
    where public.yonetici_mi()
  ) t;
$$;


-- =====================================================================
-- 8. YETKİLER
-- =====================================================================

revoke all on function public.yonetici_engelle(uuid, text)      from public, anon;
revoke all on function public.yonetici_engel_kaldir(uuid)       from public, anon;
revoke all on function public.yonetici_hesap_sil(uuid)          from public, anon;
grant execute on function public.yonetici_engelle(uuid, text)   to authenticated;
grant execute on function public.yonetici_engel_kaldir(uuid)    to authenticated;
grant execute on function public.yonetici_hesap_sil(uuid)       to authenticated;

-- engelli_mi() politikaların içinden çağrılıyor, iki role de gerekli.
grant execute on function public.engelli_mi() to anon, authenticated;


-- =====================================================================
-- 9. DENETİM — kurulumdan sonra çalıştır
-- =====================================================================
-- Beklenen: engelli_hesap=0, sarmalanan>=16, yamali_politika>=20,
--           yazma_kilidi=10, ogrenci_hesabi_mi_dokunulmadi='dogru'
--
-- select
--   (select count(*) from auth.users where banned_until > now())         as engelli_hesap,
--   (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--      where n.nspname='public' and p.prosrc like '%engelli_mi()%'
--        and p.proname <> 'engelli_mi')                                  as sarmalanan,
--   (select count(*) from pg_policies where schemaname='public'
--      and coalesce(qual,'')||coalesce(with_check,'') like '%engelli_mi%') as yamali_politika,
--   (select count(*) from pg_trigger where tgname='tg_engel_yazma')      as yazma_kilidi,
--   (select case when prosrc like '%engelli_mi%' then 'YANLIS' else 'dogru' end
--      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--      where n.nspname='public' and p.proname='ogrenci_hesabi_mi')       as ogrenci_hesabi_mi_dokunulmadi;
--
-- GERİ ALMA (tamamı):
--   do $$ declare r record; begin
--     for r in select tablename, policyname, qual, with_check from pg_policies
--              where schemaname='public' and coalesce(qual,'')||coalesce(with_check,'') like '%engelli_mi%'
--     loop null; end loop; end $$;
--   -- politikalar için: her birinde "not public.engelli_mi() and (...)" sarmalı
--   -- kaldırılıp iç ifade bırakılır.
--   drop trigger if exists tg_engel_yazma on public.ozel_ders;  -- ve diğer 9 tablo
--   -- yardımcı fonksiyonlar: bu dosyadaki gövdelerden "not public.engelli_mi() and"
--   -- ve "case when public.engelli_mi() then null else ... end" sarmalları silinir.
