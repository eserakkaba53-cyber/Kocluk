# Kartla ödeme (iyzico): kurulum notları

Koç paneli paketi seçer, `odeme-baslat` iyzico ortak ödeme sayfasının adresini verir. Koç kartı iyzico'nun sayfasına girer, kart bilgisi Biyoser'e hiç uğramaz. iyzico tarayıcıyı `odeme-bildirim`e döndürür; fonksiyon sonucu iyzico'nun sorgu API'sinden okur ve `odeme_onayla` lisansı bir yıl uzatır. Tutar her adımda sunucuda yazılır, istemci yalnız paket kodunu yollar.

## Kurulum sırası

1. `ODEME-iyzico-kurulum.sql` dosyasının tamamını Supabase SQL Editor'de çalıştır. Sonuçta görünen DENETİM satırının beklenen değerleri dosyada yazılı (`giris_onaylar` false, `servis_onaylar` true, `rls_acik` true). Dosyanın sonundaki davranış testi yorum satırıdır; açıp ayrıca çalıştırılabilir, her şeyi geri alır.

2. Komutları `supabase` klasörünü içeren klasörde çalıştır. Önce giriş:

```powershell
Set-Location "C:\Users\Eser AKKABA\Desktop\Biyoser code"
```

```powershell
npx supabase login
```

3. Gizli değerler. Sandbox anahtarları sandbox üye işyeri panelinde Ayarlar > Üye İşyeri Ayarları altındadır ve `sandbox-` ile başlar:

```powershell
npx supabase secrets set IYZICO_API_KEY=sandbox-... IYZICO_SECRET_KEY=sandbox-... IYZICO_BASE_URL=https://sandbox-api.iyzipay.com --project-ref hdcxmunvkxkffnsewfgp
```

