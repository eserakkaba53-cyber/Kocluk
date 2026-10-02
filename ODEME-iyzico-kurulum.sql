-- ═══════════════════════════════════════════════════════════════════
--  BİYOSER: KARTLA ÖDEME (iyzico) VE YILLIK LİSANSIN KENDİLİĞİNDEN AÇILMASI
--                                                           (2 Eki 2026)
--
--  NE YAPACAKSIN: Tamamını kopyala, Supabase SQL Editor'e yapıştır, RUN.
--  Tekrar çalıştırmak zararsız (if not exists / or replace / drop if exists).
--  Edge Function'lar (supabase/functions/odeme-baslat ve odeme-bildirim) bu
--  dosyadaki tabloya ve fonksiyonlara dayanır; önce bu dosya kurulur.
--  Çalışan son sorgu (7. bölüm, DENETİM) tek satır döner; beklenen değerler
--  yanında yazılı. Ondan sonraki test ve mutabakat blokları yorum satırıdır.
--
--  NEDEN
--  Bugün koç paketi WhatsApp + havale ile alıyor, yönetici koc_guncelle ile
--  elle açıyor. Kartla ödemede para iyzico'da tahsil edilir. Lisansı açma
--  kararı tarayıcıya bırakılsaydı ödeme sayfasından dönmeyen koç açıkta
--  kalırdı, elle yazılmış sahte bir "başarılı" isteği de lisans açardı.
--  Bu yüzden:
--    * Tutarı sunucu yazar (paket_fiyat). İstemci yalnız paket kodunu yollar.
--    * Lisansı yalnız odeme_onayla açar; onu yalnız service_role çağırabilir.
--      Edge Function sonucu iyzico'nun sorgu API'sinden okur, sonra çağırır.
--    * Aynı ödeme iki kez gelirse (çift callback, kontrol ile callback
--      yarışı) satır kilidi ikincisine "zaten ödendi" der; süre bir kez uzar.
--
--  DURUMLAR (odemeler.durum)
--    bekliyor   kayıt açıldı. Ödeme sürüyor, terk edildi ya da iyzico
--               reddetti (iyzico'nun mesajı hata sütununda).
--    odendi     iyzico SUCCESS dedi, tutar ve para birimi tuttu, lisans uzadı.
--    basarisiz  iyzico tahsil etti ama tutar ya da para birimi kayıtla
--               tutmadı. ELLE İNCELE, gerekirse iade et; iyzico ödeme no
--               hata sütununda yazar.
--  iyzico'nun reddettiği deneme satırı "bekliyor"da bırakır: aynı ödeme
--  formunda başka kartla yeniden denenirse ikinci sonuç da işlenebilsin.
--
--  LİSANS HESABI (koc_guncelle ile aynı sütunlar)
--    yeni bitiş = max(mevcut bitiş, bugün) + 1 yıl, paket = alınan paket,
--    deneme_bitis = null. aktif ve öteki sütunlara dokunulmaz.
--    Referans ödülünü tg_referans_odul kendisi verir (ücretsizden ücretliye
--    geçişte). tg_koclar_sutun_kilidi engellemez: fonksiyon sahibi postgres
--    rolüyle çalışır, kilit yalnız authenticated/anon isteklerine bakar.
--
--  YETKİLER (her yeni fonksiyonun ardında revoke var; anon sayısı 17 kalır)
--    paket_fiyat    yalnız içeriden çağrılır (public ve anon'dan alındı)
--    odeme_hazirla  authenticated
--    odeme_durum    authenticated
--    odeme_onayla   YALNIZ service_role
--
--  GERİ ALMAK İÇİN (ödeme kayıtları da silinir):
--    drop function if exists public.odeme_durum(uuid);
--    drop function if exists public.odeme_onayla(uuid, text, numeric, text);
--    drop function if exists public.odeme_hazirla(text);
--    drop function if exists public.paket_fiyat(text);
--    drop table if exists public.odemeler;
-- ═══════════════════════════════════════════════════════════════════


-- ── 1) Tablo ────────────────────────────────────────────────────────
create table if not exists public.odemeler (
  id                 uuid primary key default gen_random_uuid(),
  koc_id             uuid not null references public.koclar(id) on delete cascade,
  paket              text not null,
  tutar              numeric(10,2) not null,              -- KDV dahil, TL
  para               text not null default 'TRY',
  durum              text not null default 'bekliyor'
                     check (durum in ('bekliyor','odendi','basarisiz')),
  saglayici          text not null default 'iyzico',
  token              text,                                -- iyzico ödeme formu jetonu
  saglayici_odeme_id text unique,                         -- iyzico paymentId
  hata               text,
  olusma             timestamptz not null default now(),
  odeme_zamani       timestamptz,
  lisans_onceki      date,
  lisans_sonraki     date
);

create index if not exists odemeler_koc_olusma on public.odemeler (koc_id, olusma desc);
-- iyzico dönüşü satırı jetonla bulur; bir jeton tek satıra ait olmalı.
create unique index if not exists odemeler_token_tekil on public.odemeler (token);

-- ── 2) Erişim: koç kendi satırını, yönetici hepsini OKUR; kimse YAZAMAZ ─
--  Yazanlar: odeme_hazirla (SECURITY DEFINER) ve Edge Function'ın
--  service_role istemcisi (RLS'i aşar). insert/update/delete politikası yok.
alter table public.odemeler enable row level security;

drop policy if exists odeme_oku on public.odemeler;
create policy odeme_oku on public.odemeler as permissive for select to authenticated
  using (koc_id = (select auth.uid()) or (select public.yonetici_mi()));

revoke all on table public.odemeler from anon, authenticated;
grant select on table public.odemeler to authenticated;
grant select, update on table public.odemeler to service_role;

-- ── 3) Fiyat: tutarların TEK kaynağı ─────────────────────────────────
--  Çevrim içi satılan üç paket. okul (19.999 TL) elden satılır; deneme ve
--  ozel satılmaz. Bunlar için null döner, odeme_hazirla reddeder.
create or replace function public.paket_fiyat(p text)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case p
    when 'ogrenci' then 99.00     -- Koçsuz Öğrenci Paketi
    when 'koc'     then 449.00    -- Öğretmen Paketi
    when 'sinif'   then 2999.00   -- Sınıf Paketi
  end;
