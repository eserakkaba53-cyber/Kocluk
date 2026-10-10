/* ================= SAĞ AÇIKLAMA SÜTUNU (9 Eki 2026) =================
   Koç ve öğrenci panelinde sağda, sol rayla aynı renkte bir sütun. Ekrandaki her
   kartın hizasında üç kısa bilgi durur: kartın ne olduğu, ne işe yaradığı ve nasıl
   kullanıldığı. Kart, başlığıyla (h2) ya da içindeki bir öğeyle (sec) tanınır;
   sekme verilirse yalnız o sekmede eşleşir. Hangi panelde olduğumuzu sayfa
   window.ACIKLAMA_PANEL ile söyler ('koc' | 'ogrenci'). Dar ekranda sütun gizlenir. */
(function(){
  'use strict';

  var KOC = [
    // ---- Haftalık ----
    { tab:'hafta', sec:'.stats', bas:'Haftanın özeti',
      ne:'Bu haftanın ödev sayısı, devreden ödevler, haftalık hedef süre ve sınava kalan hafta.',
      ise:'Öğrencinin bu haftaki yükünü ve ödev uyumunu tek bakışta görürsün.',
      nasil:'Uyum, "Yapıldı" işaretli ödevlerin payıdır; kısmen yapılan yarım sayılır. Hedef süreye rutinler ve devreden ödevler de girer.' },
    { h2:/^Devreden ödevler/, bas:'Devreden ödevler',
      ne:'Geçmiş haftalarda verilip henüz "Yapıldı" işaretlenmemiş konu ödevleri.',
      ise:'Biriken işi görür, yeni ödev vermeden önce bunları kapattırırsın.',
      nasil:'"Kaç hafta" sütunu ödevin yaşını yazar, 3 haftada kırmızı olur. Durum düğmesiyle işaretlersin; "sil" onay sorduktan sonra ödevi tamamen kaldırır.' },
    { h2:/^Bu haftanın ödevleri/, bas:'Bu haftanın ödevleri',
      ne:'Bu hafta verilen konu ödevleri ve rutinler; öğrencinin çözdüğü soru, doğru-yanlış ve net bilgisiyle.',
      ise:'Öğrencinin işaretlediklerini kontrol eder, gerekirse durumu sen değiştirirsin.',
      nasil:'Durum düğmesi her tıklayışta Bekliyor, Yapıldı, Kısmen ve Yapılmadı arasında döner. Çarpı ödevi bu haftadan çıkarır. Öğrencinin yeni girdiklerini görmek için sayfayı yenile.' },
    { h2:/^Haftalık çalışma programı/, bas:'Haftalık çalışma programı',
      ne:'Bu haftanın ödevlerinin 15 dakikalık dilimlerle günlere yerleştirildiği takvim.',
      ise:'Öğrencinin hangi gün ne çalışacağını belirler; öğrenci aynı takvimi kendi panelinde görür.',
      nasil:'Blokları sürükleyip taşı, taşınan blok kilitlenir. "Yeniden dağıt" kilitlileri yerinde bırakıp gerisini baştan yerleştirir. Gri hücreler kapalı saatlerdir.' },

    // ---- Ödevler ----
    { h2:/^Bitirdi ama tutmamış/, bas:'Bitirdi ama tutmamış',
      ne:"Öğrencinin işleniyor ya da bitti işaretlediği ama denemelerde doğru oranı %50'nin altında kalan konular.",
      ise:'Bitti sanılan ama denemede tutmayan konuları ödev vermeden önce görürsün.',
      nasil:'Oran, denemelere girilen yanlış ve boş konulardan hesaplanır. Satırdaki "Ödeve ekle" konuyu bugünün tarihiyle ödev olarak verir.' },
    { h2:/^Tavsiye edilen haftalık ödev/, bas:'Tavsiye edilen haftalık ödev',
      ne:'Kalan konuları sınava kadar bitirecek tempoya göre panelin kurduğu haftalık plan.',
      ise:'Bu hafta hangi konuların verilmesi gerektiğini hesaplamakla uğraşmazsın.',
      nasil:'"Bu haftanın ödevlerini ver" planı ödev yapar ve eksik rutini ekler. "çıkar" bir konuyu plandan atar. Beyan tempodan düşükse kırmızı uyarı çıkar.' },
    { h2:/^Hızlı ödev ata/, bas:'Hızlı ödev ata',
      ne:'Her dersin bitmemiş ve henüz ödev verilmemiş ilk konusu.',
      ise:'Sıradaki konuyu tek tıkla ödev olarak verirsin.',
      nasil:'Satırdaki "ödev ver" konuyu bugünün tarihiyle ekler. "Hedefe göre öncelik" seçilirse konular hedef netine katkıya göre dizilir. Satırın üstünde durunca o dersin sonraki konuları görünür.' },
    { h2:/^Ödev ver/, bas:'Ödev ver',
      ne:'Belirli bir konuyu elle ödev verdiğin form.',
      ise:'Dersi, üniteyi ve konuyu kendin seçip soru hedefi ve not eklersin.',
      nasil:'Ders, ünite ve konu seç; soru hedefi boşsa Konular sekmesindeki sayı kullanılır. Düğmenin yanındaki satır haftanın toplam yükünü yazar, beyanı aşınca kırmızı olur.' },
    { h2:/^Rutin tanımı/, bas:'Rutin tanımı',
      ne:'Konudan bağımsız, her hafta tekrarlanan işler; örneğin paragraf ve problem soruları.',
      ise:'Bütün öğrencilerinin haftalık rutinini tek yerden belirlersin.',
      nasil:'Rutin kendiliğinden eklenmez; "Bu haftanın ödevlerini ver" düğmesiyle haftaya girer. Sonraki haftaya devretmez.' },
    { h2:/^Konu bazında ödev dökümü/, bas:'Konu bazında ödev dökümü',
      ne:'Her konunun kaç kez ödev verildiği ve o konudaki uyum.',
      ise:'Aynı konuyu tekrar tekrar verip vermediğini ve hangi konuda takıldığını görürsün.',
      nasil:'Sağdaki halka bütün ödevlerin durumunu, soldaki çubuklar en çok ödev alan derslerin uyumunu gösterir. Kutuya tıklayınca konu konu tablo altta açılır; uyumu düşük kalan konuyu yeniden vermeden önce öğrenciyle konuş.' },
    { h2:/^Geçmiş haftalar/, bas:'Geçmiş haftalar',
      ne:'Son altı haftanın ödev uyumu: büyük halka ortalamayı, küçük halkalar her haftayı ve o hafta yapılan ödev sayısını gösterir.',
      ise:'Öğrencinin düzeninin haftadan haftaya nasıl değiştiğini tek bakışta görürsün.',
      nasil:'Kutuya tıklayınca hafta hafta ödev tabloları altta açılır; yeniden tıklayınca kapanır.' },
    { h2:/^Hafta \d/, bas:'Haftalık ödev tablosu',
      ne:'O haftanın ödevleri ve haftanın uyum yüzdesi.',
      ise:'Öğrencinin haftalar boyunca düzenini karşılaştırırsın.',
      nasil:'En yeni hafta en üstte. Uyum yapılanı tam, kısmen yapılanı yarım sayar; bekleyen ödevler de hesaba girdiği için hafta bitmeden düşük görünür.' }
,

    // ---- Kalan sekmeler (ajanların yazdığı, kodla doğrulanmış) ----
    { tab:"kokpit", h2:"^Tüm öğrenciler", bas:"Tüm öğrenciler", ne:"Her öğrencinin son üç denemedeki TYT ve AYT net ortalamasını, ödev uyumunu, devreden ödev sayısını ve risk rengini tek satırda gösteren tablo.", ise:"Önce hangi öğrenciyle ilgilenmen gerektiğini sıraya dizer: acil olanlar en üstte, aynı grupta ödev uyumu en düşük olan başta.", nasil:"Uyumun %60 altında olması, 6 ya da daha fazla devreden ödev, son denemenin aynı türden bir öncekinden 2 net düşük olması ya da haftalık beyanın kalan konulara yetmemesi öğrenciyi Acil yapar; Durum sütunu en fazla iki gerekçe yazar. \"Öğrenciyi gör\" Haftalık sekmesini, \"Veli raporu\" o öğrencinin Veli raporu sekmesini açar." },
    { tab:"durum", h2:"^Hedefe uzaklık", bas:"Hedefe uzaklık", ne:"Son üç denemenin netlerinden hesaplanan tahmini puan ile Hedef sekmesindeki hedef puanın karşılaştırması.", ise:"Öğrencinin hedef bölüme puan olarak ne kadar uzak olduğunu görürsün.", nasil:"Tahmini puana OBP de katılır; \"Puan farkı\" eksiyse kırmızı yazılır. \"Hedefin yüzdesi\" net ortalamasının hedef toplam netin yüzde kaçı olduğunu gösterir, %90 ve üstü yeşildir." },
    { tab:"durum", h2:"^(TYT|.+ AYT) net seyri", bas:"TYT ve AYT net seyri", ne:"Her denemenin TYT ve AYT netini tarih sırasıyla çizen iki grafik.", ise:"Öğrencinin netlerinin zaman içinde yükselip yükselmediğini görürsün.", nasil:"Üstteki satır deneme sayısını, son neti, ilk denemeye göre değişimi ve hedefle farkı yazar; fark son denemeden hesaplanır. Branş denemeleri bu grafiklere girmez." },
    { h2:"^Uyarılar", bas:"Uyarılar", ne:"Panelin öğrencinin deneme ve ödev verisinden kendiliğinden çıkardığı uyarılar.", ise:"Haftalık görüşmede neyi konuşacağını önüne koyar.", nasil:"Ortalaması hedef netinin %35'inden fazla geride kalan her ders, aynı türden son üç denemede sabit kalan ya da düşen toplam net, iki hafta üst üste %50 altında kalan ödev uyumu ve en az beş eksik konu uyarı doğurur. Hiçbiri yoksa \"Aktif uyarı yok\" yazar." },
    { h2:"^Deneme özeti", bas:"Deneme özeti", ne:"Son sekiz denemenin tarihini, adını, TYT netini ve AYT netini yan yana yazan tablo.", ise:"Denemelerin sonuçlarını grafiğe bakmadan rakamla karşılaştırırsın.", nasil:"En yeni deneme en üstte; bir bölümün girilmediği denemede o sütunda nokta görünür. Branş denemeleri bu tabloya alınmaz." },
    { h2:"^Çözülen soru", bas:"Çözülen soru", ne:"Öğrencinin ödevlerde girdiği çözülmüş soru sayılarının ders ders toplamı.", ise:"Öğrencinin hangi derse ne kadar soru çözdüğünü dersler arasında karşılaştırırsın.", nasil:"Sayılar öğrencinin beyanıdır, verilen hedef değil; çubuklar en çok soru çözülen derse göre ölçeklenir. Öğrencinin yeni girdiği sayılar sayfayı yenileyince eklenir." },
    { h2:"^Son haftalar", bas:"Son haftalar", ne:"Ödev verilen son altı haftanın her biri için verilen, yapılan ve kısmen yapılan ödev sayısı ile uyum yüzdesi.", ise:"Ödev düzeninin haftadan haftaya nasıl değiştiğini görürsün.", nasil:"Kısmen yapılan ödev yarım sayılır; uyum %70 ve üstünde yeşil, %50 altında kırmızıdır. İki hafta üst üste %50 altı, planın fazla ağır olduğunu gösterir." },
    { h2:"^Eksik işaretli konular", bas:"Eksik işaretli konular", ne:"Konular sekmesinde \"Eksik\" işaretlediğin konuların listesi, her birinin yanında dersiyle.", ise:"Tekrar edilmesi gereken konuları ödev vermeden önce toplu görürsün.", nasil:"Kart yalnız eksik işaretli konu varsa çıkar. Konunun durumunu Konular sekmesinde değiştirince buradan düşer." },
    { h2:"^Karneden okut", bas:"Karneden okut", ne:"Deneme karnesinin metninden ders netlerini ve yanlış ya da boş bırakılan konuları okuyan kart.", ise:"Netleri ve konuları tek tek elle yazmaktan kurtarır.", nasil:"Karne metnini kutuya yapıştırıp \"Karneyi oku ve formu doldur\"a bas ya da \"PDF yükle\" ile dosyayı seç; okunan sayılar \"Yeni deneme gir\" formuna yeşil zeminle yazılır. Fotoğraf ve taranmış görüntü okunmaz, kaydetmeden önce sayıları karneyle karşılaştır." },
    { h2:"^Karneden çıkarılan", bas:"Karneden çıkarılan konular", ne:"Karneden okunan yanlış ve boş konuların ders ders önizlemesi.", ise:"Konuların doğru okunup okunmadığını kaydetmeden önce kontrol edersin.", nasil:"Liste \"Denemeyi kaydet\"e bastığında denemeye eklenir; yanlışsa \"Konuları at\" ile temizle. Konu listesiyle eşleşmeyen konular için doğru konuyu seçip \"Öner\"e basabilirsin." },
    { h2:"^Yanlış ve boş konular", bas:"Yanlış ve boş konular", ne:"\"Geçmiş denemeler\" tablosunda \"konu gir\" ile açtığın denemenin yanlış ve boş konu kaydı.", ise:"Öğrencinin hangi konulardan soru kaçırdığını denemeye bağlarsın; zayıf konular bu kayıtlardan çıkar.", nasil:"Konuyu seçip yanlış ya da boş adedini yaz, \"Konuyu ekle\"ye bas; \"Konudan soru\" boş kalırsa o konunun doğru oranı hesaplanmaz. \"Toplu ekle\" kutusuna yapıştırılan konulara soru sayısı yazılmadığı için oranları da çıkmaz." },
    { h2:"^Zayıf konular", bas:"Zayıf konular", ne:"Bütün denemelerdeki konu kayıtlarından doğru oranı %50'nin altında kalan konular.", ise:"Öğrencinin denemede tutmayan konularını tek listede görür, tekrar planını buna göre kurarsın.", nasil:"Doğru sayısı, konudan çıkan sorudan yanlış ile boşun düşülmesiyle bulunur; soru sayısı girilmemiş konular listeye girmez, alttaki notta sayılır. Son sütun \"Bitti\" diyorsa konuyu Konular sekmesinde \"Eksik\"e çek." },
    { h2:"^Son \\d+ deneme", bas:"Son denemeler, ders bazında", ne:"Her dersin son üç denemedeki netini eskiden yeniye sıralayan, ortalamasını hedef netle karşılaştıran tablo.", ise:"Hangi derste hedefin gerisinde kaldığını rakamla görürsün.", nasil:"Bir dersin girilmediği denemede seyirde nokta görünür, eksi fark kırmızı yazılır. Branş denemeleri sayılmaz; grafikler Durum sekmesindedir." },
    { h2:"^Yeni deneme gir", bas:"Yeni deneme gir", ne:"Bir denemenin ders ders doğru ve yanlış sayılarını elle girdiğin form.", ise:"Karne yoksa ya da okunamadıysa denemeyi kayda geçirirsin.", nasil:"Doldurup \"Denemeyi kaydet\"e bas; boş bıraktığın ders denemeye girmez, net doğrudan yanlışın dörtte biri düşülerek hesaplanır. Yalnız AYT dersleri doldurulursa deneme AYT, öbür durumlarda TYT sayılır." },
    { h2:"^Geçmiş denemeler", bas:"Geçmiş denemeler", ne:"Öğrencinin bütün denemeleri; her dersin neti ayrı sütunda, en sağda toplam net.", ise:"Girilen denemeleri denetler, konu analizini buradan başlatırsın.", nasil:"\"konu gir\" o denemenin konu kartını \"Karneden okut\" kartının altında açar, \"sil\" onay sorduktan sonra denemeyi kaldırır. Öğrencinin kendi girdiği denemeler sayfayı yenileyince burada görünür." },
    { h2:"^Yetişir mi — yalnız konu", bas:"Yetişir mi: yalnız konu", ne:"Soru çözümü hariç, konu çalışması için haftada gereken sürenin öğrencinin beyanına sığıp sığmadığını gösteren kart.", ise:"Konuların sınava kadar bitip bitmeyeceğini görürsün.", nasil:"Öncelikli senaryo hesabı olduğu gibi alır; öteki iki senaryo %15 ve %30 ek süre koyar. Yetişen kutu kalan payı, yetişmeyen kutu haftalık açığı yazar; beyan boşsa kutularda \"Hedef sekmesini doldur\" yazar." },
    { h2:"^Yetişir mi — konu \\+ soru", bas:"Yetişir mi: konu + soru", ne:"Konu çalışmasına hedeflenen soru çözümü eklenince haftalık yükün beyana sığıp sığmadığını gösteren kart.", ise:"Öğrencinin sınava gerçekten hazır olup olamayacağını bu karttan okursun.", nasil:"Soldaki kart \"Yetişir\", bu kart \"Yetişmez\" diyorsa öğrenci konuları bitirir ama yeterince soru çözemez. Öncelikli \"Yetişir\" ama güvenlik payı \"Yetişmez\" ise plan gergindir; haftalık süreyi ya da konu önceliklerini öğrenciyle konuş." },
    { h2:"^Konu ilerlemesi", bas:"Konu ilerlemesi", ne:"Her dersin toplam, biten, işlenen ve eksik konu sayısını gösteren tablo; yanında tamamlanma yüzdesi ve kalan süre durur.", ise:"Hangi derste geride kaldığını tek tabloda karşılaştırırsın.", nasil:"Bir satıra tıklayınca o dersin konuları alttaki \"Konu durumu ve süresi\" kartında açılır. Kalan süreye soru çözümü de girer; eksik konu varsa sayısı kırmızı yazılır." },
    { h2:"^Konu durumu ve süresi", bas:"Konu durumu ve süresi", ne:"Seçili dersin konularını ünite ünite listeleyen kart; konu adının yanındaki etiket konunun hedefe göre kademesini ve ön koşul olup olmadığını gösterir.", ise:"Konu işaretledikçe üstteki kalan süre ve yetişir hesapları buna göre yeniden çıkar.", nasil:"Konuya her tıklayışta durum Görülmedi, İşleniyor, Bitti ve Eksik arasında döner; \"Bitti\" olan konunun bekleyen ödevi varsa panel onu da \"Yapıldı\" sayıp saymayacağını sorar, \"Üniteyi bitti işaretle\" ise sormaz. Alttaki \"dk\" ve \"soru\" kutuları bütün öğrencilerin için ortaktır; ▶ düğmesi konunun YouTube aramalarını açar." },
    { h2:"^Süre ayarları", bas:"Süre ayarları", ne:"Konu sürelerinde elle yaptığın değişikliklerin sayısını ve bu ayarları taşıma düğmelerini gösteren kart.", ise:"Süre ayarların bütün öğrencilerinde geçerli olduğu için onları buradan yedekler ya da başka bir bilgisayara aktarırsın.", nasil:"\"Süre tablosunu indir\" ile dosya alır, \"Süre tablosu yükle\" ile onay verdikten sonra mevcut ayarların yerine koyarsın; \"Varsayılanlara dön\" elle ayarları siler. Soru sayıları bu karta girmez." },
    { h2:"^Ortaöğretim başarı puanı", bas:"Ortaöğretim başarı puanı", ne:"Diploma notunu girdiğin ve OBP'nin hesaplandığı kart.", ise:"OBP'nin puana katkısını ve geçen yıl yerleşmenin bu katkıyı ne kadar düşürdüğünü görürsün.", nasil:"Diploma notunu 100 üzerinden yaz; panel OBP'yi notun beş katı alır ve puana OBP'nin 0,12 katını ekler. \"Geçen yıl bir programa yerleşti\" işaretlenirse çarpan 0,06'ya iner; not ve kutu kendiliğinden kaydedilir." },
    { h2:"^Net dağılımı", bas:"Net dağılımı", ne:"Ders ders netleri ve bu netlerin puana katkısını gösteren tablo; ilk açılışta son üç denemenin ortalamasıyla dolar.", ise:"Netleri değiştirerek hedef puana hangi dağılımla ulaşılacağını denersin.", nasil:"Net yazdıkça puanlar yeniden hesaplanır ama tablo kaydedilmez; \"Bu dağılımı hedef net olarak kaydet\" netleri Hedef sekmesindeki referans netlere yazar ve seni Durum sekmesine götürür. \"Son 3 deneme ortalamasına dön\" başlangıç netlerini geri getirir, \"Sıfırla\" kutuları boşaltır." },
    { h2:"^Bu hesap ne kadar doğru", bas:"Bu hesap ne kadar doğru", ne:"Panelin puan hesabının ÖSYM'nin gerçek hesabından nasıl ayrıldığını anlatan not.", ise:"Hesaplayıcının sonucunu doğru yorumlarsın.", nasil:"ÖSYM standart puan kullanır, panel ise deneme kitapçıklarının ham puan yöntemini; sapma tipik olarak ±10-15 puandır. Sıralama tahmini için değil, net dağılımlarını karşılaştırmak için kullan." },
    { h2:"^YÖK verisinden bölüm seç", bas:"YÖK verisinden bölüm seç", ne:"YÖK Atlas verisinden öğrencinin hedef programını aradığın ve seçtiğin kart.", ise:"Seçtiğin programın taban bilgileri ve ders ders hedef netleri elle yazmadan dolar.", nasil:"İlk açılışta \"Bölüm veritabanını yükle\" de; tarayıcı veriyi saklar. Kutuya en az 3 harf yaz, yalnız öğrencinin alanındaki programlar listelenir; \"seç\" hedef netlerin üstüne yazar, hedef puan ve sıralamayı yalnız boşsa doldurur." },
    { h2:"^Hedef bölüm$", bas:"Hedef bölüm", ne:"Öğrencinin hedefini ve haftalık çalışma beyanını tuttuğun form; bölüm seçildiyse üstte kontenjan ve taban bilgileri görünür.", ise:"Hedef puan Puan hesaplayıcıdaki farkı, haftalık beyan da Konular sekmesindeki yetişir hesabını besler.", nasil:"Değişiklikleri \"Hedefi kaydet\" ile saklarsın; sınav tarihi bütün öğrencilerde ortaktır ve buradan değişmez. Taban puan ve sırayı elle gireceksen \"YÖK Atlas ana sayfa\" siteyi yeni sekmede açar." },
    { h2:"^Referans netler", bas:"Referans netler", ne:"Her dersin soru sayısı ve öğrencinin o dersteki hedef neti.", ise:"Durum sekmesindeki karşılaştırmalar ve konuların öncelik sırası bu netlere dayanır.", nasil:"Bölüm seçince kendiliğinden dolar; bir neti değiştirip \"Referans netleri kaydet\" de. Boş bıraktığın dersin hedefi silinir." },
    { h2:"^Öğrenci hesabı", bas:"Öğrenci hesabı", ne:"Öğrencinin kendi hesabıyla panele bağlanıp bağlanmadığını gösteren ve davet kodunu ürettiğin kart.", ise:"Öğrenci kendi hesabıyla girer; işaretlediği ödevler ve girdiği denemeler sayfayı yenilediğinde senin panelinde görünür.", nasil:"\"Davet kodu üret\" ile kodu al, \"Daveti WhatsApp'la gönder\" ile öğrenciye yolla; kod bir kez kullanılır ve veli onayı eksikken üretilmez. Bağlı hesapta \"Şifre sıfırlama gönder\" öğrenci kaydındaki e-postaya bağlantı yollar, \"Bağlantıyı kes / yeni kod ver\" verilere dokunmadan yeni kod üretir." },
    { h2:"^Veri sorumluluğu", bas:"Veri sorumluluğu", ne:"Bu öğrenci için alınan veli onayının ya da 18 yaşını doldurmuş öğrencinin kendi rızasının kaydı.", ise:"Onay tarihini, veli adını, veli telefonunu ve onay notunu tek yerde tutar; imzalı kâğıt sende kalır.", nasil:"Kaydet düğmesi yok; bir kutuyu değiştirip dışına tıklayınca değişiklik kaydedilir. Öğrenci 18 yaşını doldurduysa ilk listede \"Evet\" seç, veli kutuları kalkar." },
    { h2:"^⚠ Veli onayı eksik", bas:"Veli onayı eksik", ne:"Onay kaydı tamamlanmadan eklenmiş öğrencide çıkan kırmızı çerçeveli onay kartı.", ise:"Kayıt tamamlanana kadar sunucu bu öğrencideki değişiklikleri reddeder ve davet kodu üretilmez; eksiği buradan kapatırsın.", nasil:"Öğrenci 18 yaşından küçükse \"Veli adı soyadı\" ve \"Veli telefonu\" kutularını doldur, 18 yaşını doldurduysa ilk listede \"Evet\" seç. Bilgiler tamamlanınca onay tarihi kendiliğinden yazılır ve kayıt sunucuya gider." },
    { h2:"^Öğrenci kaydı", bas:"Öğrenci kaydı", ne:"Öğrencinin sınıfını ve alanını güncellediğin kart; şifre sıfırlama e-postası da burada durur.", ise:"Alan değişince ders listeleri yeni alana göre kurulur; e-posta, \"Şifre sıfırlama gönder\" bağlantısının gideceği adrestir.", nasil:"Kutuları değiştirip \"Güncelle\" düğmesine bas; bu kartın değişiklikleri yalnız bu düğmeyle kaydedilir. Alan listesinde Sayısal, Eşit Ağırlık, Sözel ve Dil var." },
    { h2:"^Öğrenciyi sil", bas:"Öğrenciyi sil", ne:"Öğrencinin kaydını bütün verileriyle kalıcı olarak silen kart.", ise:"Ayrılan öğrencinin kaydını kaldırırsın; silinen öğrenci kotandan düşer.", nasil:"Önce Hesap sekmesindeki \"Tüm verilerimi indir (.json)\" ile arşiv al, sonra kırmızı düğmeye basıp açılan pencereyi onayla. Silme geri alınamaz; denemeler, ödevler, konu kayıtları ve notlar da gider." },
    { h2:"^Nasıl işliyor", bas:"Nasıl işliyor", ne:"Davetten süre kazanmaya giden dört adımın anlatımı.", ise:"Sayacının ne zaman ilerlediğini ve ödülün nasıl eklendiğini görürsün.", nasil:"Davet ettiğin kişi 7 gün ücretsiz dener; sayaç yalnız o kişi paket aldığında 1 artar. Sen deneme süresindeyken 2 ücretli davet toplarsan hesabın doğrudan 1 yıllık Öğretmen Paketi'ne geçer." },
    { h2:"^Davet ettiklerin", bas:"Davet ettiklerin", ne:"Davet bağlantınla kaydolan koçların listesi.", ise:"Kimin kayıt olduğunu ve kimin pakete geçtiğini görürsün.", nasil:"Her satırda kayıt tarihi ve durum yazar: \"ücretli\" pakete geçmiş, \"deneme\" henüz geçmemiş demektir. Liste sekmeye ilk girişte okunur; yeni kayıtları görmek için sayfayı yenile." },
    { h2:"^(Davet sistemi henüz kurulmamış|Referans bilgin alınamadı|Referans kodun oluşturulmamış)", bas:"Davet bilgisi alınamadı", ne:"Referans bilgin sunucudan okunamadığında sekmede tek başına çıkan uyarı kartı.", ise:"Sorunun sunucu kurulumundan mı yoksa okuma hatasından mı geldiğini yazar.", nasil:"Kartta varsa \"Tekrar dene\" ile bilgiyi yeniden iste. Sorun sürerse Hesap sekmesindeki \"Yönetime mesaj\" kutusundan bildir." },
    { h2:"^Önce profilini tamamla", bas:"Özel ders profili", ne:"Özel ders talebi alabilmek için telefonunu ve branşlarını bir kez kaydettiğin kart.", ise:"Telefonun yalnız dersini kabul ettiğin öğrenciye iletilir; branşların hangi talepleri göreceğini belirler.", nasil:"Telefon kutusuna WhatsApp numaranı yazıp \"Kaydet\" düğmesine bas, sonra ders verdiğin branşlara tıkla. Her tıklama hemen kaydedilir; branş seçmezsen talep görmezsin." },
    { h2:"^Branşlarım", bas:"Branşlarım", ne:"Özel ders talebi almak için seçtiğin branşlar.", ise:"Açık talepler listesinde yalnız bu branşlardaki talepler görünür.", nasil:"Bir branşa tıklayınca seçilir ya da seçimi kalkar, değişiklik hemen kaydedilir. Seçili branşların önünde onay işareti durur." },
    { h2:"^Açık talepler", bas:"Açık talepler", ne:"Branşlarında öğrencilerin açtığı ve henüz kimsenin kabul etmediği özel ders talepleri.", ise:"Talebin ayrıntısını ve öğrencinin özel ders geçmişini görüp sana uygun olanı alırsın; öğrencinin adı ve telefonu kabul edene kadar gizlidir.", nasil:"\"Dersi kabul et\" düğmesine basıp onaylayınca öğrencinin numarası açılır ve WhatsApp hazır mesajla açılır. Liste sekmeye girişte okunur; yeni talepler için \"↻ Listeyi yenile\" bağlantısına bas." },
    { h2:"^Kabul ettiğim dersler", bas:"Kabul ettiğim dersler", ne:"Kabul ettiğin ve henüz kapatmadığın özel dersler; öğrencinin adı burada görünür.", ise:"Dersi öğrenciyle ayarlar, sonucuna göre kapatırsın.", nasil:"\"WhatsApp'tan yaz\" öğrenciyle yazışmayı açar; ders olunca \"✓ Dersi bitirdim\", öğrenci gelmezse \"Öğrenci gelmedi\", anlaşamazsan \"Vazgeç\" de. \"Gelmedi\" öğrencinin geçmişine işlenir ve 2 gelmedide talep açması kilitlenir; \"Vazgeç\" talebi yeniden yayına döndürür." },
    { h2:"^Geçmiş derslerim", bas:"Geçmiş derslerim", ne:"Bitirdiğin ya da öğrenci gelmedi diye kapattığın özel dersler.", ise:"Öğrenciyi puanlarsın ve öğrencinin dersi yıldızla onaylayıp onaylamadığını görürsün.", nasil:"\"Senin puanın\" satırında 1 ile 5 arasında yıldız ver; puan bir kez verilir. Sorun yaşadıysan \"⚑ Sorun bildir\" ile bir başlık seçip kısaca yaz, bildirim Biyoser yönetimine gider." },
    { h2:"^Yönetime mesaj", bas:"Yönetime mesaj", ne:"Biyoser yönetimiyle yazıştığın mesaj kutusu.", ise:"Sorun ya da önerini yazarsın, yönetimin cevabı aynı kutuda görünür.", nasil:"Metni yazıp \"Gönder\" düğmesine bas; tek tik iletildiğini, çift tik okunduğunu gösterir. Cevap gelince menüdeki Hesap düğmesinin yanında kırmızı sayı çıkar; sayı panel açılırken güncellenir." },
    { h2:"^Rehber ve kılavuz", bas:"Rehber ve kılavuz", ne:"Başlangıç rehberini ve kullanım kılavuzunu açan iki düğme.", ise:"İlk öğrencini eklerken izleyeceğin adımlara ya da panelin sekme sekme anlatımına dönersin.", nasil:"\"Başlangıç rehberini aç\" ilk girişteki rehber penceresini yeniden açar. \"Kullanım kılavuzunu aç\" menüdeki Kullanım kılavuzu sekmesini getirir." },
    { h2:"^Görünüm", bas:"Görünüm", ne:"Panelin renk temasını seçtiğin kart.", ise:"Paneli göz zevkine ya da ortamın ışığına göre ayarlarsın.", nasil:"Açık, Gece, Sıcak Kum ve Lacivert seçeneklerinden birine tıkla. Seçim bu cihazda saklanır, başka cihazda yeniden seçmen gerekir." },
    { h2:"^Hesap ve lisans", bas:"Hesap ve lisans", ne:"Giriş e-postanı, hesap durumunu, kalan gün sayını ve kayıtlı cihaz sayını gösteren kart.", ise:"Paketini ve öğrenci kotanın ne kadarının dolduğunu da buradan izlersin.", nasil:"Tablodaki \"sil\" düğmesi kullanmadığın cihazın kaydını kaldırır; şu an kullandığın cihaz silinemez. \"Şifremi değiştir\" en az 8 karakterlik yeni şifre ister." },
    { h2:"^İletişim bilgilerin", bas:"İletişim bilgilerin", ne:"Adını ve WhatsApp numaranı yazdığın kart; kurum adı isteğe bağlıdır.", ise:"KVKK belgelerinde veri sorumlusu ve iletişim bilgisi olarak bunlar yazar; öğrencilerin sana bu numaradan ulaşır.", nasil:"Kutuyu doldurup dışına tıklayınca bilgi kaydedilir. Ad ya da numara eksikse kartta sarı uyarı çıkar, ikisi de tamsa \"Bilgilerin tam\" yazar." },
    { h2:"^KVKK belgeleri", bas:"KVKK belgeleri", ne:"Aydınlatma metnini ve veli onay formunu adınla hazırlayıp yazdırılabilir açan kart.", ise:"Veliye vereceğin aydınlatma metnini ve imzalatacağın onay formunu hazır alırsın.", nasil:"\"Aydınlatma metni\" ve \"Veli onay formu\" belgeyi yeni sekmede açar, \"İkisini birlikte\" ikisini art arda koyar; açılan sayfadaki \"Yazdır / PDF kaydet\" ile yazdırırsın. Panel onay kaydını tutar, imzalı kâğıdı sen saklarsın." },
    { h2:"^Örnek öğrenci", bas:"Örnek öğrenci", ne:"Sistemi tanıman için hazırlanmış örnek kayıtların listede görünüp görünmeyeceğini seçtiğin kart.", ise:"Örnekler kotana sayılmaz; işin bitince öğrenci listeni sadeleştirirsin.", nasil:"\"Örnek öğrencileri listeden kaldır\" örnekleri bu cihazdaki listeden kaldırır. Geri istersen aynı karttaki \"Örnek öğrenciyi geri getir\" düğmesine bas." },
    { h2:"^Verilerim", bas:"Verilerim", ne:"Bütün öğrencilerinin kayıtlarını tek dosya olarak indirdiğin kart.", ise:"Veriler zaten sunucuda durur; dosya arşivlemek ya da başka yere taşımak içindir.", nasil:"\"Tüm verilerimi indir (.json)\" dosyayı bilgisayarına indirir. Bir öğrenciyi silmeden önce indirmen önerilir." },
    { h2:"^Kullanım videoları", bas:"Kullanım videoları", ne:"Panelin kullanımını anlatan kısa videoların listesi.", ise:"Bir işin nasıl yapıldığını okumadan, ekranda izleyerek öğrenirsin.", nasil:"Bir videoya tıkla, bu sayfanın içinde açılır; \"Kapat\" ile kapanır. Açılmazsa altındaki \"YouTube'da aç\" bağlantısını kullan." },
    { h2:"^Kullanım kılavuzu", bas:"Kullanım kılavuzu", ne:"Kılavuzun giriş kartı; menünün nasıl düzenlendiğini anlatır.", ise:"Hangi sekmenin öğrenciye ait, hangisinin öğrenciden bağımsız olduğunu öğrenirsin.", nasil:"Menüden bir öğrenci seçince onun sekmeleri adının altında açılır. Kokpit ile menünün \"Hesap\" başlığındaki sekmeler öğrenci seçmeden açılır." },
    { h2:"^⚠ Doldurulmazsa çalışmayan yerler", bas:"Doldurulmazsa çalışmayan yerler", ne:"Boş bırakıldığında panelin hesaplarını bozan alanları sıralayan uyarı kartı.", ise:"Bir kutu çizgi gösterdiğinde sebebini buradan bulursun.", nasil:"Kırmızı maddeler hangi boş alanın neyi bozduğunu ve alanın hangi sekmede olduğunu yazar. Örneğin haftalık çalışma saati boşsa \"Yetişir mi\" kutuları çizgi olarak kalır." },
    { h2:"^(Kokpit$|.+ sekmesi)", bas:"Sekme anlatımları", ne:"Panelin sekmelerini menüdeki sırayla anlatan kartlar; her kartın başlığı sekmenin adını taşır.", ise:"Bir sekmenin ne yaptığını ve dikkat isteyen noktalarını ayrı ayrı okursun.", nasil:"Aşağı kaydırarak sekmeleri menüdeki sırayla oku; renkli kutular o sekmenin uyarılarıdır. Sayfada içindekiler listesi ya da arama kutusu yok." },
    { h2:"^Sık karşılaşılan durumlar", bas:"Sık karşılaşılan durumlar", ne:"Sık karşılaşılan sekiz sorunu ve çözümlerini sıralayan kart.", ise:"Bir şey beklediğin gibi çalışmadığında çözümü sekmeleri dolaşmadan bulursun.", nasil:"Sorunu başlıklardan bul, altındaki çözümü uygula. Örneğin \"Davet kodu üretilmiyor\" başlığı veli onayı kartının eksik olduğunu söyler." },
    { h2:"^Üç kural", bas:"Üç kural", ne:"Kılavuzun son kartı; paneli kullanırken uyulacak temel kurallar.", ise:"Günlük işleyişin özünü kısaca hatırlarsın.", nasil:"Güne Kokpit'le başla, haftalık ödev toplamını öğrencinin beyan ettiği süreyle sınırla. Zayıf konu kartında %50'nin altında kalan konuyu bitmiş sayma." },
    { sec:"button[onclick^=\"kocSek\"][onclick*=\"ogrenci\"]", bas:"Veli onayı eksik", ne:"Seçili öğrencinin veli onayı tamamlanmadığında sekmenin tepesinde çıkan kırmızı şerit.", ise:"Onay tamamlanana kadar bu öğrencide yaptığın işlemlerin sunucuya kaydedilmediğini bildirir.", nasil:"\"Veli onayı kartını aç\" seni Öğrenci bilgileri sekmesindeki onay kartına götürür." },
    { sec:"a[onclick^=\"ornekGizle\"]", bas:"Örnek kayıt uyarısı", ne:"Seçili öğrencinin sistemi tanıtmak için hazırlanmış örnek kayıt olduğunu söyleyen uyarı.", ise:"Örnek öğrencide yaptığın değişikliklerin kaydedilmediğini ve kotana sayılmadığını hatırlatır.", nasil:"Sekmeleri gezip panelin dolu hâlini görebilirsin. İşin bitince \"Listeden kaldır\" ile örneği gizlersin; Hesap sekmesindeki \"Örnek öğrenci\" kartından geri getirebilirsin." },
    { sec:"button:not(.wide)[onclick^=\"demoBitir\"]", bas:"Tanıtım modu", ne:"Panelin tanıtım modunda açıldığını gösteren şerit.", ise:"Beş örnek öğrenciyle sekmeleri kayıt yapmadan denersin.", nasil:"Menüden öğrenci değiştirip sekmeleri gez; hiçbir şey kaydedilmez. \"Kendi hesabımı açayım\" seni kayıt ekranına götürür." },
    { sec:"[onclick^=\"ABONE=true\"]", bas:"Kullanım süresi uyarısı", ne:"Kullanım sürenin dolduğunu ya da bitmesine 7 gün veya daha az kaldığını bildiren uyarı.", ise:"Süre dolunca yeni kayıt yapılamayacağını önceden görürsün.", nasil:"Süre dolduysa verilerin okunur ama ödev veremez, kayıt yapamazsın; öğrencilerin de panellerine yazamaz. \"Paketleri gör\" paket seçimine götürür." },
    { tab:"kokpit", sec:".stats", bas:"Risk şeridi", ne:"Toplam öğrenci sayın ve öğrencilerinin üç risk grubuna göre dağılımı.", ise:"Kaç öğrencinin bugün müdahale beklediğini tablonun tamamına bakmadan görürsün.", nasil:"Kutular yalnız sayar, tıklanmaz; adlar alttaki tabloda. Öğrencinin yeni işaretlediği ödev ya da girdiği deneme sayılara sayfayı yenileyince yansır." },
    { tab:"durum", sec:".stats", bas:"Durum özeti", ne:"Son üç denemenin toplam net ortalaması, hedef toplam net, ikisi arasındaki fark ve bu haftanın ödev uyumu.", ise:"Öğrencinin hedefe göre nerede durduğunu ve bu haftaki ödev düzenini tek satırda okursun.", nasil:"Ortalama her dersin son üç denemedeki netinden alınır, branş denemeleri sayılmaz; hedef toplam net Hedef sekmesindeki ders hedeflerinin toplamıdır. Bu hafta hiç ödev verilmediyse uyum kutusunda \"ödev yok\" yazar." },
    { tab:"durum", sec:"svg[height=\"96\"]", bas:"Ders ders net seyri", ne:"Deneme girilmiş her dersin denemeden denemeye netini gösteren küçük grafik.", ise:"Toplam netin arkasında hangi dersin geride kaldığını ayırt edersin.", nasil:"Kartın başında son net ve hedef net yazar, aradaki fark parantez içindedir; eksi fark kırmızıdır. Bu grafiklere branş denemeleri de girer." },
    { tab:"konu", sec:".stats:not(.uc)", bas:"Konuların özeti", ne:"Kalan ve biten konu sayısı, haftalık çalışma beyanı ve sınava kalan hafta; altında kalan sürenin iki ayrı hesabı durur.", ise:"Kalan işin kaç saat tuttuğunu ve haftada kaç saat gerektirdiğini öğrencinin beyanıyla yan yana görürsün.", nasil:"Soldaki iki sayı yalnız konu çalışmasını sayar, sağdaki iki sayı buna hedeflenen soru çözümünü ekler; plan yaparken sağdakine bak. İşleniyor konular yarım, eksik konular %70 süreyle sayılır; beyan boşsa Hedef sekmesindeki \"Haftalık çalışma saati (beyan)\" kutusunu doldur." },
    { tab:"puan", sec:"#pvYer", bas:"Puan özeti", ne:"Tablodaki netlerle hesaplanan TYT puanı, yerleştirme puanı, OBP katkısı ve hedef puana fark.", ise:"Bir net dağılımının öğrenciyi hedef puana taşıyıp taşımadığını görürsün.", nasil:"İlk iki puana OBP dahildir. Hedef puan Hedef sekmesindeki \"Hedef puan\" kutusundan gelir; fark eksideyse kırmızı, değilse yeşil yazılır." },
    { tab:"veli", sec:"#veliNot", bas:"Haftalık veli raporu", ne:"Seçili öğrencinin bu haftasını panelin verisinden özetleyen, veliye gidecek rapor.", ise:"Veliyi ödev uyumu, deneme gidişatı, konu ilerlemesi ve önümüzdeki haftanın planıyla her hafta bilgilendirirsin.", nasil:"\"Koçun notu\" taslağını düzenleyip \"WhatsApp'ta gönder\" ya da \"PDF / Yazdır\" düğmesine bas; WhatsApp veli telefonuyla, o yoksa öğrencinin numarasıyla açılır ve mesajı sen gönderirsin. Not kaydedilmez, sekmeden ayrılırsan taslak yeniden yazılır; öğrencinin son girdileri için raporu açmadan önce sayfayı yenile." },
    { tab:"ogrenci", sec:":scope > .body:first-child > .flag.bad:only-child", bas:"Onayı eksik öğrenciler", ne:"Veli onayı kaydı tamamlanmamış bütün öğrencilerini adlarıyla sıralayan kırmızı uyarı.", ise:"Sunucunun değişikliklerini kaydetmediği öğrencileri tek yerde görürsün.", nasil:"Listedeki her öğrenciyi menüden seçip bu sayfadaki \"Veli onayı eksik\" kartını doldur. Son öğrencinin onayı tamamlanınca uyarı kalkar." },
    { tab:"davet", sec:"[role=progressbar]", bas:"Davet bağlantın", ne:"Referans kodunu taşıyan davet bağlantını ve bir sonraki ödül yılına kalan yolu gösteren kart.", ise:"Öğretmen arkadaşlarını davet edersin, öğrencini değil; her 2 ücretli davet için lisansına kendiliğinden 1 yıl eklenir.", nasil:"\"WhatsApp'tan davet gönder\" hazır mesajla WhatsApp'ı açar, kişiyi sen seçersin; \"Bağlantıyı kopyala\" bağlantıyı panoya alır. Bağlantıyla gelen kişide kod kendiliğinden dolar, elle kaydolan kayıt ekranında kodu yazar." },
    { tab:"davet", sec:".stats", bas:"Davet sayıları", ne:"Davet ettiğin, pakete geçen, kazandığın yıl ve sonraki yıla kalan davet sayılarını gösteren dört kutu.", ise:"Davetlerinin ne kadarının ödüle dönüştüğünü tek bakışta izlersin.", nasil:"\"Pakete geçen\" yalnız ücretli aboneleri sayar ve ödül bu sayıya göre verilir. Sayılar sekmeye ilk girişte okunur; güncel hâli için sayfayı yenile." },
    { tab:"davet", sec:":scope > .body:first-child > .flag:only-child", bas:"Seni davet eden", ne:"Kayıt olurken kullandığın referans kodunun sonucunu ve seni kimin davet ettiğini gösteren kart.", ise:"Pakete geçtiğinde seni davet eden koçun sayacının ilerleyeceğini bilirsin.", nasil:"Kart yalnız bir referans koduyla kaydolduysan çıkar. Kod uygulanamadıysa kırmızı uyarı görünür; bağlantı hatasıysa sayfayı yenilediğinde kod yeniden denenir." },
    { tab:"ozel", sec:":scope > .body:first-child > .flag.bad", bas:"Özel ders erişimi kapalı", ne:"Yönetim özel ders erişimini kapattığında sekmede tek başına çıkan kart.", ise:"Erişimin neden kapatıldığını görürsün.", nasil:"Kartta gerekçe yazar. İtiraz için \"Biyoser'e yaz\" bağlantısı WhatsApp'ı hazır mesajla açar." }
  ];

  var OGR = [
    { h2:/^Geçen haftalardan kalanlar/, bas:'Geçen haftalardan kalanlar',
      ne:'Önceki haftalarda verilip "Yaptım" işaretlemediğin ödevler.',
      ise:'Biriken işlerin unutulmaz.',
      nasil:'Ödevi bitirince "Yaptım" de. İşaretleyene kadar her hafta burada kalır.' },
    { h2:/^Bu haftanın konu ödevleri/, bas:'Bu haftanın konu ödevleri',
      ne:'Öğretmeninin bu hafta verdiği konu ödevleri.',
      ise:'Hangi konuyu çalışacağını ve kaç soru çözeceğini gösterir.',
      nasil:'Her ödev için "Yaptım", "Yarım" ya da "Yapamadım" seç; soru hedefi varsa doğru, yanlış ve boş sayını da gir. Öğretmenin panelini yenileyince görür.' },
    { h2:/^Sabit rutin/, bas:'Sabit rutin',
      ne:'Her hafta tekrarlanan işler; örneğin paragraf ve problem soruları.',
      ise:'Düzenli pratik yapmanı sağlar.',
      nasil:'Hafta içinde çözdüğün soru sayısını gir; çubuk hedefe ne kadar yaklaştığını gösterir.' },
    { h2:/^Kendi çalışmam/, bas:'Kendi çalışmam',
      ne:'Öğretmeninin vermediği ama kendi başına çalıştığın konular.',
      ise:'Kendi çalışman da kayda geçer, öğretmenin de görür.',
      nasil:'Dersi, üniteyi ve konuyu seçip ekle; eklediğin çalışma yapılmış sayılır.' },
    { h2:/^Kendime rutin ekle/, bas:'Kendime rutin ekle',
      ne:'Her hafta tekrar eden, konuya bağlı olmayan kendi işlerin; örneğin paragraf ya da kelime çalışması.',
      ise:'Düzenli çalışmanı haftalık planına bağlarsın.',
      nasil:'Dersi ve rutinin adını yazıp ekle. Rutin, Sabit rutin kartına ve Programım takvimine kendiliğinden düşer.' },
    { h2:/^Kendine ödev ver/, bas:'Kendine ödev ver',
      ne:'Öğretmenin yoksa hedefine göre sıradaki konular.',
      ise:'Planını kendin kurarsın.',
      nasil:'Soru sayısını yaz ya da boş bırak, sonra listeden konuyu ödev olarak ekle.' },
    { h2:/^Tamamladıkların/, bas:'Tamamladıkların',
      ne:'Bitirip listeden çıkardığın ödevler.',
      ise:'Kaydın durur; öğretmenin hepsini görür.',
      nasil:'"Listeyi göster" ile açılır. Yanlışlıkla bitirdiysen "geri al" ile listeye döndür.' }
,

    // ---- Kalan sekmeler (ajanların yazdığı, kodla doğrulanmış) ----
    { tab:"konu", h2:"^Yetişir mi\\W+yalnız konu", bas:"Yetişir mi: yalnız konu", ne:"Soru çözümü hariç, kalan konuları bitirmeye haftalık çalışma sürenin yetip yetmediği.", ise:"Konuları sınava kadar bitirip bitiremeyeceğini görürsün.", nasil:"Hedefe uzaklık sekmesindeki \"Hedefim\" kartına haftalık çalışma süreni girmezsen kutular boş kalır. Sağdaki iki sütun gereken süreye %15 ve %30 pay ekleyerek hesaplar." },
    { tab:"konu", h2:"^Yetişir mi\\W+konu \\+ soru", bas:"Yetişir mi: konu ve soru", ne:"Konuları bitirip hedeflenen soruları da çözmeye haftalık sürenin yetip yetmediği.", ise:"Sınava hazır olup olamayacağını gösterir.", nasil:"Sağdaki iki sütun aksamalara yer kalsın diye gereken süreye %15 ve %30 pay ekler. Soldaki kart \"Yetişir\", bu kart \"Yetişmez\" diyorsa konuları bitirirsin ama yeterince soru çözemezsin." },
    { h2:"^Ders ders durumun", bas:"Ders ders durumun", ne:"Her dersin bitirdiğin, kalan ve eksik konuları ile tahmini süresi.", ise:"Hangi derste geride kaldığını karşılaştırırsın.", nasil:"Bir satıra dokununca o dersin konuları aşağıda açılır. \"Tamamlanma\" çubuğu dersin bitirdiğin konularının payıdır." },
    { h2:"^Karneni yapıştır", bas:"Karneni yapıştır", ne:"Deneme karnenin PDF'ini ya da metnini okutup netleri dolduran kutu.", ise:"Doğru ve yanlış sayılarını tek tek elle yazmaktan kurtarır.", nasil:"Karneyi \"PDF yükle\" ile seç ya da metnini kopyalayıp yapıştır, sonra \"Karneyi oku\" de. Okunan sayılar deneme formuna yazılır; kontrol edip \"Denemeyi kaydet\"e bas." },
    { tab:"deneme", h2:"^(TYT|AYT|Branş) denemesi", bas:"Deneme girişi", ne:"Denemenin ders ders doğru ve yanlış sayılarını girdiğin form.", ise:"Netlerin kaydedilir; gelişim grafiklerin ve hedef karşılaştırmaların bu kayıtlarla dolar.", nasil:"Tarihi ve deneme adını yaz, en az bir dersin doğru ve yanlışını doldurup \"Denemeyi kaydet\"e bas. Net, doğrudan yanlışın dörtte biri çıkarılarak hesaplanır; öğretmenin panelini yenileyince görür." },
    { h2:"^Yanlış ve boş konular", bas:"Yanlış ve boş konular", ne:"Seçtiğin denemede yanlış ya da boş bıraktığın konuların listesi.", ise:"Öğretmeninin karneden girdiği konuları görür, kendi fark ettiklerini eklersin.", nasil:"Dersi ve konuyu seç, adedi ve \"Konudan soru\" sayısını yazıp \"Konuyu ekle\" de; soru sayısı boş kalırsa doğru oranı hesaplanmaz. Öğretmeninin girdiklerini silemezsin, yalnız \"senin\" etiketli satırları silebilirsin." },
    { h2:"^Zayıf konular", bas:"Zayıf konular", ne:"Deneme konu analizlerinde doğru oranı %50'nin altında kalan konular.", ise:"Hangi konunun gerçekten eksik olduğunu görürsün; konunun kaç kez çıktığı değil, ne kadarını doğru yaptığın ölçülür.", nasil:"Oran yalnız konudan çıkan soru sayısı girilmiş denemelerden hesaplanır. Bitirdiğini işaretlediğin bir konu burada görünüyorsa Konularım sekmesinde \"Eksiğim var\" yap." },
    { h2:"^Son \\d+ deneme", bas:"Son denemeler, ders bazında", ne:"Branş dışındaki son 3 denemende her dersin netini hedefinle karşılaştıran tablo.", ise:"Hangi derste hedefin gerisinde kaldığını görürsün.", nasil:"\"Seyir\" sütunu netlerini eskiden yeniye sıralar. \"Fark\" ortalamanın hedef netten uzaklığıdır; kırmızıysa gerisindesin." },
    { h2:"^Geçmiş denemeler", bas:"Geçmiş denemeler", ne:"Senin ve öğretmeninin girdiği bütün denemeler, ders ders net ve toplamla.", ise:"Deneme geçmişini tek tabloda görür, bir denemenin konularına inersin.", nasil:"\"konu gir\" ya da \"konular\" düğmesi o denemenin yanlış ve boş konular kartını açar. \"sil\" onay sorar; öğretmeninin girdiği bir denemeyi silersen onun panelinden de silinir." },
    { h2:"^Durumun", bas:"Durumun", ne:"Öğretmeninin panelinde seni özetleyen satırın aynısı.", ise:"Son deneme ortalamalarını ve ödev düzenini tek bakışta görürsün.", nasil:"Ödev uyumu \"Yaptım\" işaretli ödevlerin payıdır, \"Yarım\" kalanlar yarım sayılır. Uyum %60'ın altına düşer ya da 6 ödev devrederse durum \"Acil\" olur." },
    { h2:"^Çözdüğün soru", bas:"Çözdüğün soru", ne:"Ödevlerinde çözdüğünü yazdığın soruların ders ders toplamı.", ise:"Hangi derse ne kadar soru çözdüğünü karşılaştırırsın.", nasil:"Ödevlerim sekmesinde çözdüğün soru sayısını girdikçe çubuklar uzar. En çok soru çözdüğün ders en üstte durur." },
    { h2:"^TYT gelişimin", bas:"TYT gelişimin", ne:"TYT denemelerindeki toplam netinin deneme deneme grafiği.", ise:"Netinin yükselip yükselmediğini görürsün.", nasil:"Her nokta bir denemedir, altında tarihi yazar. Üstteki satır son netini ve ilk denemene göre farkını gösterir." },
    { h2:"^.*AYT gelişimin", bas:"AYT gelişimin", ne:"Kendi alanındaki AYT denemelerinin toplam netinin grafiği.", ise:"AYT'de ilerleyip ilerlemediğini görürsün.", nasil:"Her nokta bir denemedir; yalnız kendi alanının dersleri sayılır. Üstteki satır son netini ve ilk denemene göre farkını gösterir." },
    { h2:"^Branş denemelerin", bas:"Branş denemelerin", ne:"Tek dersten çözdüğün branş denemeleri ve netleri.", ise:"Branş çalışmanı TYT ve AYT grafiklerine karıştırmadan izlersin.", nasil:"En yeni deneme en üsttedir. Branş denemesini \"Denememi gir\" sekmesinde \"Branş\" seçerek girersin." },
    { h2:"^Bölüm seç", bas:"Bölüm seç", ne:"YÖK verisinden hedef bölümünü aradığın kutu.", ise:"Bölümü seçince hedef puanın ve ders ders hedef netlerin kendiliğinden dolar.", nasil:"\"Bölüm listesini yükle\" de, en az 3 harf yazıp ara ve \"seç\" düğmesine bas. Yalnız kendi alanının bölümleri listelenir; liste bulunamazsa hedefini \"Hedefim\" kartına elle yaz." },
    { h2:"^Hedefim", bas:"Hedefim", ne:"Hedeflediğin bölümü ve haftalık çalışma süreni tuttuğun kart.", ise:"Hedef karşılaştırmaları ve yetişir mi hesapları bu bilgilerle yapılır; sınav tarihi ortaktır, öğretmenin belirler.", nasil:"\"Haftalık çalışma sürem\" kutusuna ders dışında haftada kaç saat çalıştığını yaz; boş kalırsa \"Yetişir mi\" kutuları boş kalır. Hedef puan, seçtiğin bölümün taban puanının altındaysa kabul edilmez." },
    { h2:"^Ders ders hedef net", bas:"Ders ders hedef net", ne:"Hedef bölümün için her dersten kaç net gerektiğini gösteren tablo.", ise:"Hedef karşılaştırmaları bu netlere göre yapılır.", nasil:"Bölüm seçince kendiliğinden dolar. \"Hedef net\" kutusunu elle de değiştirebilirsin." },
    { h2:"^TYT net seyri", bas:"TYT net seyri", ne:"TYT denemelerindeki toplam netinin grafiği.", ise:"Hedefine giderken TYT netinin gidişini görürsün.", nasil:"Her nokta bir denemedir; üstteki satır deneme sayısını ve son netini yazar. Deneme girdiğinde görünür." },
    { h2:"^.*AYT net seyri", bas:"AYT net seyri", ne:"Kendi alanındaki AYT denemelerinin toplam netinin grafiği.", ise:"Hedefine giderken AYT netinin gidişini görürsün.", nasil:"Her nokta bir denemedir; üstteki satır deneme sayısını ve son netini yazar. Deneme girdiğinde görünür." },
    { h2:"^Ders ders hedefe uzaklık", bas:"Ders ders hedefe uzaklık", ne:"Her dersteki ortalama netini hedef netinle yan yana gösteren çubuklar.", ise:"Hangi derste ne kadar açığın olduğunu görürsün.", nasil:"Mavi çubuk son denemelerinin (en çok 3) ortalaması, turuncu çizgi hedefin; sağdaki son sayı aradaki farktır. Hedef neti girilmemiş derste fark boş kalır." },
    { tab:"odev", h2:"^Bu haftanın planı", bas:"Bu haftanın planı", ne:"Sınava yetişmen için sistemin bu hafta önerdiği konular.", ise:"Öğretmenin olmadığı için haftalık ödevini bu planı kabul ederek alırsın.", nasil:"Plan uygunsa \"Bu haftanın ödevlerini bana ver\" düğmesine bas; ödevler oluşur ve Programım takvimine dağıtılır. Ödevini erken bitirirsen aynı düğmeden sıradaki konuları alabilirsin." },
    { tab:"odev", h2:"^Bitirdin ama tutmamış", bas:"Bitirdin ama tutmamış", ne:"İşliyorum ya da Bitirdim işaretlediğin halde denemelerde doğru oranın %50'nin altında kalan konular.", ise:"Bitti sandığın ama henüz oturmamış konuları yakalarsın.", nasil:"Öğretmenin yoksa satırdaki \"Ödeve ekle\" ile konuyu kendine ödev verirsin. Öğretmenin varsa bu listeyi onunla konuş; ödevi o verir." },
    { tab:"program", h2:"^Haftalık programım", bas:"Haftalık programım", ne:"Bu haftanın ödevlerinin 15 dakikalık dilimlerle günlere yerleştirildiği takvim.", ise:"Hangi gün, hangi saatte ne çalışacağını gösterir.", nasil:"Müsait olmadığın saatleri \"Saat aç / kapat\" ya da \"Saatlerimi kur\" düğmeleriyle kapat, blokları sürükleyerek taşı. \"Yeniden dağıt\" elle taşıdığın blokları yerinde bırakıp gerisini baştan yerleştirir; bir bloğa tıklarsan o konunun anlatım videoları açılır." },
    { h2:"^Diploma notun", bas:"Diploma notun (OBP)", ne:"Diploma notunu girdiğin ve OBP'nin hesaplandığı kart.", ise:"Diploma notun puanına eklenir; girmezsen puan hesabı eksik kalır.", nasil:"Notunu 100 üzerinden yaz; OBP notun 5 katı olarak kendiliğinden dolar ve kaydedilir. Geçen yıl bir yere yerleştiysen \"Geçen yıl bir üniversiteye yerleştim\" kutusunu işaretle, OBP katkısı yarıya iner." },
    { h2:"^Net dağılımı", bas:"Net dağılımı", ne:"Her dersin netini, katsayısını ve puana katkısını gösteren deneme tablosu.", ise:"Hangi dersten kaç net yaparsan hedef puana ulaşacağını denersin.", nasil:"Tablo son 3 denemenin ortalamasıyla açılır, bir neti değiştirince puanlar hemen yeniden hesaplanır. Bu netler kendiliğinden kaydedilmez; beğendiğin dağılımı \"Bu dağılımı hedef net olarak kaydet\" ile hedef netlerine yazarsın." },
    { h2:"^Hedef puanı değiştir", bas:"Hedef puanı değiştir", ne:"Hedef puanını değiştirdiğin kart; yanında seçili bölümün taban puanı durur.", ise:"Hedef puanınla hedef bölümünü birbiriyle tutarlı tutar.", nasil:"Yeni puanı \"Hedef puan\" kutusuna yaz. Seçili bölümün tabanından düşük bir puan kabul edilmez; hedefini düşürmek istiyorsan önce \"Hedefe uzaklık\" sekmesinden o puana uyan bir bölüm seç." },
    { h2:"^Bu hafta ne yaptın", bas:"Bu hafta ne yaptın", ne:"Ödevlerini hangi durumda işaretlediğini sayan ve rapora girecek denemelerini gösteren özet.", ise:"Raporu göndermeden önce durumunu bir bakışta görürsün.", nasil:"Sayılar Ödevlerim sekmesindeki işaretlerinden gelir, burada değiştirilmez. Bir ödevi düzeltmek için Ödevlerim sekmesine dön." },
    { h2:"^Öğretmenine not", bas:"Öğretmenine not", ne:"Öğretmenine haftan hakkında yazdığın kısa not.", ise:"Nerede takıldığını öğretmenine söylersin.", nasil:"Kutuya yaz; not raporla birlikte gönderilir. Tek cümle yeter, örneğin hangi konuyu anlamadığını yaz." },
    { h2:"^Raporu gönder", bas:"Raporu gönder", ne:"Haftalık raporunu kod olarak öğretmenine ilettiğin kart.", ise:"Hesabın olmadan kullanırken işaretlerin öğretmenine bu yolla ulaşır.", nasil:"\"Öğretmenime WhatsApp'tan gönder\" WhatsApp'ı mesaj hazır açar; istersen \"Kodu kopyala\" ile kodu kendin yapıştırırsın. Kodun tamamını gönder, ortasından kesme." },
    { h2:"^Yeni paket yükle", bas:"Yeni paket yükle", ne:"Öğretmeninin gönderdiği yeni davet kodunu yapıştırdığın kutu.", ise:"Ödev listeni yenilersin; konu işaretlerin ve denemelerin korunur.", nasil:"Kodun tamamını kutuya yapıştırıp \"Paketi yükle\" düğmesine bas. Aynı kodu ikinci kez yüklersen panel bunu söyler ve bir şey eklenmez." },
    { tab:"ayar", h2:"^Kullanım kılavuzu", bas:"Kullanım kılavuzu", ne:"Tam kullanım kılavuzunu açan kısa yol.", ise:"Panelin her sekmesini anlatan sayfaya tek dokunuşla gidersin.", nasil:"\"Kılavuzu aç\" düğmesine bas; kılavuz kendi sekmesinde açılır." },
    { h2:"^Sürüm", bas:"Sürüm", ne:"Kullandığın panel sürümünün adı.", ise:"Öğretmenin yeni sürüm olduğunu söylediğinde güncel olup olmadığını anlarsın.", nasil:"Yeni sürüm için sayfayı yenile: telefonda sayfayı aşağı çek, bilgisayarda Ctrl+F5'e bas. Yenilemek verilerini silmez." },
    { h2:"^Verilerim", bas:"Verilerim", ne:"Bu cihazdaki bilgilerini dosyaya yedeklediğin ve geri yüklediğin kart.", ise:"Telefon değiştirdiğinde ya da tarayıcı verisi silindiğinde bilgilerini geri getirirsin.", nasil:"\"Yedek indir (.json)\" bir yedek dosyası indirir. \"Yedek yükle\" ile o dosyayı seçersen panel onay sorar ve şimdiki verilerinin yerine yedeği koyar." },
    { h2:"^Yönetime mesaj", bas:"Yönetime mesaj", ne:"Biyoser yönetimiyle yazıştığın mesaj kutusu.", ise:"Panelle ilgili sorunlarını ve önerilerini yönetime iletirsin; ders ve konu sorularını ise öğretmenine sor.", nasil:"Mesajını yazıp \"Gönder\" düğmesine bas. Cevap geldiyse paneli açtığında ya da yenilediğinde Yardım sekmesinin yanında bir sayı çıkar." },
    { h2:"^Başlangıç rehberi", bas:"Başlangıç rehberi", ne:"İlk girişte açılan 5 adımlık tanıtım kutusu.", ise:"Panele nereden başlaman gerektiğini hatırlatır.", nasil:"\"Başlangıç rehberini aç\" düğmesine bas. Kutuyu sağ üstteki çarpıyla ya da Esc tuşuyla kapatırsın." },
    { h2:"^Görünüm", bas:"Görünüm", ne:"Panelin renk temasını seçtiğin kart.", ise:"Gözüne en rahat gelen renklerle çalışırsın.", nasil:"Bir temaya dokun, panel o renge geçer. Seçimin yalnız bu cihazda saklanır." },
    { h2:"^Kullanım videoları", bas:"Kullanım videoları", ne:"Panelin kullanımını anlatan kısa videolar.", ise:"Bir özelliği okumak yerine izleyerek öğrenirsin.", nasil:"Bir videonun adına bas, video bu sayfada açılır; \"Kapat\" ile kapatırsın. Video açılmazsa altındaki \"YouTube'da aç\" bağlantısını kullan." },
    { h2:"^Kısa kılavuz", bas:"Kısa kılavuz", ne:"Panelin sekmelerini birer satırla özetleyen liste.", ise:"Aradığın işin hangi sekmede olduğunu hızlıca bulursun.", nasil:"Ayrıntılı anlatım için en alttaki \"Tam kullanım kılavuzunu aç\" düğmesine bas." },
    { h2:"^Takıldın mı", bas:"Takıldın mı?", ne:"Öğretmenine WhatsApp'tan yazmanı sağlayan kısa yol.", ise:"Panelde bir sorun yaşadığında öğretmenine hemen haber verirsin.", nasil:"\"Öğretmenime yaz\" WhatsApp'ı öğretmeninin numarası ve hazır bir mesajla açar. Hazır mesaj giriş sorununu anlatır; durumun farklıysa göndermeden önce düzelt." },
    { h2:"^Yeni özel ders talebi", bas:"Yeni özel ders talebi", ne:"Tek seferlik özel ders için talep açtığın form.", ise:"Takıldığın konuda seçtiğin branştaki öğretmenlerden destek istersin.", nasil:"Branşı ve tarihi seç, takıldığın konuyu yaz, WhatsApp numaranı gir; veli kutusunu işaretleyince \"Talebi yayınla\" düğmesi açılır. Adın ve telefonun yalnız dersi kabul eden öğretmene iletilir." },
    { h2:"^Taleplerim", bas:"Taleplerim", ne:"Yayında olan ve öğretmen bulunan özel ders taleplerin.", ise:"Talebinin hangi aşamada olduğunu izlersin.", nasil:"Yayındaki talebi \"Talebi geri çek\" ile kaldırırsın; öğretmen kabul edince sana WhatsApp'tan ulaşır. Anlaşamazsanız \"Yeniden yayınla\" ile talebi tekrar açarsın, düğmede kaç hakkın kaldığı yazar." },
    { h2:"^Geçmiş derslerim", bas:"Geçmiş derslerim", ne:"Tamamlanan derslerin ve \"gelmedi\" işaretlenen derslerin listesi.", ise:"Yapılan dersi onaylar, yapılmayan ders için itiraz edersin.", nasil:"Ders yapıldıysa 1 ile 5 arasında yıldız ver; yıldız aynı zamanda ders yapıldı onayıdır. Ders yapılmadıysa yıldız vermeden \"Bu ders yapılmadı\" düğmesine bas, başka bir sorun için \"Sorun bildir\" bağlantısını kullan." },
    { h2:"^(Bilgilerin nerede duruyor|⚠ Çok önemli)", bas:"Bilgilerin nerede", ne:"Bilgilerinin nerede saklandığını anlatan kart.", ise:"Hangi durumda veri kaybedebileceğini önceden bilirsin.", nasil:"Hesabınla girdiysen bilgilerin sunucudadır, her cihazdan aynısını görürsün; \"son işlem kayıt olmadı\" penceresi çıkarsa \"Tekrar dene\" düğmesine bas. Hesabın yoksa bilgilerin yalnız bu tarayıcıdadır; geçmişi silme, ayda bir yedek al." },
    { h2:"^Bu panel ne işe yarar", bas:"Bu panel ne işe yarar", ne:"Panelle neler yapabileceğini maddeler hâlinde sayan kart.", ise:"Panelin sana ne kazandıracağını tek bakışta görürsün.", nasil:"Maddelerde geçen sekmelerin ayrıntısı aşağıdaki sekme kartlarındadır." },
    { h2:"^⚠ Doldurmazsan", bas:"Doldurmazsan çalışmayan yerler", ne:"Boş bırakıldığında panelin hesap yapamadığı alanların listesi.", ise:"Panelin sana yanlış sonuç göstermesini önler.", nasil:"En önemlisi haftalık çalışma süren: \"Hedefe uzaklık\" sekmesindeki \"Hedefim\" kartından gir. Konularını işaretle ve hedef bölümünü seç; öğretmenin yoksa haftanın planını da kabul et." },
    { h2:"^(Ödevlerim|Programım|Konularım|Denememi gir|Gelişimim|Hedefe uzaklık|Puan hesapla|Yardım|Özel Ders|Paketim|Rapor gönder|Ayarlar) sekmesi", bas:"Sekme anlatımları", ne:"Her biri bir sekmeyi anlatan kartlar.", ise:"Bir sekmede ne yapacağını bilmiyorsan cevabı burada bulursun.", nasil:"Aradığın sekmenin adıyla başlayan kartı oku. Programım ve Özel Ders kartları yalnız hesabınla girdiğinde, Rapor gönder ve Ayarlar kartları yalnız hesapsız kullanımda görünür." },
    { h2:"^Sık karşılaşılan durumlar", bas:"Sık karşılaşılan durumlar", ne:"Öğrencilerin en sık takıldığı durumlar ve çözümleri.", ise:"Bir sorun yaşadığında önce buraya bakarak çoğunu kendin çözersin.", nasil:"Her satırın başlığı bir durumu, altındaki metin ne yapman gerektiğini yazar." },
    { h2:"^Üç kural", bas:"Üç kural", ne:"Paneli verimli kullanman için temel kurallar.", ise:"Panelin sana doğru plan çıkarması bu kurallara bağlıdır.", nasil:"Kuralları bir kez oku ve her hafta işaretlerini dürüstçe yap." },
    { tab:"konu", sec:".stats", bas:"Konu özeti", ne:"Bütün derslerinde toplam, bitirdiğin ve kalan konu sayısı ile gereken süre.", ise:"Konu haritanda nerede olduğunu tek bakışta görürsün.", nasil:"Sayılar konuları işaretledikçe değişir. \"Gereken süre\" kalan konuların anlatımını ve soru çözümünü birlikte kapsar; işlediğin konular yarım sayılır." },
    { tab:"konu", sec:"select", bas:"Ders seçimi", ne:"Konularını göreceğin dersi seçtiğin kutu; o dersi ne kadar bitirdiğini çubukla gösterir.", ise:"Aşağıdaki ünite kartları seçtiğin dersin konularıyla dolar.", nasil:"\"Ders\" listesinden dersi seç. Konuların yanındaki \"ÖNCE BU\" gibi etiketler, ÖSYM'de konudan çıkan soru sayısına göre çalışma sırası önerir; \"TEMEL\" işaretli konular başka konuların altyapısıdır." },
    { tab:"konu", sec:".topic", bas:"Ünite konuları", ne:"Seçtiğin dersin bir ünitesindeki konular; her konunun tahmini süresi ve soru hedefiyle.", ise:"Konu durumunu işaretlersin; öğretmenin panelini yenileyince görür, yetişir mi hesapları da buna göre değişir.", nasil:"Konunun yanındaki düğmeye her dokunuşta durum Görmedim, İşliyorum, Bitirdim ve Eksiğim var arasında döner; \"Bitirdim\" dediğin konunun bekleyen ödevi varsa onları da \"Yaptım\" sayıp saymayacağın sorulur. \"▶\" düğmesi konunun anlatım ve soru çözümü videolarını YouTube'da aratır." },
    { tab:"deneme", sec:".seg", bas:"Deneme türü", ne:"Gireceğin denemenin türünü seçtiğin düğme grubu.", ise:"Aşağıdaki form yalnız o türün derslerini gösterir.", nasil:"\"TYT\" bütün TYT derslerini, \"AYT\" kendi alanının AYT derslerini getirir. \"Branş\" seçersen formda tek bir ders seçersin." },
    { tab:"gelisim", sec:"svg[aria-label=\"Net seyri\"]", bas:"Ders ders net seyri", ne:"Her dersin deneme deneme netini gösteren küçük grafikler.", ise:"Hangi derste ilerlediğini, hangisinde durduğunu ayrı ayrı görürsün.", nasil:"Kartın üstünde son netin ve hedef netin yazar; parantezdeki fark kırmızıysa hedefin altındasın. Yalnız deneme girdiğin dersler görünür." },
    { tab:"gelisim", sec:":scope > .empty", bas:"Henüz deneme yok", ne:"Hiç deneme girilmediğinde çıkan bilgi kutusu.", ise:"Grafiklerin nereden dolacağını söyler.", nasil:"\"Denememi gir\" sekmesinden ilk denemeni kaydet; grafikler kendiliğinden oluşur." },
    { tab:"hedef", sec:".stats + .stats", bas:"Sınava kalan süre", ne:"Sınava kalan hafta ile kalan konuların ve soruların gerektirdiği saat.", ise:"Haftada kaç saat çalışman gerektiğini kendi beyanınla karşılaştırırsın.", nasil:"Gereken süre beyan ettiğin haftalık süreyi aşarsa sayı kırmızı olur. \"Konularım'a git\" düğmesi yetişir mi senaryolarını açar." },
    { tab:"hedef", sec:".stats", bas:"Puan ve net farkı", ne:"Son denemelerine göre yaklaşık puanını hedef puanınla karşılaştıran özet.", ise:"Hedefine kaç puan ve kaç net uzakta olduğunu görürsün.", nasil:"Puan, branş dışındaki son 3 denemenin ders ortalamalarından yaklaşık hesaplanır. Fark kırmızıysa hedefin altındasın, yeşilse üstündesin." },
    { tab:"hedef", sec:"svg[aria-label=\"Net seyri\"]", bas:"Ders ders net seyri", ne:"Her dersin deneme deneme netini gösteren küçük grafikler.", ise:"Hangi derste hedefe yaklaştığını ayrı ayrı görürsün.", nasil:"Kartın üstünde son netin ve hedef netin yazar; parantezdeki fark kırmızıysa hedefin altındasın. Yalnız deneme girdiğin dersler görünür." },
    { tab:"odev", sec:".kahraman", bas:"Kalan iş", ne:"Bu hafta kaç ödevin kaldığını ve ne kadarını bitirdiğini gösteren özet kartı.", ise:"Panele girer girmez ne kadar işin kaldığını görürsün.", nasil:"Sayılar ödevleri işaretledikçe değişir; geçen haftalardan kalanlar da kalan işe sayılır. \"Kalan süre\" bitmemiş işlerinin tahmini çalışma süresidir." },
    { tab:"odev", sec:":scope > .body:first-child > .flag.warn", bas:"Yedek hatırlatması", ne:"Hiç yedek almadıysan ya da son yedeğinin üzerinden 14 gün geçtiyse çıkan uyarı.", ise:"Telefonun sıfırlansa ya da tarayıcı verisi silinse bile bilgilerini geri getirebilirsin.", nasil:"\"Ayarlara git\" düğmesine bas, orada \"Yedek indir (.json)\" ile dosyayı indir. Yedek aldıktan sonra uyarı kalkar." },
    { tab:"puan", sec:":scope > .stats", bas:"Puan özeti", ne:"Netlerinle hesaplanan TYT puanın, yerleştirme puanın, hedef puanın ve hedefe farkın.", ise:"Aşağıdaki tabloda netleri değiştirdikçe hedefe ne kadar yaklaştığını görürsün.", nasil:"İki puana da diploma notundan gelen OBP katkısı eklenir. Fark eksideyse kırmızı, hedefe ulaştıysan yeşil yazılır." },
    { tab:"rapor", sec:":scope > .body:first-child > .flag.warn", bas:"İşaretlenmemiş ödevler", ne:"Hiç işaretlemediğin ödevlerin sayısını bildiren uyarı.", ise:"Eksik işaretli bir rapor göndermeni önler.", nasil:"Ödevlerim sekmesinde her ödeve bir durum seç, sonra raporu gönder. Yapamadığını yazmak sorun değildir; bütün ödevler işaretlenince uyarı kalkar." },
    { tab:"ozel", sec:"a[href*=\"905325874992\"]", bas:"Talep kilidi", ne:"Özel ders talebi açmanın şu an kapalı olduğunu ve nedenini gösteren uyarı.", ise:"Neden talep açamadığını öğrenirsin.", nasil:"Kilidin nedeni kutuda yazar; örneğin 2 kez \"gelmedi\" işaretlenince talep açman kilitlenir. Haksız olduğunu düşünüyorsan uyarıdaki \"Biyoser'e yaz\" bağlantısından itiraz et." }
  ];

  var LISTE = (window.ACIKLAMA_PANEL === 'ogrenci') ? OGR : KOC;
  var KAPALI = false;
  try { KAPALI = localStorage.getItem('acRayKapali') === '1'; } catch (e) {}

  var css = document.createElement('style');
  css.textContent =
    '.ac-ray{width:300px;flex:none;background:var(--rail);color:#DCE6EA;position:relative;border-left:1px solid rgba(255,255,255,.08)}' +
    '.ac-ray.kapali{width:40px;cursor:pointer}' +
    '.ac-ust{padding:18px 16px 12px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:space-between;gap:8px}' +
    '.ac-ust b{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7FA8A5;font-weight:600}' +
    '.ac-ust button{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);color:#DCE6EA;padding:4px 9px;border-radius:5px;font-size:11.5px}' +
    '.ac-ust button:hover{background:rgba(255,255,255,.17)}' +
    '.ac-dikey{writing-mode:vertical-rl;transform:rotate(180deg);margin:18px auto;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#7FA8A5}' +
    '.ac-liste{position:relative}' +
    '.ac-not{position:absolute;left:14px;right:14px;background:rgba(255,255,255,.055);border-left:3px solid #4FB3A9;border-radius:0 6px 6px 0;padding:10px 12px 11px;font-size:12px;line-height:1.42}' +
    '.ac-not::before{content:"";position:absolute;left:-17px;top:13px;width:14px;height:2px;background:#4FB3A9}' +
    '.ac-not h4{margin:0 0 7px;font-size:13px;color:#fff;font-weight:650}' +
    '.ac-not .e{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#7FA8A5;margin-right:5px}' +
    '.ac-not p{margin:5px 0 0;color:#C6D5DB}' +
    '.ac-bos{padding:14px 16px;font-size:12px;color:#88A3AE}' +
    '.ac-soru{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-left:8px;border-radius:50%;border:1px solid var(--line);background:var(--panel);color:var(--ink-2);font:700 12px/1 var(--sans);vertical-align:middle;cursor:pointer;text-transform:none;letter-spacing:0}' +
    '.ac-soru[aria-expanded=true]{background:#4FB3A9;border-color:#4FB3A9;color:#fff}' +
    '.ac-soru.yuzen{position:absolute;top:8px;right:8px;margin:0;z-index:2}' +
    '.ac-acik{margin:10px 14px 4px;padding:10px 12px 11px;border-left:3px solid #4FB3A9;border-radius:0 6px 6px 0;color:#C6D5DB;font-size:13px;line-height:1.45;text-transform:none;letter-spacing:0;font-weight:400}' +
    '.ac-acik .e{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#7FA8A5;margin-right:5px}' +
    '.ac-acik p{margin:4px 0 0}' +
    '@media(max-width:1180px){.ac-ray{display:none}}' +
    '@media print{.ac-ray{display:none}}';
  document.head.appendChild(css);

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  // Koç panelinde Kokpit bir sekme değil, KOKPIT bayrağıdır.
  function sekme(){
    try { if (typeof KOKPIT !== 'undefined' && KOKPIT) return 'kokpit'; return (typeof TAB !== 'undefined') ? TAB : ''; }
    catch (e) { return ''; }
  }
  // Girdilerde başlık deseni metin olarak da yazılabilir; bir kez derlenir.
  LISTE.forEach(function(e){ if (typeof e.h2 === 'string') e.h2 = new RegExp(e.h2); });

  function bul(kart){
    var h = kart.querySelector('h2'), bas = '';
    if (h) bas = ((h.firstChild && h.firstChild.nodeType === 3) ? h.firstChild.textContent : h.textContent).trim();
    var t = sekme();
    for (var i = 0; i < LISTE.length; i++) {
      var e = LISTE[i];
      if (e.tab && e.tab !== t) continue;
      if (e.h2 && !e.h2.test(bas)) continue;
      if (e.sec && !kart.querySelector(e.sec)) continue;
      return e;
    }
    return null;
  }

  function dar(){ return window.matchMedia && window.matchMedia('(max-width:1180px)').matches; }
  function notHtml(e){
    return '<p><span class="e">Ne</span>' + esc(e.ne) + '</p>' +
      '<p><span class="e">İşe yarar</span>' + esc(e.ise) + '</p>' +
      '<p><span class="e">Kullanım</span>' + esc(e.nasil) + '</p>';
  }
  function temizle(view){
    if (!view) return;
    var x = view.querySelectorAll('.ac-soru,.ac-acik');
    for (var i = 0; i < x.length; i++) x[i].parentNode.removeChild(x[i]);
  }
  /* Telefonda ve dar ekranda sütun yok: açıklaması olan kartın başlığına "?" konur,
     dokununca açıklama kartın içinde başlığın altında açılır. */
  function sorulariKur(kartlar){
    var kullanildi = [];
    var sol = document.querySelector('.app > aside:not(.ac-ray)');
    var renk = sol ? getComputedStyle(sol).backgroundColor : '';
    for (var i = 0; i < kartlar.length; i++) {
      var k = kartlar[i];
      if (k.querySelector('.ac-soru')) continue;
      var e = bul(k); if (!e || kullanildi.indexOf(e) >= 0) continue;
      kullanildi.push(e);
      var h = k.querySelector('h2');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ac-soru'; b.textContent = '?';
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-label', e.bas + ': ne işe yarar');
      if (h) h.insertBefore(b, (h.firstChild && h.firstChild.nodeType === 3) ? h.firstChild.nextSibling : null);   // başlığın hemen yanına, alt yazının önüne
      else { if (getComputedStyle(k).position === 'static') k.style.position = 'relative'; b.className += ' yuzen'; k.insertBefore(b, k.firstChild); }
      b.onclick = (function(k, h, e, b){ return function(ev){
        ev.stopPropagation(); ev.preventDefault();
        var acik = k.querySelector('.ac-acik');
        if (acik) { acik.parentNode.removeChild(acik); b.setAttribute('aria-expanded', 'false'); return; }
        var d = document.createElement('div');
        d.className = 'ac-acik'; d.style.background = renk; d.innerHTML = notHtml(e);
        if (h && h.parentNode === k) k.insertBefore(d, h.nextSibling); else k.insertBefore(d, b.nextSibling);
        b.setAttribute('aria-expanded', 'true');
      }; })(k, h, e, b);
    }
  }

  window.ACIKLAMA_BUL = bul;   // denetim için: bir kartın hangi açıklamaya düştüğü

  function ray(){
    var r = document.getElementById('acRay');
    if (r) return r;
    var app = document.querySelector('.app');
    if (!app) return null;
    r = document.createElement('aside');
    r.id = 'acRay'; r.className = 'ac-ray';
    r.setAttribute('aria-label', 'Kutuların açıklamaları');
    app.appendChild(r);
    return r;
  }

  function yerlestir(){
    var r = ray(); if (!r) return;
    var view = document.getElementById('view');
    var kartlar = view ? view.querySelectorAll('.card') : [];
    // Giriş ve kayıt ekranında sütun görünmez (şifre kutusu olan ekran).
    var giris = !!(view && view.querySelector('input[type=password]'));
    r.style.display = giris ? 'none' : '';
    if (giris) return;
    if (dar()) { sorulariKur(kartlar); return; }
    temizle(view);
    // Renk sol menüden okunur: koçta .rail, öğrencide .snav; temalar değişse de iki sütun aynı kalır.
    var sol = document.querySelector('.app > aside:not(.ac-ray)');
    if (sol) r.style.background = getComputedStyle(sol).backgroundColor;
    // Genişlik de sol menüyle aynı (koçta 246 px, dar ekranda 200 px); kapalıyken ince şerit.
    r.style.width = (KAPALI || !sol || !sol.offsetWidth) ? '' : sol.offsetWidth + 'px';
    r.classList.toggle('kapali', KAPALI);
    if (KAPALI) {
      r.innerHTML = '<div class="ac-dikey">Açıklamaları göster</div>';
      r.onclick = function(){ ac(false); };
      return;
    }
    r.onclick = null;
    r.innerHTML = '<div class="ac-ust"><b>Bu sayfada</b><button type="button">Gizle</button></div><div class="ac-liste"></div>';
    r.querySelector('.ac-ust button').onclick = function(ev){ ev.stopPropagation(); ac(true); };
    var liste = r.querySelector('.ac-liste'), ust = liste.getBoundingClientRect().top, adet = 0, kullanildi = [];
    NOTLAR = [];
    for (var i = 0; i < kartlar.length; i++) {
      var k = kartlar[i];
      if (!k.offsetParent) continue;                 // görünmeyen kart
      var e = bul(k); if (!e || kullanildi.indexOf(e) >= 0) continue;   // aynı tür kart (ör. haftalık tablolar) bir kez
      kullanildi.push(e);
      var d = document.createElement('div');
      d.className = 'ac-not';
      d.innerHTML = '<h4>' + esc(e.bas) + '</h4>' +
        notHtml(e);
      liste.appendChild(d);
      var kr = k.getBoundingClientRect();
      NOTLAR.push({ d: d, ust: Math.round(kr.top - ust), alt: Math.round(kr.bottom - ust), h: d.offsetHeight });
      adet++;
    }
    if (!adet && kartlar.length) { liste.innerHTML = '<div class="ac-bos">Bu sekmenin açıklamaları yakında eklenecek.</div>'; return; }
    konumla();
  }

  /* Not kartının hizasında başlar; uzun kart kaydırılırken ekranda kalır, kartın sonunu geçmez.
     Notlar üst üste binmez: her biri bir öncekinin altından başlar. */
  var NOTLAR = [];
  function konumla(){
    var r = document.getElementById('acRay'); if (!r || KAPALI) return;
    var liste = r.querySelector('.ac-liste'); if (!liste) return;
    var ekranUst = -liste.getBoundingClientRect().top + 12, son = 0;
    for (var i = 0; i < NOTLAR.length; i++) {
      var n = NOTLAR[i];
      var top = Math.min(Math.max(n.ust, ekranUst), Math.max(n.ust, n.alt - n.h));
      top = Math.max(top, son);
      n.d.style.top = top + 'px';
      son = top + n.h + 12;
    }
    liste.style.height = son + 'px';
  }
  var kaydirma = 0;
  window.addEventListener('scroll', function(){
    if (kaydirma) return;
    kaydirma = setTimeout(function(){ kaydirma = 0; konumla(); }, 16);
  }, { passive: true });

  function ac(kapat){
    KAPALI = kapat;
    try { localStorage.setItem('acRayKapali', kapat ? '1' : '0'); } catch (e) {}
    yerlestir();
  }

  var bekleyen = 0;
  // setTimeout: requestAnimationFrame arka plandaki sekmede hiç çalışmıyor.
  function sonra(){ if (bekleyen) return; bekleyen = setTimeout(function(){ bekleyen = 0; yerlestir(); }, 30); }

  function bagla(){
    if (typeof window.render === 'function' && !window.render.__ac) {
      var asil = window.render;
      window.render = function(){ var s = asil.apply(this, arguments); sonra(); return s; };
      window.render.__ac = true;
    }
    window.addEventListener('resize', sonra);
    var view = document.getElementById('view');
    if (view && window.ResizeObserver) new ResizeObserver(sonra).observe(view);
    sonra();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bagla); else bagla();
})();
