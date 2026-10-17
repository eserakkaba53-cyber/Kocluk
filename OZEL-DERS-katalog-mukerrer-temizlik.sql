-- ============================================================
-- ÖZEL DERS — TEST KATALOĞUNDAKİ MÜKERRER SATIRLAR SİLİNDİ   10 Eki 2026
-- (kullanıcı "sil" diyerek onayladı; Supabase MCP ile uygulandı)
--
-- NEDEN OLUŞTU
--   Supabase REST bir sorguda en fazla 1.000 satır döndürür. Özel ders
--   paneli kataloğu sayfalamadan çektiği için yalnız ilk 1.000 satırı
--   görüyordu. "Drive'dan çek" her seferinde görmediği testleri yeni sanıp
--   tekrar yazdı: 1.450 test için 3.126 satır birikti. Panel düzeltmesi
--   Biyoloji deposunda 0cbafcf (API.hepsi, sayfalı çekme).
--
-- YAPILAN
--   Her (koc_id, link) için tek satır bırakıldı. Öncelik: ödev kaleminde
--   kullanılan satır, sonra konusu bulunmuş olan (unite <> 'Eşleşmeyen'),
--   sonra küçük id. Silinen satıra bağlı 51 ödev kaleminin test_id'si kalan
--   satıra taşındı. Sonuç: 1.676 satır silindi, 1.450 kaldı; bağlantı
--   kümesi Drive köprüsünün listesiyle birebir aynı.
--
-- YEDEK (API'ye kapalı yedek şeması)
--   yedek.oz_katalog_20261010    3.126 satır
--   yedek.oz_kalemler_20261010b  2.443 satır
-- ============================================================

with s as (
  select c.id, row_number() over w rn, first_value(c.id) over w tut
  from oz_katalog c
  where coalesce(c.link,'')<>''
  window w as (partition by c.koc_id, c.link
    order by (exists(select 1 from oz_kalemler k where k.test_id=c.id::text)) desc,
             (c.unite<>'Eşleşmeyen') desc, c.id)
), tasi as (
  update oz_kalemler k set test_id=s.tut::text from s where s.rn>1 and k.test_id=s.id::text returning k.id
), sil as (
  delete from oz_katalog c using s where s.id=c.id and s.rn>1 returning c.id
)
select (select count(*) from tasi) tasinan_kalem, (select count(*) from sil) silinen_satir;

-- ============================================================
-- GERİ ALMA
--   insert into public.oz_katalog select y.* from yedek.oz_katalog_20261010 y
--     where not exists (select 1 from public.oz_katalog c where c.id = y.id);
--   update public.oz_kalemler k set test_id = y.test_id
--     from yedek.oz_kalemler_20261010b y where y.id = k.id and y.test_id <> k.test_id;
-- ============================================================
