-- ═══════════════════════════════════════════════════════════════════
-- HAFTALIK PROGRAM: 15 DAKİKALIK DİLİM (3 Eki 2026)
-- ───────────────────────────────────────────────────────────────────
-- program.js ızgarası 30 dakikalık dilimden 15 dakikalığa geçti
-- (günde 48 değil 96 satır). Yeni kayıt biçimi:
--   kapali : "g:d" ya da "g:d|SEBEP"   (iki nokta; d = 0-95, 15 dk)
--   bloklar: dilim15 (0-95) ve uzunluk15 (1-96); dilim/uzunluk yazılmaz
-- ESKİ BİÇİM DE KABUL EDİLİR: "g-d" (d = 0-47) ve dilim (0-47).
-- Neden: yayından sonra önbellekte eski sayfası açık kalan koç ya da
-- öğrenci bir süre eski biçimle yazmaya devam eder; bu kayıt
-- reddedilirse "kaydedilemedi" uyarısı alır. Yeni motor iki biçimi de
-- okur, eskiyi 15 dakikaya çevirir.
-- Kapalı dilim tavanı 336'dan 1008'e çıktı: 7 gün × 96 = 672 yeni
-- biçim, eski sayfanın eklediği eski biçimle karışık dizide 336 daha.
-- CREATE OR REPLACE yetkileri korur; GRANT/REVOKE gerekmez.
-- ═══════════════════════════════════════════════════════════════════

create or replace function program_kapali_yaz(p_ogr uuid, p_kapali jsonb)
returns void
language plpgsql security definer set search_path = public as $fn$
begin
  if not program_yetkim_var(p_ogr) then
    raise exception 'Bu öğrencinin programına erişimin yok.';
  end if;
  if jsonb_typeof(coalesce(p_kapali,'[]'::jsonb)) <> 'array' then
    raise exception 'Kapalı saat listesi dizi olmalı.';
  end if;
  if jsonb_array_length(coalesce(p_kapali,'[]'::jsonb)) > 1008 then
    raise exception 'En fazla 1008 dilim olabilir (7 gün × 96 çeyrek saat, eski kayıtla karışık).';
  end if;
  -- Her eleman "g:d" (15 dk, d 0-95) ya da eski "g-d" (30 dk, d 0-47),
  -- isteğe bağlı "|SEBEP" ile. Sebep etiketleri ASCII büyük harf.
  if exists (
    select 1
      from jsonb_array_elements(coalesce(p_kapali,'[]'::jsonb)) e
     where jsonb_typeof(e) <> 'string'
        or (e #>> '{}') !~ '^[0-6](-([0-9]|[1-3][0-9]|4[0-7])|:([0-9]|[1-8][0-9]|9[0-5]))([|][A-Z]{1,10})?$'
  ) then
    raise exception 'Kapalı saat verisi geçersiz.';
  end if;

  update ogrenciler
     set program = jsonb_set(
           jsonb_set(coalesce(program,'{}'::jsonb), '{kapali}',
                     coalesce(p_kapali,'[]'::jsonb), true),
           '{k_guncel}', to_jsonb(now()), true)
   where id = p_ogr;
end $fn$;

create or replace function program_bloklar_yaz(p_ogr uuid, p_bloklar jsonb)
returns void
language plpgsql security definer set search_path = public as $fn$
begin
  if not program_yetkim_var(p_ogr) then
    raise exception 'Bu öğrencinin programına erişimin yok.';
  end if;
  if jsonb_typeof(coalesce(p_bloklar,'[]'::jsonb)) <> 'array' then
    raise exception 'Blok listesi dizi olmalı.';
  end if;
  if jsonb_array_length(coalesce(p_bloklar,'[]'::jsonb)) > 500 then
    raise exception 'En fazla 500 blok olabilir.';
  end if;
  -- Boyut tavanı: tek çağrıyla satırı megabaytlarca jsonb ile şişirmeyi
  -- engeller (blok başına ~200 bayt × 500 ≈ 100 KB; 256 KB bol pay).
  if pg_column_size(p_bloklar) > 262144 then
    raise exception 'Blok verisi çok büyük.';
  end if;
  -- Her eleman nesne olmalı; gün/dilim verilmişse ızgaranın içinde kalmalı.
  -- dilim: eski 30 dk (0-47) · dilim15/uzunluk15: yeni 15 dk (0-95 / 1-96)
  if exists (
    select 1
      from jsonb_array_elements(coalesce(p_bloklar,'[]'::jsonb)) e
     where jsonb_typeof(e) <> 'object'
        or (jsonb_typeof(e->'gun')       = 'number' and (e->>'gun')::int       not between 0 and 6)
        or (jsonb_typeof(e->'dilim')     = 'number' and (e->>'dilim')::int     not between 0 and 47)
        or (jsonb_typeof(e->'dilim15')   = 'number' and (e->>'dilim15')::int   not between 0 and 95)
        or (jsonb_typeof(e->'uzunluk15') = 'number' and (e->>'uzunluk15')::int not between 1 and 96)
  ) then
    raise exception 'Blok verisi geçersiz.';
  end if;

  update ogrenciler
     set program = jsonb_set(
           jsonb_set(coalesce(program,'{}'::jsonb), '{bloklar}',
                     coalesce(p_bloklar,'[]'::jsonb), true),
           '{b_guncel}', to_jsonb(now()), true)
   where id = p_ogr;
end $fn$;

-- ── KONTROL ────────────────────────────────────────────────────────
-- Beklenen: t t t t t f f f f  (son dördü geçersiz)
-- select s, s ~ '^[0-6](-([0-9]|[1-3][0-9]|4[0-7])|:([0-9]|[1-8][0-9]|9[0-5]))([|][A-Z]{1,10})?$'
--   from unnest(array['0-14','3-30|OKUL','0:28','6:95|IZIN','0:9|OZEL','0:96','7:1','0-48','1:5x']) s;
-- Yetki değişmedi mi (anon için ikisi de false olmalı):
-- select has_function_privilege('anon','program_kapali_yaz(uuid,jsonb)','execute'),
--        has_function_privilege('anon','program_bloklar_yaz(uuid,jsonb)','execute');
