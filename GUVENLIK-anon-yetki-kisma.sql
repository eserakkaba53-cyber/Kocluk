-- =====================================================================
-- GİRİŞSİZ ÇAĞRILABİLEN FONKSİYONLARI KISMA (27 Eyl 2026)
-- ---------------------------------------------------------------------
-- Supabase güvenlik denetçisi (splinter 0028) giriş yapmamış birinin
-- (anon) 67 SECURITY DEFINER fonksiyonu çağırabildiğini gösterdi; aralarında
-- yonetici_koc_sil, yonetici_ogrenci_sil gibi yönetici fonksiyonları var.
-- Hepsinin içinde yetki denetimi var ve girişsiz denemelerde tuttu; ama tek
-- bir unutulmuş denetim her şeyi açar. Bu dosya ikinci bir kilit ekler:
-- giriş gerektiren fonksiyonlar anon için hiç çağrılamaz.
--
-- NEDEN "from public, anon": Postgres her yeni fonksiyona PUBLIC'e EXECUTE
-- verir; yalnız anon'dan geri almak yetmez, anon PUBLIC üzerinden yine
-- çağırır. PUBLIC'ten alınca giriş yapmış kullanıcıların (authenticated) izni
-- düşmesin diye, önceden izni olan her fonksiyonda authenticated'a açıkça
-- yeniden verilir. service_role (sunucu tarafı) da açıkça korunur.
--
-- DOKUNULMAYANLAR (anon'a açık kalır):
--   * Erişim kuralı (RLS) yardımcıları: kurallar sorguyu yapan rolün
--     yetkisiyle çalışır; anon'dan alınırsa girişsiz sorgular yetki hatası
--     verir. Kendileri yalnız "çağıran kim" sorusuna true/false döner.
--   * Giriş öncesi çağrılanlar: kullanim_sayilari (ana sayfa sayacı),
--     referans_gecerli_mi (koç kaydında referans kodu), reh_okul_kodu_sor
--     (rehberlik kaydında okul kodu), ogrenci_teshis (oturumu düşmüş
--     öğrencinin teşhis ekranı).
--   * Tetikleyici fonksiyonları da kısılır: tetikleyici çalışırken EXECUTE
--     yetkisi denetlenmez (yalnız tetikleyici kurulurken denetlenir).
--
-- İLERİSİ İÇİN (27 Eyl düzeltmesi): aşağıdaki varsayılan yetki değişikliği
-- yalnız Supabase'in anon'a verdiği şema düzeyindeki izni kaldırır. Postgres
-- her yeni fonksiyona PUBLIC üzerinden EXECUTE verir ve bu genel varsayılan
-- şema düzeyinde geri alınamaz; yani YENİ FONKSİYON YİNE ANON'A AÇIK DOĞAR.
-- Genel varsayılanı değiştirmedik: panelden kurulacak eklentilerin
-- fonksiyonlarını da kilitlerdi. Kural: her yeni fonksiyonun ardına
--   revoke execute on function ... from public, anon;
-- yaz (girişsiz çağrılması gerekiyorsa yazma). Denetim: aşağıdaki sorgu 17.
-- =====================================================================

do $$
declare
  r record;
  n int := 0;
  tut text[] := array[
    -- RLS yardımcıları
    'engelli_mi','kocum_mu','kocum_yazabilir','kota_var','lisans_gecerli',
    'ogrenci_var','ogrencim_mi','ogrencim_yazabilir','onay_tam',
    'oz_ben_ogrenci','oz_kocum','oz_kocum_mu','yonetici_mi',
    -- giriş öncesi
    'kullanim_sayilari','referans_gecerli_mi','reh_okul_kodu_sor','ogrenci_teshis'
  ];
begin
  for r in
    select p.oid::regprocedure as imza,
           has_function_privilege('authenticated', p.oid, 'execute') as auth_x
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public'
      and p.prokind = 'f'
      and has_function_privilege('anon', p.oid, 'execute')
      and not (p.proname = any (tut))
      and not exists (select 1 from pg_depend d            -- eklenti fonksiyonlarına dokunma
                      where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public, anon', r.imza);
    if r.auth_x then
      execute format('grant execute on function %s to authenticated', r.imza);
    end if;
    execute format('grant execute on function %s to service_role', r.imza);
    n := n + 1;
  end loop;
  raise notice 'anon yetkisi kaldirilan fonksiyon: %', n;
end $$;

-- Supabase'in şema düzeyinde anon'a verdiği varsayılanı kaldırır (PUBLIC
-- varsayılanı sürer; yukarıdaki "İLERİSİ İÇİN" notuna bak).
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon;

-- ---------------------------------------------------------------------
-- search_path sabitleme (splinter 0011): search_path'i sabit olmayan
-- fonksiyonlar, çağıranın arama yoluna göre farklı nesneyi çözebilir.
-- ---------------------------------------------------------------------
do $$
declare r record; n int := 0;
begin
  for r in
    select p.oid::regprocedure as imza
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public'
      and p.prokind in ('f','p')
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('alter function %s set search_path = public, extensions', r.imza);
    n := n + 1;
  end loop;
  raise notice 'search_path sabitlenen fonksiyon: %', n;
end $$;

-- ---------------------------------------------------------------------
-- DENETİM (kurulumdan sonra):
-- select count(*) filter (where has_function_privilege('anon', p.oid, 'execute')) as anon_acik,
--        count(*) filter (where has_function_privilege('authenticated', p.oid, 'execute')) as giris_acik
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.prokind = 'f';
-- Beklenen: anon_acik = 17, giris_acik öncekiyle aynı.
-- ---------------------------------------------------------------------
