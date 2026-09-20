-- =====================================================================
--  KENDİNİ TANI ENVANTERLERİ — Supabase kurulumu
--  Supabase panelinde  SQL Editor > New query  içine yapıştırıp Run.
--  Bir kez çalıştırılır, tekrar çalıştırmak güvenlidir.
--
--  ÜÇ ROL
--    yonetici  Tek kişi. Bütün reh_okulları, rehberleri ve öğrencileri görür,
--              rehber öğretmen başvurularını onaylar.
--    rehber    Okuluna kayıt olan öğrencileri görür. Yönetici onaylamadan
--              hesabı çalışmaz.
--    ogrenci   Okul koduyla kayıt olur, envanterleri doldurur, raporunu görür.
--
--  Giriş üç rolde de e-posta ve şifreyle, Supabase Auth üzerinden.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. TABLOLAR
-- ---------------------------------------------------------------------

-- Okul kodu rehber öğretmen onaylanınca üretilir, öncesinde null durur.
create table if not exists reh_okullar (
  id       uuid primary key default gen_random_uuid(),
  kod      text unique,
  ad       text not null,
  il       text,
  ilce     text,
  aktif    boolean not null default false,
  demo     boolean not null default false,
  eklendi  timestamptz not null default now()
);

create index if not exists okullar_kod_idx on reh_okullar (kod) where kod is not null;

-- auth_id örnek sınıftaki öğrencilerde null: onların giriş hesabı yok,
-- yalnız panelde nasıl göründüğünü göstermek için duruyorlar.
create table if not exists reh_profiller (
  id            uuid primary key default gen_random_uuid(),
  auth_id       uuid unique references auth.users(id) on delete cascade,
  rol           text not null check (rol in ('yonetici', 'rehber', 'ogrenci')),
  ad_soyad      text not null,
  eposta        text,
  okul_id       uuid references reh_okullar(id) on delete set null,
  istenen_okul  text,
  sinif         smallint check (sinif between 9 and 12),
  sube          text,
  okul_no       text,
  onayli        boolean not null default false,
  demo          boolean not null default false,
  eklendi       timestamptz not null default now()
);

create index if not exists profiller_okul_idx on reh_profiller (okul_id);
create index if not exists profiller_rol_idx  on reh_profiller (rol);

-- Aynı okulda aynı okul numarası iki kez kullanılmasın.
create unique index if not exists profiller_okul_no_tekil
  on reh_profiller (okul_id, okul_no)
  where rol = 'ogrenci' and okul_no is not null and okul_no <> '';

create table if not exists reh_envanter_yanitlari (
  id                uuid primary key default gen_random_uuid(),
  ogrenci_id        uuid not null unique references reh_profiller(id) on delete cascade,
  cevaplar          jsonb not null default '{}'::jsonb,
  yetenek_baslangic timestamptz,
  baslangic         timestamptz not null default now(),
  guncellendi       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. RLS — hiçbir tablo doğrudan okunmaz.
--    Bütün erişim aşağıdaki security definer fonksiyonlardan geçer.
-- ---------------------------------------------------------------------

alter table reh_okullar            enable row level security;
alter table reh_profiller          enable row level security;
alter table reh_envanter_yanitlari enable row level security;

-- Politika tanımlanmadı: RLS açık ve politika yoksa anon ve authenticated
-- rolleri hiçbir satırı göremez. Tek kapı fonksiyonlar.

-- ---------------------------------------------------------------------
-- 3. KİMLİK YARDIMCILARI
-- ---------------------------------------------------------------------

create or replace function reh_benim_profilim_id() returns uuid
language sql stable security definer set search_path = public, extensions as $$
  select id from reh_profiller where auth_id = auth.uid();
$$;

create or replace function reh_rolum() returns text
language sql stable security definer set search_path = public, extensions as $$
  select rol from reh_profiller where auth_id = auth.uid();
$$;

create or replace function reh_yonetici_mi() returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from reh_profiller where auth_id = auth.uid() and rol = 'yonetici');
$$;

create or replace function reh_rehber_mi() returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (
    select 1 from reh_profiller
    where auth_id = auth.uid() and rol = 'rehber' and onayli
  );
$$;

create or replace function reh_benim_okulum() returns uuid
language sql stable security definer set search_path = public, extensions as $$
  select okul_id from reh_profiller where auth_id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 4. OKUL KODU
