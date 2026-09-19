# Kendini tanı envanterleri

Lise öğrencisinin kendini tanıması ve üniversite bölümü seçimine yön vermesi için
beş envanter, puanlama motoru ve üç rollü bir site.

## Roller

**Yönetici.** Tek kişi. Bütün reh_okulları, rehber öğretmenleri ve öğrencileri görür.
Rehber öğretmen başvurularını onaylar, okul kodlarını üretir ve yeniler.
Hesabı panelden açılmaz, Supabase'de elle açılıp `reh_yonetici_ata` ile atanır.

**Rehber öğretmen.** Kendisi kayıt olur, yönetici onaylamadan hesabı çalışmaz.
Onaylanınca okuluna bir kod verilir. O kodla kayıt olan öğrenciler onun panelinde
görünür. Öğrencileri tek tek, sınıf bazında ve okul genelinde izler.

**Öğrenci.** Rehber öğretmeninden aldığı okul koduyla kayıt olur, sınıfını ve
şubesini seçer, envanterleri doldurur, raporunu görür.

Giriş üç rolde de e-posta ve şifreyle, Supabase Auth üzerinden.

## Dosyalar

### Site

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Öğrenci sayfası. Karşılama, kayıt, giriş, testler, rapor. |
| `panel.html` | Rehber öğretmen paneli. |
| `yonetici.html` | Yönetici sayfası. Öğrencilere gönderilmez. |
| `stil.css` | Görünüm. Beş envanterin rengi burada tanımlı. |
| `uygulama.js` | Öğrenci tarafı: ekran akışı, üç test motoru, kayıt, rapor. |
| `baglanti.js` | **Kurulumda düzenlenecek tek dosya.** Supabase adresi, anahtar, kimlik katmanı. |
| `deneme.js` | Supabase yokken devreye giren taklit. Kurulunca kendiliğinden susar. |
| `kurulum.sql` | Supabase'de bir kez çalıştırılır. Tablolar, RLS, fonksiyonlar. |
| `ornek-sinif.sql` | Örnek sınıf. `kurulum.sql` dosyasından sonra çalıştırılır. |
| `logo.png` | Başlık şeridindeki Biyoser işareti. |

### Veri ve puanlama

| Dosya | Ne işe yarar |
|---|---|
| `SEMA.md` | Veri şeması. Madde eklerken önce buraya bak. |
| `veri/kisilik.js` | Kişilik Envanteri, 70 madde |
| `veri/ilgi.js` | İlgi Envanteri, 48 madde |
| `veri/degerler.js` | Meslek Değerler Sıralama Tekniği, 5 tur |
| `veri/beceri.js` | Mesleki Beceri Envanteri, 30 madde |
| `veri/yetenek.js` | Yetenek Testi, 40 soru |
| `veri/bolumler.js` | Bölüm eşleştirme tablosu, 70 bölüm |
| `veri/ornek-sinif.js` | Örnek sınıfın deneme kipi kopyası, üreteç yazıyor |
| `puanlama.js` | Puanlama ve bölüm önerisi. Tarayıcıda da node'da da çalışır. |

### Denetim

| Komut | Ne yapar |
|---|---|
| `node kontrol.js` | Veri dosyalarını şemaya karşı tarar. Madde değiştirince çalıştır. |
| `node puanlama.js` | Puanlama motorunun kendi sınaması. |
| `node ornek.js` | Üç örnek öğrenci profiliyle zinciri uçtan uca çalıştırır. |
| `node sinama-deneme.js` | Deneme kipini üç rolde de sınar. `deneme.js` değişince çalıştır. |
| `node ornek-sinif-uret.js` | Örnek sınıfı yeniden üretir, çeşitliliğini de sınar. |

## Kurulum

