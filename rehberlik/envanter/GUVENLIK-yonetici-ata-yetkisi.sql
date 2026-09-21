-- ---------------------------------------------------------------------
-- 21 Eylül 2026 — reh_yonetici_ata yetki yükseltmesi kapatılıyor
--
-- BULGU
-- reh_yonetici_ata(text,text) SECURITY DEFINER ve gövdesinde hiçbir yetki
-- denetimi yok: verilen e-posta auth.users'ta bulunuyorsa reh_profiller'a
-- rol='yonetici', onayli=true satırı yazıyor. Kardeş fonksiyonu
-- reh_yonetici_kod_yenile "if not reh_yonetici_mi() then raise exception"
-- ile başlıyor, bu başlamıyor.
--
-- NEDEN AÇIK KALDI
-- kurulum.sql:637 "revoke all on function reh_yonetici_ata(text,text) from public"
-- diyor ve doğru niyeti taşıyor (kurulum.sql:656: "yalnız SQL Editor'dan, yani
-- service role ile çalışır"). Ama Supabase kurulumda şunu tanımlıyor:
--   alter default privileges in schema public
--     grant execute on functions to anon, authenticated, service_role;
-- Bu, her YENİ fonksiyona anon ve authenticated için AYRI birer grant yazar.
-- "revoke from public" PUBLIC sözde-rolünü kaldırır, bu iki açık grant'a
-- dokunmaz. Canlı ACL doğrulandı:
--   {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
--
-- SÖMÜRÜ
-- Elinde yalnız public anon anahtarı olan biri:
--   POST /rest/v1/rpc/reh_yonetici_ata {"p_eposta":"kendi@adresi","p_ad_soyad":"x"}
-- çağırıp rehberlik yöneticisi olur; ardından reh_yonetici_ogrenciler(null)
-- ile bütün okulların öğrenci listesini ve envanter yanıtlarını okur.
--
-- DURUM: AÇIK SÖMÜRÜLDÜ, SONRA KAPATILDI.
-- 21 Eylül 20:19:17'de pier2b95@hg.imagesthere.com hesabı açıldı, 20:19'da
-- giriş yaptı ve bu fonksiyonla kendini yönetici yaptı:
--   reh_profiller: rol=yonetici, ad_soyad='SELF OP', onayli=true
--   reh_okullar:   'Hacked School' (kod LNKKKD)
-- Sızan gerçek veri yok: gerçek okulda (Akçakoca Sosyal Bilimler Lisesi) o
-- sırada kayıtlı gerçek öğrenci yoktu, 15 envanter yanıtının tamamı demo
-- okuluna aitti.
-- TAMAMI CANLIDA UYGULANDI ve DOĞRULANDI (21 Eyl 2026).
-- Saldırganın hesapları ve 'Hacked School' silindi, tek yönetici yeniden
-- eserakkaba@hotmail.com.tr.
-- Son durum: anon'a açık tek reh_ fonksiyonu reh_okul_kodu_sor, o da
-- kurulum.sql:641 gereği bilerek açık. 22 reh_ fonksiyonunun 16'sı
-- authenticated'a açık; kapalı 6 tanesi reh_yonetici_ata,
-- reh_okul_kodu_uret ve dört iç yardımcı (reh_rolum, reh_rehber_mi,
-- reh_yonetici_mi, reh_benim_profilim_id).
--
-- O dört yardımcı bu dosyanın ilk sürümünde eksikti: kurulum.sql'in revoke
-- listesinde hiç yer almadıkları için PUBLIC EXECUTE ile duruyorlardı ve
-- "revoke from anon" onları kapatmıyordu (anon, PUBLIC'ten miras alıyor).
-- Kapatmadan önce doğrulandı: hiçbir panel çağırmıyor, hiçbir RLS
-- politikasında geçmiyorlar, yalnız 10 SECURITY DEFINER fonksiyonun
-- içinden çağrılıyorlar ve onlar sahibin yetkisiyle çalışıyor.
-- Kapatma sonrası reh_durumum() yönetici kimliğiyle normal döndü.
-- ---------------------------------------------------------------------

-- 1. Yalnız service role ile çalışması gereken ikisi
revoke execute on function public.reh_yonetici_ata(text, text) from anon, authenticated;
revoke execute on function public.reh_okul_kodu_uret()         from anon, authenticated;

-- 2. kurulum.sql bunları yalnız authenticated'a veriyor; anon'un işi yok.
--    (Gövdelerinde reh_yonetici_mi() denetimi var, yine de yüzeyi daraltıyoruz.)
revoke execute on function public.reh_yonetici_rehberler()        from anon;
revoke execute on function public.reh_yonetici_onayla(uuid, uuid) from anon;
revoke execute on function public.reh_yonetici_onay_kaldir(uuid)  from anon;
revoke execute on function public.reh_yonetici_okullar()          from anon;
revoke execute on function public.reh_yonetici_ogrenciler(uuid)   from anon;
revoke execute on function public.reh_yonetici_kod_yenile(uuid)   from anon;
revoke execute on function public.reh_rehber_ogrenciler()         from anon;
revoke execute on function public.reh_envanter_ac(uuid, text)     from anon;
revoke execute on function public.reh_envanter_kaydet(jsonb, boolean) from anon;
revoke execute on function public.reh_ogrenci_kayit(text, text, int, text, text) from anon;
revoke execute on function public.reh_rehber_kayit(text, text, text, text)       from anon;
revoke execute on function public.reh_durumum()                   from anon;

-- reh_okul_kodu_sor(text) BİLEREK anon'da kalıyor: okul kodu, giriş yapılmadan
-- kayıt formunda sorgulanıyor (kurulum.sql:640).

-- ---------------------------------------------------------------------
-- DENETİM — yukarıdakini çalıştırdıktan sonra bunu çalıştır.
-- Beklenen: "reh_yonetici_ata anon=YOK", "reh_okul_kodu_uret anon=YOK",
-- ve anon_erisimi sütununda yalnız reh_okul_kodu_sor kalmalı.
-- ---------------------------------------------------------------------
-- select p.proname,
--        has_function_privilege('anon', p.oid, 'EXECUTE')          as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as girisli
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname like 'reh\_%'
-- order by anon desc, p.proname;