$$;
revoke execute on function public.paket_fiyat(text) from public, anon;

-- ── 4) odeme_hazirla: koç paneli (Edge Function üzerinden, koçun JWT'siyle)
--  Ödeyeni auth.uid() belirler, tutarı paket_fiyat. İstemci tutar göndermez.
create or replace function public.odeme_hazirla(p_paket text)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid   uuid := auth.uid();
  v_paket text := lower(trim(coalesce(p_paket, '')));
  v_tutar numeric(10,2);
  v_sira  text[] := array['ogrenci','koc','sinif','okul','ozel'];
  k       public.koclar%rowtype;
  v_id    uuid;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'hata', 'Önce giriş yapmalısın.');
  end if;

  v_tutar := public.paket_fiyat(v_paket);
  if v_tutar is null then
    return json_build_object('ok', false, 'hata', 'Bu paket çevrim içi satılmıyor.');
  end if;

  select * into k from public.koclar where id = v_uid;
  if not found then
    return json_build_object('ok', false, 'hata', 'Hesap kaydın bulunamadı.');
  end if;
  -- Kapalı hesap ödese de giremez (lisans_gecerli aktif'e bakar); para alınmasın.
  if not k.aktif then
    return json_build_object('ok', false, 'hata', 'Hesabın kapalı. Ödeme yapmadan önce bize yaz.');
  end if;

  -- Küçük pakete geçiş: süre geçerliyken paket küçülürse öğrenci kotası düşer.
  -- 'ogretmen' eski kayıtlarda 40 öğrencilik paketin adı, sinif ile aynı basamak.
  -- lisans_bitis ve deneme_bitis ikisi de boşsa hesap süresizdir (lisans_gecerli).
  if coalesce(array_position(v_sira, case k.paket when 'ogretmen' then 'sinif' else k.paket end), 0)
       > array_position(v_sira, v_paket)
     and (k.lisans_bitis >= current_date or (k.lisans_bitis is null and k.deneme_bitis is null)) then
    return json_build_object('ok', false, 'hata',
      'Mevcut paketin daha geniş. Süren bitince daha küçük pakete geçebilirsin.');
  end if;

  -- Her çağrı iyzico'da bir ödeme formu açar; döngüye giren istemciyi durdur.
  if (select count(*) from public.odemeler
       where koc_id = v_uid and olusma > now() - interval '1 hour') >= 10 then
    return json_build_object('ok', false, 'hata',
      'Son bir saatte çok fazla ödeme denemesi var. Biraz sonra yeniden dene.');
  end if;

  insert into public.odemeler (koc_id, paket, tutar)
  values (v_uid, v_paket, v_tutar)
  returning id into v_id;

  return json_build_object(
    'ok',        true,
    'odeme_id',  v_id,
    'koc_id',    v_uid,
    'paket',     v_paket,
    'paket_adi', case v_paket
                   when 'ogrenci' then 'Koçsuz Öğrenci Paketi'
                   when 'koc'     then 'Öğretmen Paketi'
                   when 'sinif'   then 'Sınıf Paketi'
                 end,
    'tutar',     v_tutar::text,          -- "449.00": iyzico'ya metin olarak gider
    'eposta',    (select u.email from auth.users u where u.id = v_uid),
    'ad',        k.ad,
    'telefon',   k.telefon);
end $fn$;
revoke execute on function public.odeme_hazirla(text) from public, anon;
grant execute on function public.odeme_hazirla(text) to authenticated;

-- ── 5) odeme_onayla: YALNIZ Edge Function (service_role) ──────────────
--  p_tutar ve p_para iyzico'nun sorgu yanıtından gelir (paidPrice, currency);
--  kayıttakiyle satır kilidi altında, numeric olarak karşılaştırılır.
create or replace function public.odeme_onayla(
  p_odeme uuid, p_saglayici_odeme_id text, p_tutar numeric, p_para text default 'TRY')
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  o       public.odemeler%rowtype;
  v_once  date;
  v_sonra date;
  v_neden text;
