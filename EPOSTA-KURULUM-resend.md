# E-POSTA KURULUMU — Resend + Supabase

Bu dosyayı açık tut, pencereler arasında geçerken sırayı kaybetme.
Toplam ~15 dakika. Üç ayrı sekme açacaksın: **Resend**, **Turhost**, **Supabase**.

---

## DURUM — 4 Eylül 2026

**KURULUM TAMAMLANDI — uçtan uca test edildi.**

| Bölüm | Durum |
|---|---|
| 1 — Resend hesabı + domain | ✅ Bölge **Tokyo (ap-northeast-1)** (Avrupa değil; etkisi ihmal edilebilir, değiştirilmedi) |
| 2 — Turhost DNS kayıtları | ✅ 4 kayıt girildi, yetkili sunucudan + 8.8.8.8 + 1.1.1.1'den doğrulandı |
| Resend doğrulaması | ✅ **Verified** |
| 3 — API anahtarı | ✅ `supabase` adlı anahtar, Sending access |
| 4 — Supabase SMTP | ✅ Etkin, `smtp.resend.com:465`, kullanıcı `resend` |
| Gönderim sınırı | ✅ 30 → **100 e-posta/saat** |
| 5 — Test | ✅ Şifre sıfırlama gönderildi → Resend'de **Delivered** |

**Test kanıtı:** Supabase Auth "Sent password recovery" → Resend → Emails:
`eserakkaba53@gmail.com · Delivered · Reset your password`.
Zincir: Supabase Auth → smtp.resend.com → Amazon SES → Gmail (kabul edildi).

**Kapasite:** Resend ücretsiz plan **3.000 e-posta/ay** (günlük tavan 100).
Supabase'in 100/saat sınırı, dönem başı toplu davetlerin tek seferde geçmesi
için seçildi; asıl tavan Resend tarafında. Aylık 3.000'e yaklaşılırsa
Resend'de ücretli plana geçilmeli — [[biyoser-kapasite-esigi]] ile birlikte izle.

### Supabase kurulumunda karşılaşılan tuzaklar

- **`Failed to update settings: failed to restart Auth` uyarısı YANILTICI.** Bu hata
  çıksa bile ayar veritabanına yazılıyor ve Auth günlüğünde
  `reloading api with new configuration` satırı görünüyor. Uyarıya bakıp
  "kaydolmadı" sonucuna varma — **Auth Logs'a bak.**
- **Şifre alanı ilk denemede kaydolmayabilir.** Diğer bütün alanlar kaydolduğu
  hâlde şifre boş kalabiliyor. Belirtisi: Auth Logs'ta
  `"error": "535 \"Authentication credentials invalid\""`. Çözüm: SMTP ekranına
  dönüp **sadece şifreyi** tekrar yapıştırıp kaydetmek.
- **Ayarın uygulanması gecikmeli.** Kaydettikten hemen sonra test edersen eski
  yapılandırmaya çarparsın. Auth Logs'ta `reloading api with new configuration`
  satırının zaman damgasını gör, testi ondan **sonra** yap.
