-- =====================================================================
-- Özel ders: yeni öğretmen açılmaz (25 Eyl 2026)
-- ---------------------------------------------------------------------
-- oz_koc_kur() eskiden giriş yapan HER hesabı oz_koclar'a ekliyordu; koç
-- paneline giren herkes öğretmen oluyordu. Artık yalnız oz_koclar'da zaten
-- satırı olan hesap geçer, diğerlerine ok:false döner (panel bunu gösterir).
-- Öğrenci tarafı zaten kapalı: oz_davet_kullan / oz_grup_katil geçerli
-- davet kodu olmadan hiçbir bağ kurmuyor.
-- =====================================================================

create or replace function public.oz_koc_kur()
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  k oz_koclar%rowtype;
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'hata', 'Giriş yapılmamış.');
  end if;

  select * into k from oz_koclar where id = auth.uid();
  if not found then
    return json_build_object('ok', false, 'hata',
      'Bu hesap özel ders öğretmeni değil. Öğrenciysen öğrenci panelinden gir.');
  end if;

  return json_build_object('ok', true, 'ad', k.ad);
end;
$$;

-- oz_koc_ekle politikası giriş yapan herkese oz_koclar'a kendini doğrudan
-- (REST ile) ekleme izni veriyordu; oz_koc_kur'u kapatmak bunu kapatmaz.
-- Panel oz_koclar'a hiç INSERT atmıyor, oz_koc_kur da security definer.
drop policy if exists oz_koc_ekle on public.oz_koclar;