1. [supabase.com](https://supabase.com) üzerinde yeni proje aç. Bölge olarak
   **Frankfurt (eu-central-1)** seç, veriler AB'de kalsın.
2. **SQL Editor > New query** aç, `kurulum.sql` dosyasının tamamını yapıştır ve
   çalıştır. Sonra aynı yere `ornek-sinif.sql` dosyasını yapıştırıp çalıştır.
3. **Authentication > Providers > Email** ekranında **Confirm email** seçeneğini
   kapat. Açık bırakırsan her öğrenci kayıttan sonra e-postasındaki bağlantıya
   tıklamak zorunda kalır. Sistem iki durumda da çalışıyor, kapalı olması okul
   ortamında daha az takılma çıkarıyor.
4. Yine **Authentication > Users** ekranından kendine bir kullanıcı aç. Sonra
   SQL Editor'da şunu çalıştır:
   `select reh_yonetici_ata('senin@epostan.com', 'Adın Soyadın');`
5. **Project Settings > API** ekranındaki Project URL ile anon public anahtarı
   `baglanti.js` içine yapıştır.
6. Klasörü bir statik sunucuya yükle. Öğrencilere `index.html` adresini ver.
   `panel.html` rehber öğretmenlere, `yonetici.html` yalnız sana.

## Akış

Rehber öğretmen `panel.html` üzerinden kayıt olur, okulunun adını ve ilini yazar.
Sen `yonetici.html` üzerinden onaylarsın, sistem o an altı karakterli bir okul kodu
üretir. Kodda 0 ile O, 1 ile I, 8 ile B harfleri yok, çünkü öğrenci kodu elle
yazacak. Rehber öğretmen kodu öğrencilerine dağıtır, öğrenciler `index.html`
üzerinden o kodla kayıt olur.

Aynı okulda ikinci bir rehber öğretmen varsa onaylarken "var olan okula bağla"
seçeneğini kullan, ikisi aynı öğrenci listesini görür.

Kod sızarsa yönetici panelinden yenileyebilirsin. Eski kodla kimse kayıt olamaz,
kayıtlı öğrenciler etkilenmez.

## Deneme kipi

`baglanti.js` içindeki adres ve anahtar doldurulmadığı sürece site deneme kipinde
çalışır: sunucu yerine tarayıcı hafızası kullanılır. Kurulum yapılınca kip
kendiliğinden kapanır.

Hazır hesaplar, şifresi hepsinde `deneme`:

| E-posta | Rol |
|---|---|
| `yonetici@deneme.com` | Yönetici |
| `rehber@deneme.com` | Onaylı rehber öğretmen, Deneme Lisesi |
| `bekleyen@deneme.com` | Onay bekleyen rehber öğretmen |
| `ogrenci@deneme.com` | Öğrenci, 11-B |

Kendin de kayıt olabilirsin. Öğrenci kaydı için okul kodu: `DENEME`

Denemeyi sıfırlamak için tarayıcı konsolunda:
`localStorage.removeItem('kendini-tani-deneme'); localStorage.removeItem('kendini-tani-oturum')`

## Beş envanter ne ölçüyor

**Kişilik Envanteri** Beş Faktör modelini ölçer: dışadönüklük, uyumluluk,
sorumluluk, duygusal denge, deneyime açıklık. Her boyutta 14 madde, altısı ters
puanlanıyor. Maddeler IPIP mantığıyla yazıldı ama hiçbir ölçekten çeviri değil,
dolayısıyla Türkiye normu yok.

**İlgi Envanteri** Holland'ın RIASEC tiplerini ölçer. Her tipte 8 madde, ters madde
yok. Maddeler meslek adı değil etkinlik tarif eder, böylece öğrenci mesleğin
itibarına değil işin kendisine tepki verir.

**Meslek Değerler Sıralama Tekniği** altı iş değerini sıralatır: başarı,
bağımsızlık, tanınma, ilişkiler, güvence, koşullar. Beş turun her birinde altı
seçenek var, her değerden bir tane. Likert yerine sıralama kullanılmasının nedeni
şu: değer maddelerinin hepsi kulağa iyi geldiği için Likert'te herkes hepsine
yüksek puan verir. Sıralama öğrenciyi seçim yapmaya zorlar.

**Mesleki Beceri Envanteri** altı beceri alanında öz yeterlik algısını ölçer.
Doğru cevabı olan bir test değil. Ters madde yok: ölçek "yapabilirim" dediği için
kaçınma davranışını bu ölçekle sormak iki yönlü okunuyordu. Onun yerine her alanda
maddeler temel işten ileri işe doğru basamaklanıyor, tavan etkisi böyle kırılıyor.

**Yetenek Testi** doğru cevabı olan tek envanter. Beş alanda sekizer soru: sözel
akıl yürütme, sayısal akıl yürütme, mantıksal akıl yürütme, uzamsal düşünme, veri
yorumlama. Zorluk 10 üzerinden 5'i geçmiyor, çünkü amaç seçmek değil yönlendirmek.

## Puanlama

Likert envanterlerde ham puan boyuttaki madde sayısına göre yüzdeye çevrilir.
Ters maddede cevap `6 - cevap` olur. Cevaplanmayan madde 3 sayılır ve `eksik`
listesinde bildirilir.

Sıralamada birinci sıra 6, sonuncu sıra 1 puan alır. Beş turda bir değerin
alabileceği aralık 5 ile 30 arasıdır. Yalnız altı seçeneğin tamamı sıralanmış
turlar puanlamaya girer.

Yetenek testinde boş bırakılan soru yanlış sayılır, düzeltme formülü yok.

## Bölüm uyumu nasıl hesaplanıyor

Her bölüm kaydında dört ağırlık kümesi var: Holland kodu, beş yetenek alanının
önemi, altı beceri alanının önemi, iki baskın iş değeri. Öğrencinin yüzdeleri bu
ağırlıklarla çarpılıp ağırlıklı ortalaması alınıyor. Dört bileşen şöyle toplanıyor:

| Bileşen | Ağırlık |
|---|---|
| İlgi | 35 |
| Yetenek | 25 |
| Beceri | 25 |
| Değer | 15 |

Kişilik puana girmez. Bunun nedeni kişiliğin bölüm başarısını yordama gücünün
ilgi ve yetenekten düşük olması. Kişilik yalnızca `gerekce.notlar` içinde uyarı
üretir: bölümün öne çıkan bir kişilik boyutunda öğrencinin puanı düşükse bu
öğrenciye yazılı olarak söylenir.

Liste çıkarılırken bir gruptan en fazla dört bölüm alınır, yoksa sayısal profilde
liste baştan sona mühendislik oluyor ve öğrenci başka alanları hiç görmüyor.

## Puan türü uyarısı

Holland uyumu puanın yüzde 35'i olduğu için, ilgisi sosyal çıkan bir öğrencinin
listesine Hemşirelik gibi SAY puanlı bir bölüm girebiliyor. Öğrenci sayısal akıl
yürütmede zayıfsa bu bölüm ona ulaşılabilir bir hedef gibi görünür, oysa değildir.
Bölümün puan türünü taşıyan yetenek alanlarındaki ortalama 40'ın altındaysa uyarı
metni üretilir ve listede bölümün altında gösterilir.

SAY sayısal ile mantıksal akıl yürütmeye, EA sayısal ile sözele, SÖZ sözel ile
veri yorumlamaya, DİL sözele dayanır. Özel yetenek sınavıyla alan bölümlerde uyarı
üretilmez, çünkü oradaki seçim YKS puanına bağlı değil. Rapor okunur kalsın diye
bölüm başına en fazla iki not gösterilir, puan türü uyarısı hiçbir zaman elenmez.

## Testlerin çalışma biçimi

Kişilik, ilgi ve beceri envanterleri sayfa başına 10 madde gösterir. Öğrenci
maddeyi klavyeden 1-5 tuşlarıyla ya da ok tuşlarıyla işaretleyebilir. Sayfadaki
maddelerin hepsi işaretlenmeden ileri gidilmez. Telefonda beş etiket sığmadığı için
ortadakiler gizlenir, ölçeğin iki ucu alt satırda durur, etiket metni ekran okuyucu
için `aria-label` olarak kalır.

Değerler envanterinde öğrenci altı seçeneğe sırayla dokunur, dokunma sırası
sıralama olur. Sıralanmış bir seçeneğe tekrar dokunmak onu listeden çıkarır ve
kalanlar yukarı kayar. Tur ancak altısı da sıralandığında tamamlanmış sayılır.

Yetenek testi soruları tek tek gösterir, altta 40 soruluk bir ağ vardır. Süre
sunucuda başlar, sayfayı yenilemek süre kazandırmaz. Süre dolunca cevaplar
kendiliğinden kaydedilir.

Cevaplar her işaretlemeden 1,4 saniye sonra kaydedilir. Tamamlanan envanter
kilitlenir: istemci ne gönderirse göndersin sunucu eski cevabı geri koyar, arayüz
de tıklamayı kabul etmez. Rehber öğretmen panelden bir envanteri yeniden açabilir.
Örnek sınıftaki kayıtlar değiştirilemez.

## Örnek sınıf

Rehber öğretmen ve yönetici panele ilk girdiğinde boş tablo görmesin diye
18 öğrencilik bir örnek sınıf var. Gerçek madde havuzundan üretildi, 12'si beş
envanteri de bitirmiş, 11 farklı Holland kodu ve 12 farklı ilk bölüm çıkıyor.
Bu öğrencilerin giriş hesabı yok, kayıtları değiştirilemez ve sayımlara katılmaz.

`node ornek-sinif-uret.js` sınıfı yeniden üretir. Tohumlu üreteç kullanıyor,
her çalıştırmada aynı sınıf çıkar. Hem `ornek-sinif.sql` hem `veri/ornek-sinif.js`
bu betikten çıkar, ikisi arasında veri farkı oluşmaz.

## Sonuç yorumlanırken bilinmesi gerekenler

Madde havuzları yeni yazıldı, gerçek veriyle güvenirlik katsayısı hesaplanmadı.
İlk uygulamadan sonra madde toplam korelasyonlarına bakıp zayıf maddeler
değiştirilmeli.

Ergen örnekleminde sorumluluk ve uyumluluk puanları sosyal beğenirlik yüzünden
yukarı kayar. Puanları mutlak eşiklerle değil, öğrencinin kendi beş boyutu
içindeki örüntüsü olarak okumak gerekir.

Holland altıgeninin komşuluk yapısı Türkiye örneklemlerinde her zaman düzgün
çıkmaz. `tutarlilik` değeri tanımlayıcı bir gösterge, bir ölçüt değil.

Uzamsal testin 8 sorusunun çizimi henüz hazır değil. Şeklin tarifi metin olarak
gösteriliyor ve soru çözülebiliyor, ama çizim girmeden uzamsal ölçüm zayıf kalır.

Bölüm önerisi bir sıralama listesidir, bir karar değildir. Öğrenciye YÖK Atlas'taki
taban puan ve kontenjan bilgisiyle birlikte gösterilmeli.