--    Karışan harfler yok: 0 ile O, 1 ile I, 8 ile B ayrı ayrı okunamıyor,
--    öğrenci kodu elle yazacağı için bunlar alfabeden çıkarıldı.
-- ---------------------------------------------------------------------

create or replace function reh_okul_kodu_uret() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  harfler constant text := 'ACDEFGHJKLMNPRTUVWXYZ234679';
  aday    text;
  deneme  int := 0;
begin
  loop
    aday := '';
    for i in 1..6 loop
      aday := aday || substr(harfler, 1 + floor(random() * length(harfler))::int, 1);
    end loop;
    exit when not exists (select 1 from reh_okullar where kod = aday);
    deneme := deneme + 1;
    if deneme > 50 then
      raise exception 'Okul kodu üretilemedi.';
    end if;
  end loop;
  return aday;
end $$;

-- Kayıt formunun kodu anında denetlemesi için. Okul adını döner ki
-- öğrenci yanlış okula kaydolmadan önce görsün.
create or replace function reh_okul_kodu_sor(p_kod text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  o reh_okullar%rowtype;
begin
  select * into o from reh_okullar where kod = upper(trim(p_kod));
  if not found or not o.aktif then
    return json_build_object('gecerli', false,
      'mesaj', 'Bu okul kodu tanınmadı. Rehber öğretmeninden kodu tekrar iste.');
  end if;
  if o.demo then
    return json_build_object('gecerli', false,
      'mesaj', 'Bu kod örnek sınıfa ait, öğrenci kaydı için kullanılamaz.');
  end if;
  return json_build_object('gecerli', true, 'okul_adi', o.ad,
    'il', coalesce(o.il, ''), 'ilce', coalesce(o.ilce, ''));
end $$;

-- ---------------------------------------------------------------------
-- 5. KAYIT
--    Supabase Auth'a kayıt olduktan hemen sonra, oturum jetonuyla çağrılır.
-- ---------------------------------------------------------------------

create or replace function reh_ogrenci_kayit(
  p_ad_soyad text, p_okul_kodu text, p_sinif int, p_sube text, p_okul_no text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  o reh_okullar%rowtype;
  mevcut reh_profiller%rowtype;
begin
  if auth.uid() is null then
    return json_build_object('hata', 'Önce hesabını oluşturman gerekiyor.');
  end if;

  select * into mevcut from reh_profiller where auth_id = auth.uid();
  if found then
    return json_build_object('hata', 'Bu hesap zaten kayıtlı.');
  end if;

  if coalesce(trim(p_ad_soyad), '') = '' then
    return json_build_object('hata', 'Ad soyad boş olamaz.');
  end if;

  if p_sinif is null or p_sinif not between 9 and 12 then
    return json_build_object('hata', 'Sınıfını 9 ile 12 arasından seç.');
  end if;

  if coalesce(trim(p_sube), '') = '' then
    return json_build_object('hata', 'Şubeni seç.');
  end if;

  select * into o from reh_okullar where kod = upper(trim(p_okul_kodu));
  if not found or not o.aktif or o.demo then
    return json_build_object('hata',
      'Okul kodu tanınmadı. Rehber öğretmeninden kodu tekrar iste.');
  end if;

  begin
    insert into reh_profiller (auth_id, rol, ad_soyad, eposta, okul_id, sinif, sube, okul_no, onayli)
    values (auth.uid(), 'ogrenci', trim(p_ad_soyad),
            (select email from auth.users where id = auth.uid()),
            o.id, p_sinif, upper(trim(p_sube)),
            nullif(trim(coalesce(p_okul_no, '')), ''), true);
  exception when unique_violation then
    return json_build_object('hata',
      'Bu okul numarası bu okulda zaten kayıtlı. Numaranı kontrol et.');
  end;

  return json_build_object('ok', true, 'okul_adi', o.ad);
end $$;

create or replace function reh_rehber_kayit(
  p_ad_soyad text, p_okul_adi text, p_il text default null, p_ilce text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  mevcut reh_profiller%rowtype;
begin
  if auth.uid() is null then
    return json_build_object('hata', 'Önce hesabını oluşturman gerekiyor.');
  end if;

  select * into mevcut from reh_profiller where auth_id = auth.uid();
  if found then
    return json_build_object('hata', 'Bu hesap zaten kayıtlı.');
  end if;

  if coalesce(trim(p_ad_soyad), '') = '' or coalesce(trim(p_okul_adi), '') = '' then
    return json_build_object('hata', 'Ad soyad ve okul adı boş olamaz.');
  end if;

  -- Okul kaydı onaya kadar pasif durur, kodu da onayda üretilir.
  insert into reh_profiller (auth_id, rol, ad_soyad, eposta, istenen_okul, onayli)
  values (auth.uid(), 'rehber', trim(p_ad_soyad),
          (select email from auth.users where id = auth.uid()),
          trim(p_okul_adi) ||
            case when coalesce(trim(p_il), '') <> '' then ' (' || trim(p_il) ||
              case when coalesce(trim(p_ilce), '') <> '' then ' / ' || trim(p_ilce) else '' end ||
              ')' else '' end,
          false);

  return json_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- 6. ORTAK: KENDİ DURUMUNU SORMA
--    Giriş yapan herkes hangi rolde olduğunu ve ne yapabileceğini buradan öğrenir.
-- ---------------------------------------------------------------------

create or replace function reh_durumum()
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p reh_profiller%rowtype;
  o reh_okullar%rowtype;
  y reh_envanter_yanitlari%rowtype;
begin
  if auth.uid() is null then
    return json_build_object('rol', null);
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

-- ---------------------------------------------------------------------
-- 7. ÖĞRENCİ: CEVAP KAYDI
--    Tamamlanmış envanter bir daha değişmez, yetenek testinin saati
--    sunucuda başlar. İstemci ne gönderirse göndersin bu ikisi korunur.
-- ---------------------------------------------------------------------

create or replace function reh_envanter_kaydet(
  p_cevaplar jsonb, p_yetenek_basladi boolean default false)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  oid        uuid;
  eski       reh_envanter_yanitlari%rowtype;
  yeni       jsonb := coalesce(p_cevaplar, '{}'::jsonb);
  eski_bitti jsonb := '{}'::jsonb;
  yeni_bitti jsonb := '{}'::jsonb;
  anahtar    text;
  bas        timestamptz;
begin
  select id into oid from reh_profiller where auth_id = auth.uid() and rol = 'ogrenci';
  if not found then
    return json_build_object('hata', 'Bu işlem için öğrenci hesabıyla giriş yapman gerekiyor.');
  end if;

  select * into eski from reh_envanter_yanitlari where ogrenci_id = oid;

  if found then
    eski_bitti := coalesce(eski.cevaplar -> 'bitti', '{}'::jsonb);
    yeni_bitti := coalesce(yeni -> 'bitti', '{}'::jsonb);

    foreach anahtar in array array['kisilik', 'ilgi', 'deger', 'beceri', 'yetenek'] loop
      if coalesce((eski_bitti ->> anahtar)::boolean, false) then
        yeni := jsonb_set(yeni, array[anahtar],
                          coalesce(eski.cevaplar -> anahtar, '{}'::jsonb), true);
        yeni_bitti := jsonb_set(yeni_bitti, array[anahtar], 'true'::jsonb, true);
      end if;
    end loop;

    yeni := jsonb_set(yeni, '{bitti}', yeni_bitti, true);
    bas := eski.yetenek_baslangic;
  end if;

  if bas is null and p_yetenek_basladi then
    bas := now();
  end if;

  if bas is not null then
    yeni := jsonb_set(yeni, '{yetenek_baslangic}', to_jsonb(bas), true);
  else
    yeni := yeni - 'yetenek_baslangic';
  end if;

  insert into reh_envanter_yanitlari (ogrenci_id, cevaplar, yetenek_baslangic, guncellendi)
  values (oid, yeni, bas, now())
  on conflict (ogrenci_id) do update set
    cevaplar          = excluded.cevaplar,
    yetenek_baslangic = excluded.yetenek_baslangic,
    guncellendi       = now();

  return json_build_object('ok', true, 'cevaplar', yeni);
end $$;

-- ---------------------------------------------------------------------
-- 8. REHBER ÖĞRETMEN
-- ---------------------------------------------------------------------

-- Kendi okulunun öğrencileri, artı herkese açık örnek sınıf.
-- Profil hesabı tarayıcıda puanlama.js ile yapılır, böylece rehberin
-- gördüğü rapor ile öğrencinin gördüğü aynı koddan çıkar.
create or replace function reh_rehber_ogrenciler()
returns table (
  ogrenci_id  uuid,
  ad_soyad    text,
  sinif       smallint,
  sube        text,
  okul_no     text,
  demo        boolean,
  cevaplar    jsonb,
  guncellendi timestamptz
) language plpgsql security definer set search_path = public, extensions as $$
begin
  if not reh_rehber_mi() then
    raise exception 'Hesabın henüz onaylanmadı ya da rehber öğretmen değilsin.';
  end if;
  return query
    select p.id, p.ad_soyad, p.sinif, p.sube, p.okul_no, p.demo,
           coalesce(y.cevaplar, '{}'::jsonb), y.guncellendi
    from reh_profiller p
    left join reh_envanter_yanitlari y on y.ogrenci_id = p.id
    where p.rol = 'ogrenci'
      and (p.okul_id = reh_benim_okulum()
           or p.okul_id in (select id from reh_okullar where demo))
    order by p.demo, p.sinif, p.sube,
             nullif(regexp_replace(coalesce(p.okul_no, ''), '\D', '', 'g'), '')::bigint
               nulls last,
             p.ad_soyad;
end $$;

-- Yanlış anlayıp yarıda bırakan ya da sehven bitiren öğrenci için.
-- Silmez, yalnız kilidi kaldırır. Örnek sınıfa dokunulamaz.
create or replace function reh_envanter_ac(p_ogrenci_id uuid, p_envanter text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p reh_profiller%rowtype;
  y reh_envanter_yanitlari%rowtype;
  temiz jsonb;
begin
  select * into p from reh_profiller where id = p_ogrenci_id and rol = 'ogrenci';
  if not found then
    return json_build_object('hata', 'Bu öğrencinin kaydı yok.');
  end if;

  if not (reh_yonetici_mi() or (reh_rehber_mi() and p.okul_id = reh_benim_okulum())) then
    raise exception 'Yetkisiz işlem.';
  end if;

  if p.demo then
    return json_build_object('hata', 'Örnek sınıftaki kayıtlar değiştirilemez.');
  end if;

  if p_envanter not in ('kisilik', 'ilgi', 'deger', 'beceri', 'yetenek') then
    return json_build_object('hata', 'Bilinmeyen envanter: ' || p_envanter);
  end if;

  select * into y from reh_envanter_yanitlari where ogrenci_id = p_ogrenci_id;
  if not found then
    return json_build_object('hata', 'Bu öğrenci henüz hiçbir envantere başlamamış.');
  end if;

  temiz := jsonb_set(y.cevaplar, '{bitti}',
             coalesce(y.cevaplar -> 'bitti', '{}'::jsonb) - p_envanter, true);

  -- Yetenek testi yeniden açılıyorsa süre de sıfırlanır, yoksa öğrenci
  -- süresi dolmuş bir teste geri dönmüş olur.
  if p_envanter = 'yetenek' then
    temiz := temiz - 'yetenek_baslangic';
    update reh_envanter_yanitlari set cevaplar = temiz, yetenek_baslangic = null,
      guncellendi = now() where ogrenci_id = p_ogrenci_id;
  else
    update reh_envanter_yanitlari set cevaplar = temiz, guncellendi = now()
      where ogrenci_id = p_ogrenci_id;
  end if;

  return json_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- 9. YÖNETİCİ
-- ---------------------------------------------------------------------

create or replace function reh_yonetici_rehberler()
returns table (
  profil_id    uuid,
  ad_soyad     text,
  eposta       text,
  istenen_okul text,
  onayli       boolean,
  okul_id      uuid,
  okul_adi     text,
  okul_kodu    text,
  ogrenci_sayisi bigint,
  eklendi      timestamptz
) language plpgsql security definer set search_path = public, extensions as $$
begin
  if not reh_yonetici_mi() then
    raise exception 'Yetkisiz işlem.';
  end if;
  return query
    select p.id, p.ad_soyad, p.eposta, p.istenen_okul, p.onayli,
           p.okul_id, o.ad, o.kod,
           (select count(*) from reh_profiller s
             where s.rol = 'ogrenci' and s.okul_id = p.okul_id and not s.demo),
           p.eklendi
    from reh_profiller p
    left join reh_okullar o on o.id = p.okul_id
    where p.rol = 'rehber'
    order by p.onayli, p.eklendi desc;
end $$;

-- Onay. p_okul_id verilirse rehber var olan bir okula bağlanır, verilmezse
-- istediği okul açılır ve kodu üretilir.
create or replace function reh_yonetici_onayla(p_profil_id uuid, p_okul_id uuid default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p reh_profiller%rowtype;
  o reh_okullar%rowtype;
  yeni_id uuid;
  ad_parca text;
begin
  if not reh_yonetici_mi() then
    raise exception 'Yetkisiz işlem.';
  end if;

  select * into p from reh_profiller where id = p_profil_id and rol = 'rehber';
  if not found then
    return json_build_object('hata', 'Rehber öğretmen kaydı bulunamadı.');
  end if;

  if p_okul_id is not null then
    select * into o from reh_okullar where id = p_okul_id;
    if not found then
      return json_build_object('hata', 'Seçilen okul bulunamadı.');
    end if;
    if o.demo then
      return json_build_object('hata', 'Örnek okula rehber bağlanamaz.');
    end if;
    yeni_id := o.id;
  else
    ad_parca := coalesce(nullif(trim(p.istenen_okul), ''), p.ad_soyad || ' okulu');
    insert into reh_okullar (kod, ad, aktif) values (reh_okul_kodu_uret(), ad_parca, true)
    returning id into yeni_id;
  end if;

  update reh_profiller set onayli = true, okul_id = yeni_id where id = p.id;

  select * into o from reh_okullar where id = yeni_id;
  return json_build_object('ok', true, 'okul_adi', o.ad, 'okul_kodu', o.kod);
end $$;

-- Onayı geri alır. Okul ve öğrenciler silinmez, rehber panele giremez olur.
create or replace function reh_yonetici_onay_kaldir(p_profil_id uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not reh_yonetici_mi() then
    raise exception 'Yetkisiz işlem.';
  end if;
  update reh_profiller set onayli = false where id = p_profil_id and rol = 'rehber';
  if not found then
    return json_build_object('hata', 'Rehber öğretmen kaydı bulunamadı.');
  end if;
  return json_build_object('ok', true);
end $$;

create or replace function reh_yonetici_okullar()
returns table (
  okul_id        uuid,
  kod            text,
  ad             text,
  il             text,
  aktif          boolean,
  demo           boolean,
  rehber_sayisi  bigint,
  ogrenci_sayisi bigint,
  biten_sayisi   bigint,
  eklendi        timestamptz
) language plpgsql security definer set search_path = public, extensions as $$
begin
  if not reh_yonetici_mi() then
    raise exception 'Yetkisiz işlem.';
  end if;
  return query
    select o.id, o.kod, o.ad, o.il, o.aktif, o.demo,
           (select count(*) from reh_profiller r where r.rol = 'rehber' and r.okul_id = o.id),
           (select count(*) from reh_profiller s where s.rol = 'ogrenci' and s.okul_id = o.id),
           (select count(*) from reh_profiller s
              join reh_envanter_yanitlari y on y.ogrenci_id = s.id
             where s.rol = 'ogrenci' and s.okul_id = o.id
               and (select count(*) from jsonb_object_keys(
                      coalesce(y.cevaplar -> 'bitti', '{}'::jsonb))) = 5),
           o.eklendi
    from reh_okullar o
    order by o.demo, o.ad;
end $$;

-- Bütün öğrenciler. p_okul_id verilirse yalnız o okul.
create or replace function reh_yonetici_ogrenciler(p_okul_id uuid default null)
returns table (
  ogrenci_id  uuid,
  ad_soyad    text,
  sinif       smallint,
  sube        text,
  okul_no     text,
  eposta      text,
  demo        boolean,
  okul_id     uuid,
  okul_adi    text,
  okul_kodu   text,
  cevaplar    jsonb,
  guncellendi timestamptz
) language plpgsql security definer set search_path = public, extensions as $$
begin
  if not reh_yonetici_mi() then
    raise exception 'Yetkisiz işlem.';
  end if;
  return query
    select p.id, p.ad_soyad, p.sinif, p.sube, p.okul_no, p.eposta, p.demo,
           p.okul_id, o.ad, o.kod,
           coalesce(y.cevaplar, '{}'::jsonb), y.guncellendi
    from reh_profiller p
    left join reh_okullar o on o.id = p.okul_id
    left join reh_envanter_yanitlari y on y.ogrenci_id = p.id
    where p.rol = 'ogrenci'
      and (p_okul_id is null or p.okul_id = p_okul_id)
    order by o.ad, p.sinif, p.sube,
             nullif(regexp_replace(coalesce(p.okul_no, ''), '\D', '', 'g'), '')::bigint
               nulls last,
             p.ad_soyad;
end $$;

-- Okulun kodunu yeniler. Kod sızdıysa eski kodla kimse kayıt olamaz.
create or replace function reh_yonetici_kod_yenile(p_okul_id uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  yeni text;
begin
  if not reh_yonetici_mi() then
    raise exception 'Yetkisiz işlem.';
  end if;
  yeni := reh_okul_kodu_uret();
  update reh_okullar set kod = yeni where id = p_okul_id and not demo;
  if not found then
    return json_build_object('hata', 'Okul bulunamadı ya da örnek okul.');
  end if;
  return json_build_object('ok', true, 'kod', yeni);
end $$;

-- Yöneticiyi atar. SQL Editor'dan çalıştırılır, panelden çağrılamaz.
create or replace function reh_yonetici_ata(p_eposta text, p_ad_soyad text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  k uuid;
begin
  select id into k from auth.users where lower(email) = lower(trim(p_eposta));
  if not found then
    raise exception 'Bu e-postayla bir kullanıcı yok. Önce Authentication > Users ekranından hesabı aç.';
  end if;

  insert into reh_profiller (auth_id, rol, ad_soyad, eposta, onayli)
  values (k, 'yonetici', trim(p_ad_soyad), lower(trim(p_eposta)), true)
  on conflict (auth_id) do update set rol = 'yonetici', onayli = true,
    ad_soyad = excluded.ad_soyad;

  return json_build_object('ok', true, 'eposta', lower(trim(p_eposta)));
end $$;

-- ---------------------------------------------------------------------
-- 10. YETKİLER
-- ---------------------------------------------------------------------

revoke all on function reh_okul_kodu_sor(text)                        from public;
revoke all on function reh_ogrenci_kayit(text, text, int, text, text) from public;
revoke all on function reh_rehber_kayit(text, text, text, text)       from public;
revoke all on function reh_durumum()                                  from public;
revoke all on function reh_envanter_kaydet(jsonb, boolean)            from public;
revoke all on function reh_rehber_ogrenciler()                        from public;
revoke all on function reh_envanter_ac(uuid, text)                    from public;
revoke all on function reh_yonetici_rehberler()                       from public;
revoke all on function reh_yonetici_onayla(uuid, uuid)                from public;
revoke all on function reh_yonetici_onay_kaldir(uuid)                 from public;
revoke all on function reh_yonetici_okullar()                         from public;
revoke all on function reh_yonetici_ogrenciler(uuid)                  from public;
revoke all on function reh_yonetici_kod_yenile(uuid)                  from public;
revoke all on function reh_yonetici_ata(text, text)                   from public;
revoke all on function reh_okul_kodu_uret()                           from public;

-- Kod sorgulaması kayıt formunda, giriş yapılmadan çalışır.
grant execute on function reh_okul_kodu_sor(text) to anon, authenticated;

grant execute on function reh_ogrenci_kayit(text, text, int, text, text) to authenticated;
grant execute on function reh_rehber_kayit(text, text, text, text)       to authenticated;
grant execute on function reh_durumum()                                  to authenticated;
grant execute on function reh_envanter_kaydet(jsonb, boolean)            to authenticated;
grant execute on function reh_rehber_ogrenciler()                        to authenticated;
grant execute on function reh_envanter_ac(uuid, text)                    to authenticated;
grant execute on function reh_yonetici_rehberler()                       to authenticated;
grant execute on function reh_yonetici_onayla(uuid, uuid)                to authenticated;
grant execute on function reh_yonetici_onay_kaldir(uuid)                 to authenticated;
grant execute on function reh_yonetici_okullar()                         to authenticated;
grant execute on function reh_yonetici_ogrenciler(uuid)                  to authenticated;
grant execute on function reh_yonetici_kod_yenile(uuid)                  to authenticated;

-- reh_yonetici_ata ve reh_okul_kodu_uret yalnız SQL Editor'dan, yani service role ile
-- çalışır. Panelden çağrılamaz.

-- ---------------------------------------------------------------------
-- 11. ÖRNEK SINIF
--     ornek-sinif.sql dosyasını bu betikten SONRA çalıştır.
--     Örnek okul burada açılıyor, öğrencileri o dosyada.
-- ---------------------------------------------------------------------

insert into reh_okullar (kod, ad, il, aktif, demo)
select 'ORNEK', 'Örnek Lise', 'Gösterim', true, true
where not exists (select 1 from reh_okullar where demo);

-- ---------------------------------------------------------------------
-- 12. SON ADIM — KENDİNİ YÖNETİCİ YAP
--     Authentication > Users ekranından kendine bir kullanıcı aç,
--     sonra alttaki satırın başındaki -- işaretini kaldırıp çalıştır.
-- ---------------------------------------------------------------------

select reh_yonetici_ata('eserakkaba@hotmail.com.tr', 'Eser Akkaba');

notify pgrst, 'reload schema';