begin
  select * into o from public.odemeler where id = p_odeme for update;
  if not found then
    return json_build_object('ok', false, 'hata', 'Ödeme kaydı bulunamadı.');
  end if;

  -- İkinci geliş: süre yeniden uzatılmaz, ilk sonucun aynısı döner.
  if o.durum = 'odendi' then
    return json_build_object('ok', true, 'zaten', true,
                             'paket', o.paket, 'lisans_bitis', o.lisans_sonraki);
  end if;

  -- "is distinct from": null tutar ya da para birimi de reddedilsin
  -- (null <> x sonucu null olur ve if onu yanlış sayıp geçerdi).
  v_neden := case
    when o.durum <> 'bekliyor' then
      'Kayıt bekliyor durumunda değildi (' || o.durum || ').'
    when nullif(trim(p_saglayici_odeme_id), '') is null then
      'iyzico ödeme numarası boş geldi.'
    when p_tutar is distinct from o.tutar then
      'Tahsil edilen tutar (' || coalesce(p_tutar::text, 'boş') || ') kayıttakiyle ('
        || o.tutar || ') aynı değil.'
    when p_para is distinct from o.para then
      'Para birimi (' || coalesce(p_para, 'boş') || ') kayıttakiyle (' || o.para || ') aynı değil.'
  end;
  if v_neden is not null then
    update public.odemeler
       set durum = 'basarisiz',
           hata  = 'ELLE İNCELE, iyzico ödeme no ' || coalesce(p_saglayici_odeme_id, '-') || ': ' || v_neden
     where id = o.id;
    return json_build_object('ok', false, 'hata', v_neden);
  end if;

  -- Koç satırı da kilitlenir: aynı koçun iki ödemesi aynı anda onaylanırsa
  -- ikincisi birincinin yazdığı bitişi okusun (süre iki kez uzasın).
  select lisans_bitis into v_once from public.koclar where id = o.koc_id for update;
  if not found then
    return json_build_object('ok', false, 'hata', 'Hesap bulunamadı.');
  end if;
  v_sonra := (greatest(coalesce(v_once, current_date), current_date) + interval '1 year')::date;

  update public.koclar
     set paket        = o.paket,
         lisans_bitis = v_sonra,
         deneme_bitis = null
   where id = o.koc_id;

  update public.odemeler
     set durum              = 'odendi',
         odeme_zamani       = now(),
         saglayici_odeme_id = p_saglayici_odeme_id,
         lisans_onceki      = v_once,
         lisans_sonraki     = v_sonra,
         hata               = null
   where id = o.id;

  return json_build_object('ok', true, 'paket', o.paket, 'lisans_bitis', v_sonra);
end $fn$;
revoke execute on function public.odeme_onayla(uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.odeme_onayla(uuid, text, numeric, text) to service_role;

-- ── 6) odeme_durum: panel dönüşte sorar (yalnız kendi ödemesi) ────────
create or replace function public.odeme_durum(p_odeme uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select json_build_object(
              'ok',           true,
              'durum',        o.durum,
              'paket',        o.paket,
              'tutar',        o.tutar,
              'hata',         o.hata,
              'odeme_zamani', o.odeme_zamani,
              'lisans_bitis', o.lisans_sonraki)
       from public.odemeler o
      where o.id = p_odeme and o.koc_id = auth.uid()),
    json_build_object('ok', false, 'hata', 'Ödeme bulunamadı.'));
$$;
revoke execute on function public.odeme_durum(uuid) from public, anon;
grant execute on function public.odeme_durum(uuid) to authenticated;

-- PostgREST yeni fonksiyonları hemen görsün.
notify pgrst, 'reload schema';

