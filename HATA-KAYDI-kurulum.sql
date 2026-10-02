-- =====================================================================
-- HATA KAYDI (2 Eki 2026)
-- ---------------------------------------------------------------------
-- Bir öğrencinin ya da koçun tarayıcısında yakalanmayan bir JavaScript
-- hatası çıktığında bunu ancak biri bize yazarsa öğreniyorduk. hata.js
-- yakalanmayan hataları ve yakalanmamış promise retlerini buraya yazar;
-- Yönetim sekmesindeki "Hatalar" kartı listeler, rozet sayar.
--
-- Aynı hata (aynı sayfa + mesaj + kaynak) tek satırda toplanır, sayacı
-- artar. "Çözüldü" işaretlenen hata yeniden görülürse yeniden açılır.
--
-- KİŞİSEL VERİ: kullanıcı kimliği tutulmaz (istek anon anahtarla gelir),
-- e-posta ve jetonlar istemcide maskelenir, sayfa yalnız yol olarak
-- yazılır (sorgu ve # kısmı jeton taşıyabildiği için hiç gönderilmez).
--
-- GİRİŞSİZ ÇAĞRI: giriş ve kayıt sayfalarında da hata çıkabildiği için
-- hata_yaz anon'a açık (anon EXECUTE sayısı 17 → 18). Sele karşı: alanlar
-- kısaltılır, son bir saatte 300'den fazla farklı satıra dokunulmuşsa yeni
-- kayıt bırakılır, 30 günden eski kayıtlar ara ara silinir.
-- =====================================================================

create table if not exists public.hata_kayitlari (
  id       bigint generated always as identity primary key,
  imza     text not null unique,
  sayfa    text,
  mesaj    text,
  kaynak   text,
  yigin    text,
  tarayici text,
  sayac    int not null default 1,
  ilk      timestamptz not null default now(),
  son      timestamptz not null default now(),
  cozuldu  boolean not null default false
);
create index if not exists hata_kayitlari_son on public.hata_kayitlari (son desc);

alter table public.hata_kayitlari enable row level security;
drop policy if exists hata_yonetici_okur on public.hata_kayitlari;
create policy hata_yonetici_okur on public.hata_kayitlari
  for select using (public.yonetici_mi());

create or replace function public.hata_yaz(p_sayfa text, p_mesaj text, p_kaynak text,
                                           p_yigin text, p_tarayici text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_imza text;
begin
  if coalesce(btrim(p_mesaj), '') = '' then return; end if;
  if (select count(*) from hata_kayitlari where son > now() - interval '1 hour') >= 300 then
    return;
  end if;
  v_imza := md5(coalesce(left(p_sayfa, 120), '') || '|' || left(p_mesaj, 300) || '|' ||
                coalesce(left(p_kaynak, 200), ''));
  insert into hata_kayitlari (imza, sayfa, mesaj, kaynak, yigin, tarayici)
  values (v_imza, left(p_sayfa, 120), left(p_mesaj, 300), left(p_kaynak, 200),
          left(p_yigin, 1500), left(p_tarayici, 200))
  on conflict (imza) do update
     set sayac    = hata_kayitlari.sayac + 1,
         son      = now(),
         cozuldu  = false,
         yigin    = excluded.yigin,
         tarayici = excluded.tarayici;
  if random() < 0.02 then
    delete from hata_kayitlari where son < now() - interval '30 days';
  end if;
end $$;
revoke execute on function public.hata_yaz(text, text, text, text, text) from public;
grant execute on function public.hata_yaz(text, text, text, text, text) to anon, authenticated, service_role;

create or replace function public.hata_cozuldu(p_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update hata_kayitlari set cozuldu = true where id = p_id and public.yonetici_mi();
$$;
-- Yeni işlev PUBLIC üzerinden anon'a açık doğar (bkz. GUVENLIK-anon-yetki-kisma.sql).
revoke execute on function public.hata_cozuldu(bigint) from public, anon;
grant execute on function public.hata_cozuldu(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- DENEME (geri alınır; son satırdaki hata bilerek):
-- do $$ declare n int; s int; begin
--   perform hata_yaz('/deneme.html', 'Deneme hatası', 'deneme.js:1:1', 'yigin', 'tarayici');
--   perform hata_yaz('/deneme.html', 'Deneme hatası', 'deneme.js:1:1', 'yigin', 'tarayici');
--   select count(*), max(sayac) into n, s from hata_kayitlari where mesaj = 'Deneme hatası';
--   raise exception 'TEST % satir, sayac %', n, s;
-- end $$;
-- Beklenen: TEST 1 satir, sayac 2
-- ---------------------------------------------------------------------