Panel yerelde (http://localhost:8901) sınanacaksa dönüş adresi de verilir; canlıda bu değer tanımlı olmamalı:

```powershell
npx supabase secrets set ODEME_DONUS_ADRESI=http://localhost:8901 --project-ref hdcxmunvkxkffnsewfgp
```

`SUPABASE_URL`, anon ve service_role anahtarlarını Supabase kendisi verir.

4. Dağıtım. `odeme-bildirim` HER SEFERİNDE `--no-verify-jwt` ile dağıtılır: iyzico dönüşü oturumsuz bir form POST'udur, JWT denetimi açılırsa her dönüş 401 alır.

```powershell
npx supabase functions deploy odeme-baslat --project-ref hdcxmunvkxkffnsewfgp
```

```powershell
npx supabase functions deploy odeme-bildirim --no-verify-jwt --project-ref hdcxmunvkxkffnsewfgp
```

5. Ağ ve anahtar gerektirmeyen iki sınama var. `node supabase/functions/_ortak/iyzico_sinama.ts` imzayı iyzico dokümanındaki ve resmî Node kitaplığındaki örnek değerlerle karşılaştırır (`deno run` ile de çalışır). `node supabase/functions/_ortak/akis_sinama.mjs` iki fonksiyonu sahte iyzico ve sahte Supabase ile 19 durumda koşturur. Kodda değişiklik yapınca ikisi de `TAMAM` ile bitmeli.

## Panelin yapacağı

Satın alma: `POST {SUPABASE_URL}/functions/v1/odeme-baslat`, gövde `{"paket":"koc"}`, başlıklar `Authorization: Bearer <oturum jetonu>` ve `apikey: <anon>`. Yanıt `{ok:true, url, odeme_id}` ise `odeme_id` localStorage'a yazılır, sonra `location.href = url`. `ok:false` gelirse `hata` metni olduğu gibi gösterilir (küçük pakete geçiş reddi dahil).

Dönüş adresi `kocluk-sunucu.html?odeme=<id>&durum=basarili|basarisiz|bekliyor` biçimindedir. Koçsuz Öğrenci Paketi `ogrenci-sunucu.html`e döner; koç paneli bu paketi çevrim içi satmamalı. `durum` yalnız mesaj içindir, gerçek durum `rpc/odeme_durum` (`{p_odeme}`) ile okunur. Başarılı dönüşte lisans bilgisi yeniden yüklenir.

`bekliyor` gelirse ya da koç dönüş olmadan panele girerse saklı `odeme_id` için `GET {SUPABASE_URL}/functions/v1/odeme-bildirim?kontrol=<id>` aynı `Authorization` başlığıyla çağrılır. Yanıt `{ok, durum, paket, lisans_bitis, hata}` olur. Kontrol yalnız ödemenin sahibine cevap verir, başkasına 404 döner. `bekliyor` sürerken yeni ödeme düğmesi gösterilmemeli, çünkü ilk ödeme alınmış olabilir. iyzico jetonu 30 dakika geçerli: 30 dakikadan eski ve hâlâ `bekliyor` olan form terk edilmiş sayılabilir.

## Sandbox test kartları

Son kullanma tarihi gelecekte herhangi bir ay, CVC herhangi üç hane. Kaynak: https://docs.iyzico.com/ek-bilgiler/test-kartlari

| Kart | Beklenen |
|---|---|
| 5528790000000008 (Halkbank, Master Card kredi) | başarılı |
| 4766620000000001 (Denizbank, Visa banka kartı) | başarılı |
| 4111111111111129 | yetersiz bakiye |
| 4129111111111111 | do not honour |
| 4124111111111116 | geçersiz CVC2 |
| 4151111111111112 | 3D Secure başlatılamadı |

Doküman sandbox için tek kullanımlık şifreyi sabit `123456` olarak veriyor; 3D Secure ekranı kod sorarsa bu denenir.

Sınanacak durumlar:

- Başarılı kart: dönüş `durum=basarili`, `koclar.lisans_bitis` bir yıl ileride, `odemeler` satırı `odendi`.
- Başarılı ödemeden sonra tarayıcıda geri ya da yenile: yine `basarili`, süre ikinci kez uzamaz.
- Ödeme bitince iyzico sayfasındaki sekmeyi dönüşten önce kapat, panele gir: kontrol lisansı açar.
- 4111111111111129: dönüş `basarisiz` beklenir, satır `bekliyor` kalır ve `hata` sütununda iyzico'nun mesajı yazar. `bekliyor` dönerse aşağıdaki 5. soruya bak.

## Canlıya geçiş

Kod değişmez. Canlı anahtarlar ve adres yazılır, yerel dönüş adresi silinir, iki fonksiyon yeniden dağıtılır:

```powershell
npx supabase secrets set IYZICO_API_KEY=... IYZICO_SECRET_KEY=... IYZICO_BASE_URL=https://api.iyzipay.com --project-ref hdcxmunvkxkffnsewfgp
```

```powershell
npx supabase secrets unset ODEME_DONUS_ADRESI --project-ref hdcxmunvkxkffnsewfgp
```

## iyzico'ya sorulacaklar (canlıdan önce)

1. Biyoser TC kimlik no toplamıyor; `identityNumber` için `11111111111` kabul ediliyor mu?
2. Adres, şehir ve telefon toplanmıyor. Gönderilen yer tutucular: adres `Dijital hizmet, adres alınmadı`, şehir `Istanbul`, ülke `Turkey`, telefonu olmayan koç için `+905000000000`, tek kelimelik adda soyad `-`. Hepsi `odeme-baslat/index.ts` başındaki sabitlerde. Bunlar kabul ediliyor mu, fatura (e-Arşiv) tarafında sorun çıkarır mı?
3. Bir yıllık, tek seferlik lisans satışı için `paymentGroup` olarak `PRODUCT` mı, `SUBSCRIPTION` mı istiyorlar? Kod `PRODUCT` gönderiyor (iyzico varsayılanı; yinelenen tahsilat ve kart saklama yok).
4. Ödeme formunda reddedilen bir denemeden sonra aynı jetonla yeniden ödeme yapılabiliyor mu? Kod bu ihtimal için reddedilen satırı `bekliyor`da bırakıyor.
5. Ödeme formu sorgu yanıtı (`/payment/iyzipos/checkoutform/auth/ecom/detail`) başarısız sonuçlarda da `signature` taşıyor mu? Kod şu an her sonucu imzayla doğruluyor; imzasız gelen ret `bekliyor` görünür. Sandbox'ta 4111111111111129 ile `bekliyor` dönerse `odeme-bildirim/index.ts` içinde `isle()` fonksiyonundaki İLK imza denetimi ret dallarının altına alınmalı; aynı denetim lisans açan yolda ayrıca var.
6. `fraudStatus` 0 (inceleme) ile biten ödemenin sonucu üye işyerine nasıl bildiriliyor? Kod bu ödemeyi açmıyor, `bekliyor` bırakıyor; inceleme bitince panelin kontrolü ya da elle `koc_guncelle` açar.

## Elle müdahale ve mutabakat

`hata` sütunu `ELLE İNCELE` ile başlayan satırda para alınmış ama tutar ya da para birimi kayıtla tutmamış, lisans açılmamıştır. iyzico panelinde ödeme numarasıyla bulunur, gerekirse iade edilir ya da `koc_guncelle` ile açılır. Günlük karşılaştırma sorguları SQL dosyasının sonunda.

Fonksiyon günlüklerinde (Supabase > Edge Functions > Logs) yalnız ödeme no ve sonuç görünür, örneğin `odeme-bildirim <id> odendi paket=koc bitis=2027-10-02`. Jeton, kart bilgisi ve anahtar yazılmaz.

Koç hesabı silinince ödeme kayıtları da silinir (`on delete cascade`). Muhasebe için kayıt gerekiyorsa silmeden önce dışa aktarılır.

## Supabase anahtar geçişi (2026 sonu)

Fonksiyonlar `SUPABASE_SECRET_KEYS` ve `SUPABASE_PUBLISHABLE_KEYS` tanımlıysa yeni anahtarları kendiliğinden kullanır, yoksa eski anon ve service_role anahtarlarına düşer. Ağ geçidinin JWT denetimi yalnız eski anahtarları tanıdığı için geçişten sonra `odeme-baslat` da `--no-verify-jwt` ile dağıtılır. Bu güvenlidir: `odeme_hazirla` koçun JWT'siyle çağrılır ve geçersiz JWT'yi PostgREST reddeder.