-- ── 7) DENETİM (salt okur) ───────────────────────────────────────────
select
  has_function_privilege('anon',          'public.odeme_hazirla(text)', 'execute')                  as anon_hazirlar,      -- false
  has_function_privilege('authenticated', 'public.odeme_hazirla(text)', 'execute')                  as giris_hazirlar,     -- true
  has_function_privilege('authenticated', 'public.odeme_onayla(uuid,text,numeric,text)', 'execute') as giris_onaylar,      -- false
  has_function_privilege('service_role',  'public.odeme_onayla(uuid,text,numeric,text)', 'execute') as servis_onaylar,     -- true
  has_function_privilege('anon',          'public.odeme_durum(uuid)', 'execute')                    as anon_durum_okur,    -- false
  (select relrowsecurity from pg_class where oid = 'public.odemeler'::regclass)                      as rls_acik;           -- true


-- ═══════════════════════════════════════════════════════════════════
--  DAVRANIŞ TESTİ (isteğe bağlı; hepsi geri alınır, son satırdaki hata bilerek)
--  Yönetici olmayan bir koçu geçici olarak "denemede" durumuna getirir, onun
--  adına ödeme hazırlar, onaylar, tekrar onaylar, küçük paket ve eksik
--  tutar dener. raise exception her şeyi geri sarar; sonuç hata metnindedir.
-- ═══════════════════════════════════════════════════════════════════
-- do $$
-- declare
--   v_k uuid; v_id uuid; v_id2 uuid; r json; s text := ''; v_bitis date;
-- begin
--   select id into v_k from public.koclar where not yonetici and aktif limit 1;
--   if v_k is null then raise exception 'TEST: uygun koç yok'; end if;
--   update public.koclar set paket = 'deneme', lisans_bitis = null, deneme_bitis = current_date + 3
--    where id = v_k;
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_k, 'role', 'authenticated')::text, true);
--
--   r := public.odeme_hazirla('koc');      v_id := (r->>'odeme_id')::uuid;
--   s := s || 'hazirla koc: ' || (r->>'ok') || ' ' || (r->>'tutar');
--   r := public.odeme_hazirla('okul');     s := s || ' | okul: ' || (r->>'ok');
--   r := public.odeme_onayla(v_id, 'TEST-1', 449);
--   s := s || ' | onayla: ' || (r->>'ok') || ' ' || (r->>'lisans_bitis');
--   r := public.odeme_onayla(v_id, 'TEST-1', 449);
--   s := s || ' | tekrar: ' || (r->>'ok') || ' zaten=' || coalesce(r->>'zaten', '-') || ' ' || (r->>'lisans_bitis');
--   select lisans_bitis into v_bitis from public.koclar where id = v_k;
--   s := s || ' | koclar: ' || v_bitis;
--   r := public.odeme_hazirla('ogrenci');  s := s || ' | kucuk paket: ' || (r->>'ok');
--   r := public.odeme_hazirla('sinif');    v_id2 := (r->>'odeme_id')::uuid;
--   r := public.odeme_onayla(v_id2, 'TEST-2', 449);
--   s := s || ' | eksik tutar: ' || (r->>'ok') || ' '
--          || (select durum from public.odemeler where id = v_id2);
--   raise exception 'TEST %', s;
-- end $$;
-- Beklenen (B = bugün + 1 yıl):
--   hazirla koc: true 449.00 | okul: false | onayla: true B | tekrar: true zaten=true B
--   | koclar: B | kucuk paket: false | eksik tutar: false basarisiz


-- ═══════════════════════════════════════════════════════════════════
--  GÜNLÜK MUTABAKAT (isteğe bağlı, salt okur)
--  A) Gün toplamı iyzico üye işyeri panelindeki başarılı işlemlerin aynı
--     gün toplamıyla birebir tutmalı. iyzico'da fazla varsa para alınmış
--     ama lisans açılmamış bir ödeme var: B ile bul.
--  B) basarisiz satırlar boş olmalı. 7 günden yeni "bekliyor" satırların
--     çoğu terk edilmiş formdur; iyzico panelinde karşılığı olan varsa
--     panelden kontrol ile ya da koc_guncelle ile açılır.
-- ═══════════════════════════════════════════════════════════════════
-- select (odeme_zamani at time zone 'Europe/Istanbul')::date as gun,
--        count(*) as adet, sum(tutar) as toplam_tl
--   from public.odemeler where durum = 'odendi'
--  group by 1 order by 1 desc limit 14;
--
-- select id, koc_id, paket, tutar, durum, olusma, hata
--   from public.odemeler
--  where durum = 'basarisiz'
--     or (durum = 'bekliyor' and token is not null
--         and olusma between now() - interval '7 days' and now() - interval '1 hour')
--  order by durum, olusma desc;
