-- =====================================================================
--  REHBERLİK — YÖNETİCİ DOĞRUDAN OKUL AÇSIN
--  20 Eylül 2026
--
--  Neden: Okul, yalnız bir rehber öğretmen onaylanırken doğuyordu
--  (reh_yonetici_onayla). Kendi öğrencisi olan yönetici için bu dolambaçlı
--  yoldu: kendine ikinci bir hesap açıp rehber öğretmen olarak kaydolması,
--  sonra kendi kendini onaylaması gerekiyordu.
--
--  Bu dosya iki şey ekler:
--    reh_yonetici_okul_ekle     yönetici doğrudan okul açar, kod üretilir
--    reh_yonetici_okul_sahiplen bir okulu "kendi okulum" diye işaretler
--
--  Kimin okulu olduğu reh_profiller.okul_id ile tutulur; o sütun zaten var
--  ve rehber öğretmen için de aynı işi görüyor. Yeni sütun eklenmedi.
--
--  Supabase panelinde SQL Editor > New query içine yapıştırıp Run.
--  kurulum.sql ÇALIŞTIRILDIKTAN SONRA çalıştırılır. Tekrar çalıştırmak
--  zararsızdır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. OKUL AÇ
-- ---------------------------------------------------------------------

create or replace function reh_yonetici_okul_ekle(
  p_ad text, p_il text default null, p_ilce text default null,
  p_benim boolean default false)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  o reh_okullar%rowtype;
begin
  if not reh_yonetici_mi() then
    raise exception 'Yetkisiz işlem.';
  end if;

  if coalesce(trim(p_ad), '') = '' then
    return json_build_object('hata', 'Okul adı boş olamaz.');
  end if;
  if length(trim(p_ad)) > 120 then
    return json_build_object('hata', 'Okul adı çok uzun.');
  end if;

  -- Aynı adda etkin okul varsa ikincisini açma: iki ayrı kod dolaşıma
  -- girerse hangisinin kime ait olduğu anlaşılmaz.
  if exists (select 1 from reh_okullar
               where aktif and not demo and lower(ad) = lower(trim(p_ad))) then
    return json_build_object('hata', 'Bu adda etkin bir okul zaten var.');
  end if;

  insert into reh_okullar (kod, ad, il, ilce, aktif)
  values (reh_okul_kodu_uret(), trim(p_ad),
          nullif(trim(coalesce(p_il, '')), ''),
          nullif(trim(coalesce(p_ilce, '')), ''),
          true)
  returning * into o;

  if coalesce(p_benim, false) then
    update reh_profiller set okul_id = o.id where auth_id = auth.uid();
  end if;

  return json_build_object('ok', true, 'okul_id', o.id, 'kod', o.kod, 'ad', o.ad);
end $$;

-- ---------------------------------------------------------------------
-- 2. KENDİ OKULUM
--     p_okul_id null geçilirse işaret kaldırılır.
-- ---------------------------------------------------------------------

create or replace function reh_yonetici_okul_sahiplen(p_okul_id uuid default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  o reh_okullar%rowtype;
begin
  if not reh_yonetici_mi() then
    raise exception 'Yetkisiz işlem.';
  end if;

  if p_okul_id is null then
    update reh_profiller set okul_id = null where auth_id = auth.uid();
    return json_build_object('ok', true, 'okul_id', null);
  end if;

  select * into o from reh_okullar where id = p_okul_id;
  if not found then
    return json_build_object('hata', 'Okul bulunamadı.');
  end if;
  if o.demo then
    return json_build_object('hata', 'Örnek okul sahiplenilemez.');
  end if;

  update reh_profiller set okul_id = o.id where auth_id = auth.uid();
  return json_build_object('ok', true, 'okul_id', o.id, 'kod', o.kod, 'ad', o.ad);
end $$;

-- ---------------------------------------------------------------------
-- 3. YETKİLER
--     Diğer yönetici uçlarıyla aynı düzen: public'ten alınır, yalnız
--     giriş yapmış kullanıcıya verilir; içerideki reh_yonetici_mi()
--     denetimi asıl kapıdır.
-- ---------------------------------------------------------------------

revoke all on function reh_yonetici_okul_ekle(text, text, text, boolean) from public;
revoke all on function reh_yonetici_okul_sahiplen(uuid)                  from public;
revoke all on function reh_benim_okulum()                                from public;

grant execute on function reh_yonetici_okul_ekle(text, text, text, boolean) to authenticated;
grant execute on function reh_yonetici_okul_sahiplen(uuid)                  to authenticated;
grant execute on function reh_benim_okulum()                                to authenticated;

notify pgrst, 'reload schema';