- **Teşhis için üç yer:** Supabase → Logs → Auth (ham JSON'da `error` alanı),
  Resend → Emails (gönderim listesi), Resend → API keys → **Last used**
  ("No activity" ise Resend o anahtarla hiç başarılı doğrulama görmemiş).
- **`Confirm email` AÇIK** (22 Eyl 2026, bot saldırısından sonra açıldı). Onay
  maili Türkçe şablonla gidiyor (konu "Biyoser: e-posta adresini onayla"),
  bağlantı 24 saat geçerli (27 Eyl 2026). Onay bağlantısı Site URL'e döner,
  biyoser.com.tr ana sayfası onay ekranını açar. Her kayıt, yeniden gönderme ve
  şifre sıfırlama Resend kotasından (günde 100) düşer.

**Girilen kayıtlar** (`nslookup … dns1.turhost.com` ile doğrulandı):

| Tür | İsim | Değer | Öncelik |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqG…IDAQAB` (216 krk, geçerli 1024-bit RSA — OpenSSL ile çözüldü) | — |
| MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | — |

**Ayrıca temizlendi:** ölü `mail.` ve `ftp.` CNAME kayıtları silindi (ikisi de GitHub
Pages IP'lerine çözümlenen, hiçbir servisi olmayan kayıtlardı). Site kayıtlarına
(4 adet A, `www` CNAME, 2 adet NS) dokunulmadı.

### Turhost paneliyle çalışırken bilinmesi gerekenler

- **Oturum sessizce düşüyor.** Düştüğünde form gönderimleri
  `{"status":"token_mismatch"}` ile reddediliyor ama ekranda **hiçbir hata
  görünmüyor** — sayfa hiç tepki vermemiş gibi duruyor. Ayrıca sayfadaki jQuery
  bozuluyor (`$ is not defined`), o yüzden filtre/İptal düğmeleri de ölüyor.
  Bir düğme tepkisizse **önce yeniden giriş yap**, formu suçlama.
- **İsim alanı alan adını kendi ekliyor.** `send` yaz — `send.biyoser.com.tr` değil.
- **Tür'ü TXT yapınca Değer alanı** tek satırlık kutudan **metin kutusuna dönüşüyor**;
  uzun DKIM değeri oraya yazılır.

---

## BÖLÜM 1 — Resend hesabı  (3 dk)

1. **resend.com** → sağ üst **Sign Up**
2. E-posta + şifre ile kaydol (`eserakkaba53@gmail.com` olabilir), e-postanı doğrula
3. Giriş yapınca sol menüde **Domains** var, ona tıkla
4. **Add Domain** düğmesi → açılan kutuya şunu yaz:

   ```
   biyoser.com.tr
   ```

   > Alt alan adı (`send.biyoser.com.tr` gibi) YAZMA. Kök alan adını yaz.
   > Resend zaten arka planda `send` alt alanını kendisi kullanacak.

5. Region seçmeni isterse **eu-west-1 (Ireland)** seç — Türkiye'ye en yakını, e-postalar daha hızlı gider
6. **Add** → Ekranda **3 satırlık bir DNS tablosu** çıkacak. Bu ekranı KAPATMA.

Tablo şuna benzer olacak (değerler sana özel, benimkiler örnek):

| Type | Name | Value | Priority |
|---|---|---|---|
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3...` (çok uzun) | — |

---

## BÖLÜM 2 — Turhost'ta DNS kayıtları  (5 dk)

Alan adın **Turhost**'ta yönetiliyor (dns1.turhost.com / dns2.turhost.com).

1. **turhost.com** → **Müşteri Girişi / Panel**
2. **Alan Adlarım** → `biyoser.com.tr` → **DNS Yönetimi**
   (bazı sürümlerde: *Hizmetlerim → Alan Adı → DNS Kayıtları*)
3. Resend'deki 3 satırı tek tek ekle:

### Kayıt 1 — MX
- Tür: **MX**
- Ad / Host: `send`
- Değer / Hedef: Resend'deki MX değerini kopyala
- Öncelik (Priority): `10`

### Kayıt 2 — TXT (SPF)
- Tür: **TXT**
- Ad / Host: `send`
- Değer: `v=spf1 include:amazonses.com ~all`

### Kayıt 3 — TXT (DKIM)
- Tür: **TXT**
- Ad / Host: `resend._domainkey`
- Değer: Resend'deki uzun `p=...` metnini **tamamını** kopyala

### ⚠ Üç tuzak

**1. Ad alanına alan adını TEKRAR yazma.**
Doğru: `send` — Yanlış: `send.biyoser.com.tr`
Turhost paneli sonuna alan adını kendisi ekler. İki kez yazarsan
`send.biyoser.com.tr.biyoser.com.tr` olur ve doğrulama hiç geçmez.
(Panel zorunlu tutuyorsa tam hâlini yaz — ekranda kaydın sonunda
`send.biyoser.com.tr` görünüyorsa doğrudur.)

**2. DKIM değeri çok uzun.** Kopyalarken başı veya sonu kesilmesin.
Yapıştırdıktan sonra sonundaki karakterle Resend'dekini karşılaştır.

**3. Kök MX kaydına DOKUNMA.** Yeni MX kaydı `send` içindir, mevcut
kaydı silme (o ayrı bir konu, aşağıda).

4. Kayıtları ekledikten sonra Resend sekmesine dön → **Verify DNS Records**
5. Hepsi yeşil ✅ olana kadar bekle. **15 dakika–2 saat sürebilir.**
   Hemen olmazsa panik yapma, 20 dakika sonra tekrar **Verify**'a bas.

---

## BÖLÜM 3 — API anahtarı  (1 dk)

Domain yeşil olduktan SONRA:

1. Resend → sol menü **API Keys** → **Create API Key**
2. Name: `supabase`
3. Permission: **Sending access**
4. **Add** → ekranda `re_` ile başlayan bir metin çıkacak

> ⚠ Bu metin **bir kez** gösterilir. Hemen kopyala, bir yere yapıştır.
> Kaybedersen yenisini üretirsin, sorun değil ama uğraşırsın.
> Bu anahtar bir şifredir — kimseyle paylaşma, sohbete de yapıştırma.

---

## BÖLÜM 4 — Supabase SMTP ayarı  (2 dk)

1. **supabase.com/dashboard** → `kocluk` projesi
2. Sol altta ⚙ **Project Settings** → **Authentication**
3. **SMTP Settings** bölümünü bul → **Enable Custom SMTP** anahtarını AÇ
4. Alanları şöyle doldur:

| Alan | Yazılacak |
|---|---|
| Sender email | `bilgi@biyoser.com.tr` |
| Sender name | `Biyoser Koçluk` |
| Host | `smtp.resend.com` |
| Port number | `465` |
| Username | `resend` |
| Password | `re_` ile başlayan API anahtarın |
| Minimum interval between emails | `60` (saniye) |

> Sender email'deki `bilgi@` kısmını istediğin gibi değiştirebilirsin
> (`destek@`, `merhaba@`…). Önemli olan `@biyoser.com.tr` olması —
> Resend'de doğruladığın alan adı bu.

5. **Save** düğmesine bas

### Gönderim sınırını da yükselt
Supabase varsayılanı saatte 30 e-posta — kendi SMTP'nle bu gereksiz düşük.

1. Sol menü **Authentication** → **Rate Limits**
2. *Rate limit for sending emails* değerini `100` yap → **Save**

---

## BÖLÜM 5 — Test  (2 dk)

1. Gizli/incognito pencere aç
2. `biyoser.com.tr/kocluk-sunucu.html` → **Hesabım yok — oluştur**
3. Kendi Gmail adresinle kaydol
4. Gmail'ine doğrulama e-postası **`bilgi@biyoser.com.tr`** adresinden gelmeli
5. Spam klasörüne de bak — ilk günlerde oraya düşebilir, normal

Gelmezse: Resend → sol menü **Logs**. Her gönderim orada görünür,
hata varsa sebebini yazar. O ekranı bana anlat, bakarım.

---

## AYRI KONU — Kırık MX kaydı

Şu an `biyoser.com.tr`'nin MX kaydı kendisini gösteriyor, o da GitHub
Pages IP'lerine çözümleniyor. GitHub'ın posta sunucusu yok. Yani:

**@biyoser.com.tr adresine gönderilen hiçbir e-posta teslim edilemiyor.**

Bugün bir şeyi bozmuyor çünkü o adresten gelen kutusu kullanmıyorsun.
Ama iki sorun var:

1. Öğrenci/veli sistem e-postasına **cevap yazarsa** hiçbir yere gitmez
2. Bazı alıcı sunucular "gönderen alan adı posta alabiliyor mu" diye
   bakar; alamıyorsa spam puanı artar

**Denenen ve olmayan:** Standart çözüm "null MX" (RFC 7505) — değer olarak tek
nokta `.`, öncelik `0`. Bu, "bu alan adı posta kabul etmiyor" demenin resmî yolu.
**Turhost kabul etmiyor:** `Invalid DNS record: Supplied exchange for MX record is
invalid`. Zorlanmadı.

**Kaydı silmek de bir şey kazandırmıyor.** MX hiç yoksa gönderen sunucular
RFC 5321 gereği A kaydına düşer — o da yine aynı GitHub IP'leri. Yani silmekle
bırakmak birebir aynı sonucu veriyor. Bu yüzden kayıt olduğu gibi bırakıldı.

**Gerçek çözüm (istenirse):** ImprovMX gibi ücretsiz bir yönlendirme servisi kur;
kök MX'i oraya çevir, `bilgi@biyoser.com.tr` → kişisel Gmail'e düşsün. Böylece
öğrenci/veli sistem e-postasına cevap yazarsa ulaşır. ~10 dakikalık ayrı bir iş.

> Turhost'ta e-posta hizmeti **yok** — `/service/email` "Kayıtlı hizmetiniz
> bulunmuyor" diyor. Yani Turhost posta kutusu seçeneği masada değil.
