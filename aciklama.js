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
      ne:"Bu haftaki ödev sayısı, devreden ödevler, haftalık hedef süre ve sınava kalan hafta.",
      ise:"Öğrencinin bu haftaki yükünü ve ödev uyumunu bir arada görürsün.",
      nasil:"Uyum, \"Yapıldı\" işaretli ödevlerin payı; kısmen yapılan yarım sayılır. Hedef süreye rutinler ve devreden ödevler de girer." },
    { h2:/^Devreden ödevler/, bas:'Devreden ödevler',
      ne:"Geçmiş haftalarda verilip hâlâ \"Yapıldı\" işaretlenmemiş konu ödevleri.",
      ise:"Biriken işi görür, yeni ödeve geçmeden önce bunları kapattırırsın.",
      nasil:"\"Kaç hafta\" sütunu ödevin yaşını yazar, 3 haftada kırmızı olur. Durumu düğmeyle işaretlersin. \"sil\" önce onay sorar, sonra ödevi tamamen kaldırır." },
    { h2:/^Bu haftanın ödevleri/, bas:'Bu haftanın ödevleri',
      ne:"Bu hafta verilen konu ödevleri ve rutinler, öğrencinin çözdüğü soru, doğru, yanlış ve netiyle.",
      ise:"Öğrencinin işaretlediğine bakar, gerekirse durumu kendin değiştirirsin.",
      nasil:"Durum düğmesi her tıklayışta Bekliyor, Yapıldı, Kısmen ve Yapılmadı arasında döner. Çarpı, ödevi bu haftadan çıkarır. Öğrencinin yeni girdiklerini görmek için sayfayı yenile." },
    { h2:/^Haftalık çalışma programı/, bas:'Haftalık çalışma programı',
      ne:"Bu haftanın ödevlerinin 15 dakikalık dilimlerle günlere dağıtıldığı takvim.",
      ise:"Öğrencinin hangi gün ne çalışacağını belirler; öğrenci aynı takvimi kendi panelinde görür.",
      nasil:"Blokları sürükleyip taşı, taşıdığın blok kilitlenir. \"Yeniden dağıt\" kilitlileri yerinde bırakır, gerisini baştan yerleştirir. Gri hücreler kapalı saatler." },

    // ---- Ödevler ----
    { h2:/^Bitirdi ama tutmamış/, bas:'Bitirdi ama tutmamış',
      ne:"Öğrencinin işleniyor ya da bitti işaretlediği ama denemelerde doğru oranı %50'nin altında kalan konular.",
      ise:"Bitti sanılıp denemede tutmayan konular, ödev vermeden önce önüne gelir.",
      nasil:"Oran, denemelere girilen yanlış ve boş konulardan hesaplanır. Satırdaki \"Ödeve ekle\" konuyu bugünün tarihiyle ödev olarak verir." },
    { h2:/^Tavsiye edilen haftalık ödev/, bas:'Tavsiye edilen haftalık ödev',
      ne:"Panelin, kalan konuları sınava kadar bitirecek tempoyla kurduğu haftalık plan.",
      ise:"Bu hafta hangi konuları vermen gerektiğini hesaplamak sana kalmaz.",
      nasil:"\"Bu haftanın ödevlerini ver\" planı ödeve çevirir, eksik rutini ekler. \"çıkar\" bir konuyu plandan atar. Beyan tempodan azsa kırmızı uyarı çıkar." },
    { h2:/^Hızlı ödev ata/, bas:'Hızlı ödev ata',
      ne:"Her derste bitmemiş ve henüz ödev verilmemiş ilk konu.",
      ise:"Sıradaki konuyu tek tıkla ödev olarak verirsin.",
      nasil:"Satırdaki \"ödev ver\" konuyu bugünün tarihiyle ekler. \"Hedefe göre öncelik\" seçiliyse konular hedef netine katkıya göre dizilir. Satırın üstünde durunca o dersin sonraki konuları görünür." },
    { h2:/^Ödev ver/, bas:'Ödev ver',
      ne:"Belirli bir konuyu elle ödev verdiğin form.",
      ise:"Konuyu ders ve ünitesiyle seçer, soru hedefi ve not eklersin.",
      nasil:"Ders ve üniteden sonra konuyu seç; soru hedefi boşsa Konular sekmesindeki sayı kullanılır. Düğmenin yanında haftanın toplam yükü yazar; beyanı aşınca kırmızı olur." },
    { h2:/^Rutin tanımı/, bas:'Rutin tanımı',
      ne:"Konudan bağımsız, her hafta tekrarlanan işler; paragraf ve problem soruları gibi.",
      ise:"Bütün öğrencilerinin haftalık rutinini tek yerden belirlersin.",
      nasil:"Rutin kendiliğinden eklenmez, haftaya \"Bu haftanın ödevlerini ver\" düğmesiyle girer. Sonraki haftaya devretmez." },
    { h2:/^Konu bazında ödev dökümü/, bas:'Konu bazında ödev dökümü',
      ne:"Hangi konuyu kaç kez verdiğin ve öğrencinin o konudaki uyumu.",
      ise:"Aynı konuyu üst üste verip vermediğini ve öğrencinin nerede takıldığını görürsün.",
      nasil:"Sağdaki halka bütün ödevlerin durumunu, soldaki çubuklar en çok ödev alan derslerin uyumunu gösterir. Kutuya tıklarsan konu konu tablo altta açılır. Uyumu düşük kalan konuyu yeniden vermeden önce öğrenciyle konuş." },
    { h2:/^Geçmiş haftalar/, bas:'Geçmiş haftalar',
      ne:"Son altı haftanın ödev uyumu. Büyük halka ortalamayı, küçük halkalar her haftayı ve o hafta yapılan ödev sayısını gösterir.",
      ise:"Öğrencinin düzeninin haftadan haftaya nasıl değiştiğini görürsün.",
      nasil:"Kutuya tıklayınca hafta hafta ödev tabloları altta açılır, yine tıklayınca kapanır." },
    { h2:/^Hafta \d/, bas:'Haftalık ödev tablosu',
      ne:"O haftanın ödevleri ve uyum yüzdesi.",
      ise:"Haftalar arasında öğrencinin düzenini kıyaslarsın.",
      nasil:"En yeni hafta en üstte. Uyum yapılanı tam, kısmen yapılanı yarım sayar. Bekleyen ödevler de hesaba girdiğinden hafta bitmeden düşük görünür." }
,

    // ---- Kalan sekmeler (ajanların yazdığı, kodla doğrulanmış) ----
    { tab:"kokpit", h2:"^Haftalar ısı haritası", bas:"Haftalar ısı haritası", ne:"Her öğrencinin son 8 haftalık ödev uyumu, hafta hafta renkli hücrelerle. Sağda son 5 TYT netinin çizgisi var.", ise:"Bir öğrencinin hangi haftadan beri kaydığı belli olur. Sütun topluca kötüyse sorun öğrencilerden çok programda olabilir; panel bunu üstte yazar.", nasil:"Öğrencinin ismine tıklayınca altta küçük bir kart açılır, yine tıklayınca kapanır; kartta son 3 hafta uyumu, TYT net değişimi, kadrandaki yeri, pist sonucu ve devreden ödev var. Sırala düğmeleriyle riske, isme ya da son haftaya göre dizersin. Bu hafta bitmediği için son sütun düşük görünebilir." },
    { tab:"kokpit", h2:"^Teşhis kadranı", bas:"Teşhis kadranı", ne:"Yatayda son 3 haftanın ödev uyumu, dikeyde TYT net değişimi; her nokta bir öğrenci.", ise:"Aynı kırmızının ardındaki iki sorunu ayırır: ödev yapmayanla çalışıp net alamayan farklı görüşme ister.", nasil:"Köşenin adı yapılacak işi söyler. Noktaya tıklayınca öğrenci seçilir. Kadrana girmek için en az 2 TYT denemesi ve son 3 haftada ödev gerekir; girmeyenler altta yazar." },
    { tab:"kokpit", h2:"^Sınav pisti", bas:"Sınav pisti", ne:"Her öğrencinin kalan konuları bugünkü haftalık saatiyle ne zaman bitireceği; dikey çizgi sınav günü.", ise:"Aylar sonra çıkacak yetişmeme sorunu bugünden görünür; en geride olan en üstte.", nasil:"Hesap Yetişir mi planından gelir: kalan konuların süresi öğrencinin beyan ettiği haftalık saate bölünür. Beyan yoksa ya da öğrenci 11. sınıftaysa pistte görünmez." },
    { tab:"kokpit", h2:"^Tüm öğrenciler", bas:"Tüm öğrenciler", ne:"Her öğrenci için tek satır: son üç denemenin TYT ve AYT net ortalaması, ödev uyumu, devreden ödev sayısı ve risk rengi.", ise:"Kiminle önce ilgilenmen gerektiğini sıraya koyar; acil olanlar en üstte, aynı grupta ödev uyumu en düşük olan başta.", nasil:"Uyum %60 altındaysa, 6 ya da daha fazla devreden ödev varsa, son deneme aynı türden bir öncekinden 2 net düşükse ya da haftalık beyan kalan konulara yetmiyorsa öğrenci Acil olur. Durum sütunu en fazla iki gerekçe yazar. \"Öğrenciyi gör\" Haftalık sekmesini, \"Veli raporu\" o öğrencinin Veli raporu sekmesini açar." },
    { tab:"durum", h2:"^Hedefe uzaklık", bas:"Hedefe uzaklık", ne:"Son üç denemenin netlerinden çıkan tahmini puan ile Hedef sekmesindeki hedef puanın karşılaştırması.", ise:"Öğrenci hedef bölüme kaç puan uzakta, burada görünür.", nasil:"Tahmini puana OBP de katılır; \"Puan farkı\" eksiyse kırmızı yazılır. \"Hedefin yüzdesi\" net ortalamasının hedef toplam netin yüzde kaçı olduğunu gösterir, %90 ve üstü yeşil." },
    { tab:"durum", h2:"^(TYT|.+ AYT) net seyri", bas:"TYT ve AYT net seyri", ne:"Her denemenin TYT ve AYT netini tarih sırasıyla çizen iki grafik.", ise:"Netlerin zamanla yükselip yükselmediği buradan okunur.", nasil:"Üstteki satırda deneme sayısı, son net, ilk denemeye göre değişim ve hedefle fark yazar; fark son denemeden hesaplanır. Branş denemeleri bu grafiklere girmez." },
    { h2:"^Uyarılar", bas:"Uyarılar", ne:"Panelin öğrencinin deneme ve ödev verisinden kendiliğinden çıkardığı uyarılar.", ise:"Haftalık görüşmenin gündemini önüne koyar.", nasil:"Ortalaması hedef netinin %35'inden fazla geride kalan her ders, aynı türden son üç denemede sabit kalan ya da düşen toplam net, iki hafta üst üste %50 altında kalan ödev uyumu ve en az beş eksik konu uyarı doğurur. Hiçbiri yoksa \"Aktif uyarı yok\" yazar." },
    { h2:"^Deneme özeti", bas:"Deneme özeti", ne:"Son sekiz denemenin tarihi, adı, TYT neti ve AYT neti yan yana.", ise:"Sonuçları grafiğe bakmadan, rakamla karşılaştırırsın.", nasil:"En yeni deneme en üstte. Bir bölüm girilmediyse o sütunda nokta görünür; branş denemeleri bu tabloya alınmaz." },
    { h2:"^Çözülen soru", bas:"Çözülen soru", ne:"Öğrencinin ödevlerde girdiği çözülmüş soru sayıları, ders ders toplanmış.", ise:"Öğrenci hangi derse ne kadar soru ayırmış, dersleri yan yana koyup görürsün.", nasil:"Sayıları öğrenci kendisi beyan eder, verdiğin hedefle karıştırma. Çubuklar en çok soru çözülen derse göre ölçeklenir; yeni sayılar sayfayı yenileyince eklenir." },
    { h2:"^Son haftalar", bas:"Son haftalar", ne:"Ödev verilen son altı haftanın her biri için verilen, yapılan ve kısmen yapılan ödev sayısıyla uyum yüzdesi.", ise:"Ödev düzeninin haftadan haftaya seyri burada izlenir.", nasil:"Kısmen yapılan ödev yarım sayılır; uyum %70 ve üstünde yeşil, %50 altında kırmızı. İki hafta üst üste %50 altı, planın fazla ağır olduğunu gösterir." },
    { h2:"^Eksik işaretli konular", bas:"Eksik işaretli konular", ne:"Konular sekmesinde \"Eksik\" işaretlediğin konular, her birinin yanında dersiyle.", ise:"Tekrar gereken konular ödev vermeden önce bir arada önüne gelir.", nasil:"Kart yalnız eksik işaretli konu varsa çıkar. Durumunu Konular sekmesinde değiştirdiğin konu buradan düşer." },
    { h2:"^Karneden okut", bas:"Karneden okut", ne:"Deneme karnesinin metninden ders netlerini, yanlış ve boş bırakılan konuları okuyan kart.", ise:"Netleri ve konuları tek tek elle yazman gerekmez.", nasil:"Karne metnini kutuya yapıştırıp \"Karneyi oku ve formu doldur\"a bas ya da \"PDF yükle\" ile dosyayı seç. Okunan sayılar \"Yeni deneme gir\" formuna yeşil zeminle yazılır. Fotoğraf ve taranmış görüntü okunmaz; kaydetmeden önce sayıları karneyle karşılaştır." },
    { h2:"^Karneden çıkarılan", bas:"Karneden çıkarılan konular", ne:"Karneden okunan yanlış ve boş konuların ders ders önizlemesi.", ise:"Kaydetmeden önce konular doğru okunmuş mu, buradan bakarsın.", nasil:"Liste, \"Denemeyi kaydet\"e bastığında denemeye eklenir; hatalıysa \"Konuları at\" ile temizle. Konu listesiyle eşleşmeyen konuda doğru konuyu seçip \"Öner\"e basabilirsin." },
    { h2:"^Yanlış ve boş konular", bas:"Yanlış ve boş konular", ne:"\"Geçmiş denemeler\" tablosunda \"konu gir\" ile açtığın denemenin yanlış ve boş konu kaydı.", ise:"Kaçan soruları konu konu denemeye bağlarsın; zayıf konular bu kayıtlardan çıkar.", nasil:"Konuyu seç, yanlış ya da boş adedini yaz ve \"Konuyu ekle\"ye bas. \"Konudan soru\" boş kalırsa o konunun doğru oranı hesaplanmaz. \"Toplu ekle\" kutusuna yapıştırılan konularda soru sayısı olmadığından oran da çıkmaz." },
    { h2:"^Zayıf konular", bas:"Zayıf konular", ne:"Bütün denemelerdeki konu kayıtlarında doğru oranı %50'nin altında kalan konular.", ise:"Denemede tutmayan konular tek listede toplanır, tekrar planını buna göre kurarsın.", nasil:"Doğru sayısı, konudan çıkan sorudan yanlış ve boş düşülünce bulunur. Soru sayısı girilmemiş konular listeye girmez, alttaki notta sayılır. Son sütunda \"Bitti\" yazıyorsa konuyu Konular sekmesinde \"Eksik\"e çek." },
    { h2:"^Son \\d+ deneme", bas:"Son denemeler, ders bazında", ne:"Her dersin son üç denemedeki netini eskiden yeniye dizen, ortalamayı hedef netle karşılaştıran tablo.", ise:"Hedefin gerisinde kalınan ders rakamla belli olur.", nasil:"Bir dersin girilmediği denemede seyirde nokta görünür, eksi fark kırmızı yazılır. Branş denemeleri sayılmaz; grafikler Durum sekmesinde." },
    { h2:"^Yeni deneme gir", bas:"Yeni deneme gir", ne:"Bir denemenin ders ders doğru ve yanlış sayılarını elle girdiğin form.", ise:"Karne yoksa ya da okunamadıysa deneme buradan kaydedilir.", nasil:"Doldurup \"Denemeyi kaydet\"e bas; boş bıraktığın ders denemeye girmez. Net, doğrudan yanlışın dörtte biri düşülerek hesaplanır. Yalnız AYT dersleri doluysa deneme AYT, öbür durumlarda TYT sayılır." },
    { h2:"^Geçmiş denemeler", bas:"Geçmiş denemeler", ne:"Öğrencinin bütün denemeleri; her dersin neti ayrı sütunda, toplam net en sağda.", ise:"Girilen denemeleri denetlersin, konu analizi de buradan başlar.", nasil:"\"konu gir\" o denemenin konu kartını \"Karneden okut\" kartının altında açar. \"sil\" önce onay sorar, sonra denemeyi kaldırır. Öğrencinin kendi girdiği denemeler sayfayı yenileyince burada görünür." },
    { h2:"^Yetişir mi — yalnız konu", bas:"Yetişir mi: yalnız konu", ne:"Soru çözümü hariç, haftalık konu çalışması süresinin öğrencinin beyanına sığıp sığmadığını gösteren kart.", ise:"Konular sınava kadar biter mi, bu kart söyler.", nasil:"Öncelikli senaryo hesabı olduğu gibi alır, öteki iki senaryo %15 ve %30 ek süre koyar. Yetişen kutu kalan payı, yetişmeyen kutu haftalık açığı yazar. Beyan boşsa kutularda \"Hedef sekmesini doldur\" yazar." },
    { h2:"^Yetişir mi — konu \\+ soru", bas:"Yetişir mi: konu + soru", ne:"Konu çalışmasına hedef soru çözümü de eklenince haftalık yükün beyana sığıp sığmadığını gösteren kart.", ise:"Öğrenci sınava gerçekten hazır olabilecek mi, asıl cevap bu kartta.", nasil:"Soldaki kart \"Yetişir\", bu kart \"Yetişmez\" diyorsa öğrenci konuları bitirir ama yeterince soru çözemez. Öncelikli \"Yetişir\", güvenlik payı \"Yetişmez\" diyorsa plan gergin; haftalık süreyi ya da konu önceliklerini öğrenciyle konuş." },
    { h2:"^Konu ilerlemesi", bas:"Konu ilerlemesi", ne:"Her dersin toplam, biten, işlenen ve eksik konu sayısı; yanında tamamlanma yüzdesi ve kalan süre.", ise:"Dersleri tek tabloda karşılaştırıp geride kalanı bulursun.", nasil:"Bir satıra tıklarsan o dersin konuları alttaki \"Konu durumu ve süresi\" kartında açılır. Kalan süreye soru çözümü de dahil; eksik konu varsa sayısı kırmızı yazılır." },
    { h2:"^Konu durumu ve süresi", bas:"Konu durumu ve süresi", ne:"Seçili dersin ünite ünite konuları; adın yanındaki etiket konunun hedefe göre kademesini ve ön koşul olup olmadığını gösterir.", ise:"Konuları işaretledikçe üstteki kalan süre ve yetişir hesapları kendini yeniler.", nasil:"Konuya her tıklayışta durum Görülmedi, İşleniyor, Bitti ve Eksik arasında döner. \"Bitti\" olan konunun bekleyen ödevi varsa panel onu da \"Yapıldı\" sayıp saymayacağını sorar, \"Üniteyi bitti işaretle\" sormaz. Alttaki \"dk\" ve \"soru\" kutuları bütün öğrencilerinde ortak; ▶ düğmesi konunun YouTube aramalarını açar." },
    { h2:"^Süre ayarları", bas:"Süre ayarları", ne:"Konu sürelerinde elle yaptığın değişikliklerin sayısını ve bu ayarları taşıma düğmelerini gösteren kart.", ise:"Süre ayarların bütün öğrencilerinde geçerli; onları buradan yedekler ya da başka bir bilgisayara aktarırsın.", nasil:"\"Süre tablosunu indir\" ile dosya alır, \"Süre tablosu yükle\" ile onaydan sonra şimdiki ayarların yerine koyarsın. \"Varsayılanlara dön\" elle ayarları siler. Soru sayıları bu karta girmez." },
    { h2:"^Ortaöğretim başarı puanı", bas:"Ortaöğretim başarı puanı", ne:"Diploma notunu girdiğin, OBP'nin hesaplandığı kart.", ise:"OBP'nin puana katkısı ve geçen yıl yerleşmenin bu katkıyı ne kadar düşürdüğü görünür.", nasil:"Diploma notunu 100 üzerinden yaz. Panel OBP'yi notun beş katı alır, puana OBP'nin 0,12 katını ekler. \"Geçen yıl bir programa yerleşti\" işaretliyse çarpan 0,06'ya iner; not da kutu da kendiliğinden kaydolur." },
    { h2:"^Net dağılımı", bas:"Net dağılımı", ne:"Ders ders netleri ve puana katkılarını gösteren tablo; ilk açılışta son üç denemenin ortalamasıyla dolar.", ise:"Netleri değiştirip hedef puana hangi dağılımla varılacağını denersin.", nasil:"Net yazdıkça puanlar yeniden hesaplanır ama tablo kaydedilmez. \"Bu dağılımı hedef net olarak kaydet\" netleri Hedef sekmesindeki referans netlere yazar ve seni Durum sekmesine götürür. \"Son 3 deneme ortalamasına dön\" başlangıç netlerini geri getirir, \"Sıfırla\" kutuları boşaltır." },
    { h2:"^Bu hesap ne kadar doğru", bas:"Bu hesap ne kadar doğru", ne:"Panelin puan hesabının ÖSYM'nin gerçek hesabından nasıl ayrıldığını anlatan not.", ise:"Böylece sonucu doğru yorumlarsın.", nasil:"ÖSYM standart puan kullanır, panel deneme kitapçıklarının ham puan yöntemini; sapma genelde ±10-15 puanı bulur. Hesabı net dağılımlarını karşılaştırmak için kullan, sıralama tahmini için kullanma." },
    { h2:"^YÖK verisinden bölüm seç", bas:"YÖK verisinden bölüm seç", ne:"YÖK Atlas verisinden öğrencinin hedef programını arayıp seçtiğin kart.", ise:"Programı seçince taban bilgileri ve ders ders hedef netleri elle yazmadan dolar.", nasil:"İlk açılışta \"Bölüm veritabanını yükle\" de, tarayıcı veriyi saklar. En az 3 harf yazınca yalnız öğrencinin alanındaki programlar listelenir. \"seç\" hedef netlerin üstüne yazar, hedef puan ve sıralamayı yalnız boşsa doldurur." },
    { h2:"^Hedef bölüm$", bas:"Hedef bölüm", ne:"Öğrencinin hedefini ve haftalık çalışma beyanını tuttuğun form; bölüm seçildiyse üstte kontenjan ve taban bilgileri görünür.", ise:"Hedef puan Puan hesaplayıcıdaki farkı, haftalık beyan ise Konular sekmesindeki yetişir hesabını besler.", nasil:"Değişiklikleri \"Hedefi kaydet\" ile saklarsın. Sınav tarihi bütün öğrencilerde ortak, buradan değişmez. Taban puan ve sırayı elle gireceksen \"YÖK Atlas ana sayfa\" siteyi yeni sekmede açar." },
    { h2:"^Referans netler", bas:"Referans netler", ne:"Her dersin soru sayısı ve öğrencinin o dersteki hedef neti.", ise:"Durum sekmesindeki karşılaştırmalar ile konu öncelikleri bu netlerden beslenir.", nasil:"Bölüm seçince kendiliğinden dolar. Bir neti değiştirip \"Referans netleri kaydet\" de; boş bıraktığın dersin hedefi silinir." },
    { h2:"^Öğrenci hesabı", bas:"Öğrenci hesabı", ne:"Öğrencinin panele kendi hesabıyla bağlı olup olmadığını gösteren, davet kodunu da ürettiğin kart.", ise:"Öğrenci kendi hesabıyla girer; işaretlediği ödevler ve girdiği denemeler sayfayı yenilediğinde senin panelinde görünür.", nasil:"\"Davet kodu üret\" ile kodu al, \"Daveti WhatsApp'la gönder\" ile öğrenciye yolla. Kod bir kez kullanılır, veli onayı eksikken üretilmez. Bağlı hesapta \"Şifre sıfırlama gönder\" öğrenci kaydındaki e-postaya bağlantı yollar, \"Bağlantıyı kes / yeni kod ver\" verilere dokunmadan yeni kod üretir." },
    { h2:"^Veri sorumluluğu", bas:"Veri sorumluluğu", ne:"Bu öğrenci için alınan veli onayının ya da 18 yaşını doldurmuş öğrencinin kendi rızasının kaydı.", ise:"Onay tarihi, veli adı, veli telefonu ve onay notu burada durur; imzalı kâğıt sende kalır.", nasil:"Kaydet düğmesi yok. Kutuyu değiştirip dışına tıkladığında değişiklik kaydedilir. Öğrenci 18 yaşını doldurduysa ilk listede \"Evet\" seç, veli kutuları kalkar." },
    { h2:"^⚠ Veli onayı eksik", bas:"Veli onayı eksik", ne:"Onay kaydı tamamlanmadan eklenen öğrencide çıkan, kırmızı çerçeveli onay kartı.", ise:"Kayıt tamamlanana kadar sunucu bu öğrencideki değişiklikleri reddeder, davet kodu da üretilmez; eksiği burada kapatırsın.", nasil:"Öğrenci 18 yaşından küçükse \"Veli adı soyadı\" ile \"Veli telefonu\" kutularını doldur; 18 yaşını doldurduysa ilk listede \"Evet\" seç. Bilgiler tamamlanınca onay tarihi kendiliğinden yazılır, kayıt sunucuya gider." },
    { h2:"^Öğrenci kaydı", bas:"Öğrenci kaydı", ne:"Öğrencinin sınıfını ve alanını güncellediğin kart; şifre sıfırlama e-postası da burada durur.", ise:"Alan değişince ders listeleri yeni alana göre kurulur. \"Şifre sıfırlama gönder\" bağlantısı bu e-postaya gider.", nasil:"Kutuları değiştirip \"Güncelle\" düğmesine bas; bu karttaki değişiklikler yalnız bu düğmeyle kaydedilir. Alan listesinde Sayısal, Eşit Ağırlık, Sözel ve Dil var." },
    { h2:"^Öğrenciyi sil", bas:"Öğrenciyi sil", ne:"Öğrencinin kaydını bütün verileriyle kalıcı olarak silen kart.", ise:"Ayrılan öğrencinin kaydını kaldırırsın, öğrenci kotandan da düşer.", nasil:"Önce Hesap sekmesindeki \"Tüm verilerimi indir (.json)\" ile arşiv al, sonra kırmızı düğmeye basıp açılan pencereyi onayla. Silme geri alınamaz; denemeler, ödevler, konu kayıtları ve notlar da gider." },
    { h2:"^Nasıl işliyor", bas:"Nasıl işliyor", ne:"Davetten süre kazanmaya giden dört adım.", ise:"Sayacının ne zaman ilerlediğini ve ödülün nasıl eklendiğini görürsün.", nasil:"Davet ettiğin kişi 7 gün ücretsiz dener; sayaç yalnız o kişi paket alınca 1 artar. Sen deneme süresindeyken 2 ücretli davet toplarsan hesabın doğrudan 1 yıllık Öğretmen Paketi'ne geçer." },
    { h2:"^Davet ettiklerin", bas:"Davet ettiklerin", ne:"Davet bağlantınla kaydolan koçlar.", ise:"Kim kaydolmuş, kim pakete geçmiş, buradan takip edersin.", nasil:"Her satırda kayıt tarihi ve durum yazar. \"ücretli\" pakete geçmiş, \"deneme\" henüz geçmemiş demek. Liste sekmeye ilk girişte okunur; yeni kayıtlar için sayfayı yenile." },
    { h2:"^(Davet sistemi henüz kurulmamış|Referans bilgin alınamadı|Referans kodun oluşturulmamış)", bas:"Davet bilgisi alınamadı", ne:"Referans bilgin sunucudan okunamadığında sekmede tek başına çıkan uyarı.", ise:"Sorunun sunucu kurulumundan mı, okuma hatasından mı geldiğini söyler.", nasil:"Kartta \"Tekrar dene\" varsa onunla yeniden iste. Sorun sürerse Hesap sekmesindeki \"Yönetime mesaj\" kutusundan bildir." },
    { h2:"^Önce profilini tamamla", bas:"Özel ders profili", ne:"Özel ders talebi alabilmek için telefonunu ve branşlarını bir kez kaydettiğin kart.", ise:"Numaran yalnız dersini kabul ettiğin öğrenciye gider; hangi talepleri göreceğini branşların belirler.", nasil:"Telefon kutusuna WhatsApp numaranı yazıp \"Kaydet\" düğmesine bas, sonra ders verdiğin branşlara tıkla. Her tıklama hemen kaydedilir; branş seçmezsen talep görmezsin." },
    { h2:"^Branşlarım", bas:"Branşlarım", ne:"Özel ders talebi için seçtiğin branşlar.", ise:"Açık talepler listesine yalnız bu branşlardaki talepler düşer.", nasil:"Branşa tıklayınca seçilir, yine tıklayınca seçim kalkar ve hemen kaydolur. Seçili branşların önünde onay işareti durur." },
    { h2:"^Açık talepler", bas:"Açık talepler", ne:"Branşlarında öğrencilerin açtığı, henüz kimsenin kabul etmediği özel ders talepleri.", ise:"Talebin ayrıntısına ve öğrencinin özel ders geçmişine bakıp sana uyanı alırsın; ad ve telefon kabul edene kadar gizli kalır.", nasil:"\"Dersi kabul et\" düğmesine basıp onaylayınca öğrencinin numarası görünür, WhatsApp hazır mesajla açılır. Liste sekmeye girişte okunur; yeni talepler için \"↻ Listeyi yenile\" bağlantısına bas." },
    { h2:"^Kabul ettiğim dersler", bas:"Kabul ettiğim dersler", ne:"Kabul ettiğin ve henüz kapatmadığın özel dersler; öğrencinin adı burada görünür.", ise:"Dersi öğrenciyle ayarlar, sonucuna göre kapatırsın.", nasil:"\"WhatsApp'tan yaz\" öğrenciyle yazışmayı açar. Ders olunca \"✓ Dersi bitirdim\", öğrenci gelmezse \"Öğrenci gelmedi\" de; \"Gelmedi\" öğrencinin geçmişine işlenir ve 2 gelmedide talep açması kilitlenir. Anlaşamazsan \"Vazgeç\" de, talep yeniden yayına döner." },
    { h2:"^Geçmiş derslerim", bas:"Geçmiş derslerim", ne:"Bitirdiğin ya da öğrenci gelmedi diye kapattığın özel dersler.", ise:"Öğrenciyi puanlarsın; dersi yıldızla onaylayıp onaylamadığı da burada görünür.", nasil:"\"Senin puanın\" satırında 1 ile 5 arasında yıldız ver; puan bir kez verilir. Sorun yaşadıysan \"⚑ Sorun bildir\" ile bir başlık seçip kısaca yaz, bildirim Biyoser yönetimine gider." },
    { h2:"^Yönetime mesaj", bas:"Yönetime mesaj", ne:"Biyoser yönetimiyle yazıştığın mesaj kutusu.", ise:"Sorununu ya da önerini yazarsın, cevap aynı kutuya düşer.", nasil:"Metni yazıp \"Gönder\" düğmesine bas; tek tik iletildiğini, çift tik okunduğunu gösterir. Cevap gelince menüdeki Hesap düğmesinin yanında kırmızı sayı çıkar, sayı panel açılırken güncellenir." },
    { h2:"^Rehber ve kılavuz", bas:"Rehber ve kılavuz", ne:"Başlangıç rehberini ve kullanım kılavuzunu açan iki düğme.", ise:"İlk öğrenciyi eklerken izleyeceğin adımlara ya da sekme sekme anlatıma buradan dönersin.", nasil:"\"Başlangıç rehberini aç\" ilk girişteki rehber penceresini yeniden açar. \"Kullanım kılavuzunu aç\" menüdeki Kullanım kılavuzu sekmesini getirir." },
    { h2:"^Görünüm", bas:"Görünüm", ne:"Panelin renk temasını seçtiğin kart.", ise:"Paneli göz zevkine ya da ortamın ışığına göre ayarlarsın.", nasil:"Açık, Gece, Sıcak Kum ve Lacivert seçeneklerinden birine tıkla. Seçim bu cihazda saklanır; başka cihazda yeniden seçmen gerekir." },
    { h2:"^Hesap ve lisans", bas:"Hesap ve lisans", ne:"Giriş e-postan, hesap durumun, kalan gün sayın ve kayıtlı cihaz sayın.", ise:"Paketini ve öğrenci kotanın ne kadar dolduğunu da buradan izlersin.", nasil:"Tablodaki \"sil\" düğmesi kullanmadığın cihazın kaydını kaldırır; şu an kullandığın cihaz silinemez. \"Şifremi değiştir\" en az 8 karakterlik yeni şifre ister." },
    { h2:"^İletişim bilgilerin", bas:"İletişim bilgilerin", ne:"Adını ve WhatsApp numaranı yazdığın kart; kurum adı isteğe bağlı.", ise:"KVKK belgelerinde veri sorumlusu ve iletişim bilgisi olarak bunlar yazar; öğrencilerin sana bu numaradan ulaşır.", nasil:"Kutuyu doldurup dışına tıkladığında bilgi kaydolur. Ad ya da numara eksikse kartta sarı uyarı çıkar, ikisi de tamsa \"Bilgilerin tam\" yazar." },
    { h2:"^KVKK belgeleri", bas:"KVKK belgeleri", ne:"Aydınlatma metnini ve veli onay formunu adınla hazırlayıp yazdırılabilir açan kart.", ise:"Veliye vereceğin aydınlatma metni ve imzalatacağın onay formu hazır gelir.", nasil:"\"Aydınlatma metni\" ve \"Veli onay formu\" belgeyi yeni sekmede açar, \"İkisini birlikte\" ikisini art arda koyar. Açılan sayfada \"Yazdır / PDF kaydet\" ile yazdırırsın. Onay kaydını panel tutar, imzalı kâğıdı sen saklarsın." },
    { h2:"^Örnek öğrenci", bas:"Örnek öğrenci", ne:"Paneli tanıman için hazırlanmış örnek kayıtların listede görünüp görünmeyeceğini seçtiğin kart.", ise:"Örnekler kotana sayılmaz; işin bitince listeni sadeleştirirsin.", nasil:"\"Örnek öğrencileri listeden kaldır\" örnekleri bu cihazdaki listeden kaldırır. Geri istersen aynı karttaki \"Örnek öğrenciyi geri getir\" düğmesine bas." },
    { h2:"^Verilerim", bas:"Verilerim", ne:"Bütün öğrencilerinin kayıtlarını tek dosya olarak indirdiğin kart.", ise:"Veriler zaten sunucuda durur; dosyayı arşivlemek ya da başka yere taşımak için indirirsin.", nasil:"\"Tüm verilerimi indir (.json)\" dosyayı bilgisayarına indirir. Bir öğrenciyi silmeden önce indirmen iyi olur." },
    { h2:"^Kullanım videoları", bas:"Kullanım videoları", ne:"Panelin kullanımını anlatan kısa videolar.", ise:"Bir işin nasıl yapıldığını okumadan, ekranda izleyip öğrenirsin.", nasil:"Bir videoya tıkla, bu sayfanın içinde açılır; \"Kapat\" ile kapanır. Açılmazsa altındaki \"YouTube'da aç\" bağlantısını kullan." },
    { h2:"^Kullanım kılavuzu", bas:"Kullanım kılavuzu", ne:"Kılavuzun giriş kartı; menünün nasıl düzenlendiğini anlatır.", ise:"Hangi sekme öğrenciye ait, hangisi öğrenciden bağımsız, burada öğrenirsin.", nasil:"Menüden bir öğrenci seçince onun sekmeleri adının altında açılır. Kokpit ile menünün \"Hesap\" başlığındaki sekmeler öğrenci seçmeden açılır." },
    { h2:"^⚠ Doldurulmazsa çalışmayan yerler", bas:"Doldurulmazsa çalışmayan yerler", ne:"Boş bırakılınca panelin hesaplarını bozan alanları sıralayan uyarı kartı.", ise:"Bir kutu çizgi gösteriyorsa sebebi burada yazar.", nasil:"Kırmızı maddeler hangi boş alanın neyi bozduğunu ve alanın hangi sekmede olduğunu yazar. Örneğin haftalık çalışma saati boşsa \"Yetişir mi\" kutuları çizgi olarak kalır." },
    { h2:"^(Kokpit$|.+ sekmesi)", bas:"Sekme anlatımları", ne:"Panelin sekmelerini menüdeki sırayla anlatan kartlar; her kartın başlığında sekmenin adı var.", ise:"Her sekmenin ne yaptığını ve dikkat edilmesi gerekenleri ayrı ayrı okursun.", nasil:"Aşağı kaydırdıkça sekmeler menüdeki sırayla gelir; renkli kutular o sekmenin uyarıları. Sayfada içindekiler listesi ya da arama kutusu yok." },
    { h2:"^Sık karşılaşılan durumlar", bas:"Sık karşılaşılan durumlar", ne:"Sık karşılaşılan sekiz sorun ve çözümleri.", ise:"Bir şey beklediğin gibi çalışmazsa çözümü sekmeleri dolaşmadan bulursun.", nasil:"Sorunu başlıklardan bul, altındaki çözümü uygula. Örneğin \"Davet kodu üretilmiyor\" başlığı veli onayı kartının eksik olduğunu söyler." },
    { h2:"^Üç kural", bas:"Üç kural", ne:"Kılavuzun son kartı; paneli kullanırken uyulacak temel kurallar.", ise:"Günlük işleyişin özünü kısaca hatırlarsın.", nasil:"Güne Kokpit'le başla, haftalık ödev toplamını öğrencinin beyan ettiği süreyle sınırla. Zayıf konu kartında %50'nin altında kalan konuyu bitmiş sayma." },
    { sec:"button[onclick^=\"kocSek\"][onclick*=\"ogrenci\"]", bas:"Veli onayı eksik", ne:"Seçili öğrencinin veli onayı tamamlanmadığında sekmenin tepesinde çıkan kırmızı şerit.", ise:"Onay tamamlanana kadar bu öğrencide yaptıklarının sunucuya kaydedilmediğini hatırlatır.", nasil:"\"Veli onayı kartını aç\" seni Öğrenci bilgileri sekmesindeki onay kartına götürür." },
    { sec:"a[onclick^=\"ornekGizle\"]", bas:"Örnek kayıt uyarısı", ne:"Seçili öğrencinin paneli tanıtmak için hazırlanmış örnek kayıt olduğunu söyleyen uyarı.", ise:"Örnek öğrencide yaptığın değişikliklerin kaydedilmediğini ve kotana sayılmadığını hatırlatır.", nasil:"Sekmeleri gezip panelin dolu hâlini görebilirsin. İşin bitince \"Listeden kaldır\" ile örneği gizle; Hesap sekmesindeki \"Örnek öğrenci\" kartından geri getirebilirsin." },
    { sec:"button:not(.wide)[onclick^=\"demoBitir\"]", bas:"Tanıtım modu", ne:"Panelin tanıtım modunda açıldığını gösteren şerit.", ise:"Beş örnek öğrenciyle sekmeleri kayıt yapmadan denersin.", nasil:"Menüden öğrenci değiştirip sekmeleri gez; hiçbir şey kaydedilmez. \"Kendi hesabımı açayım\" seni kayıt ekranına götürür." },
    { sec:"[onclick^=\"ABONE=true\"]", bas:"Kullanım süresi uyarısı", ne:"Kullanım süren dolduğunda ya da bitmesine 7 gün veya daha az kaldığında çıkan uyarı.", ise:"Süre dolunca yeni kayıt yapılamayacağını önceden bilirsin.", nasil:"Süre dolduysa verilerin okunur ama ödev veremez, kayıt yapamazsın; öğrencilerin de panellerine yazamaz. \"Paketleri gör\" paket seçimine götürür." },
    { tab:"kokpit", sec:".stats", bas:"Risk şeridi", ne:"Toplam öğrenci sayın ve öğrencilerinin üç risk grubuna dağılımı.", ise:"Kaç öğrencinin bugün müdahale beklediğini tablonun tamamına bakmadan görürsün.", nasil:"Kutular yalnız sayar, tıklanmaz; adlar alttaki tabloda. Öğrencinin yeni işaretlediği ödev ya da girdiği deneme sayılara sayfayı yenileyince yansır." },
    { tab:"durum", sec:".stats", bas:"Durum özeti", ne:"Son üç denemenin toplam net ortalaması, hedef toplam net, ikisi arasındaki fark ve bu haftanın ödev uyumu.", ise:"Öğrencinin hedefe göre durumunu ve bu haftaki ödev düzenini tek satırda okursun.", nasil:"Ortalama her dersin son üç denemedeki netinden alınır, branş denemeleri sayılmaz. Hedef toplam net için Hedef sekmesindeki ders hedefleri toplanır. Bu hafta hiç ödev verilmediyse uyum kutusunda \"ödev yok\" yazar." },
    { tab:"durum", sec:"svg[height=\"96\"]", bas:"Ders ders net seyri", ne:"Deneme girilmiş her dersin denemeden denemeye netini gösteren küçük grafik.", ise:"Toplam netin arkasında hangi dersin geride kaldığını ayırt edersin.", nasil:"Kartın başında son net ile hedef net yazar, fark parantez içinde; eksi fark kırmızı. Bu grafiklere branş denemeleri de girer." },
    { tab:"konu", sec:".stats:not(.uc)", bas:"Konuların özeti", ne:"Kalan ve biten konu sayısı, haftalık çalışma beyanı ve sınava kalan hafta; altında kalan sürenin iki ayrı hesabı durur.", ise:"Kalan iş kaç saat tutuyor, haftada kaç saat istiyor, öğrencinin beyanıyla yan yana görürsün.", nasil:"Soldaki iki sayı yalnız konu çalışmasını sayar, sağdaki iki sayı buna hedeflenen soru çözümünü ekler; plan yaparken sağdakine bak. İşleniyor konular yarım, eksik konular %70 süreyle sayılır. Beyan boşsa Hedef sekmesindeki \"Haftalık çalışma saati (beyan)\" kutusunu doldur." },
    { tab:"puan", sec:"#pvYer", bas:"Puan özeti", ne:"Tablodaki netlerle hesaplanan TYT puanı, yerleştirme puanı, OBP katkısı ve hedef puana fark.", ise:"Bir net dağılımı öğrenciyi hedef puana taşıyor mu, burada görürsün.", nasil:"İlk iki puana OBP dahil. Hedef puan, Hedef sekmesindeki \"Hedef puan\" kutusundan gelir; fark eksideyse kırmızı, değilse yeşil yazılır." },
    { tab:"veli", sec:"#veliNot", bas:"Haftalık veli raporu", ne:"Seçili öğrencinin bu haftasını panel verisinden özetleyen, veliye gidecek rapor.", ise:"Veliyi her hafta ödev uyumu, deneme gidişatı, konu ilerlemesi ve önümüzdeki haftanın planıyla bilgilendirirsin.", nasil:"\"Koçun notu\" taslağını düzenleyip \"WhatsApp'ta gönder\" ya da \"PDF / Yazdır\" düğmesine bas. WhatsApp veli telefonuyla, o yoksa öğrencinin numarasıyla açılır; mesajı sen gönderirsin. Not kaydedilmez, sekmeden ayrılırsan taslak yeniden yazılır; öğrencinin son girdileri için raporu açmadan önce sayfayı yenile." },
    { tab:"ogrenci", sec:":scope > .body:first-child > .flag.bad:only-child", bas:"Onayı eksik öğrenciler", ne:"Veli onayı kaydı tamamlanmamış bütün öğrencilerini adlarıyla sıralayan kırmızı uyarı.", ise:"Sunucunun değişikliklerini kaydetmediği öğrencileri tek yerde görürsün.", nasil:"Listedeki her öğrenciyi menüden seç, bu sayfadaki \"Veli onayı eksik\" kartını doldur. Son öğrencinin onayı tamamlanınca uyarı kalkar." },
    { tab:"davet", sec:"[role=progressbar]", bas:"Davet bağlantın", ne:"Referans kodunu taşıyan davet bağlantın ve bir sonraki ödül yılına kalan yol.", ise:"Öğretmen arkadaşlarını çağırırsın, öğrencilerini çağırmazsın; her 2 ücretli davet lisansına kendiliğinden 1 yıl ekler.", nasil:"\"WhatsApp'tan davet gönder\" hazır mesajla WhatsApp'ı açar, kişiyi sen seçersin; \"Bağlantıyı kopyala\" bağlantıyı panoya alır. Bağlantıyla gelen kişide kod kendiliğinden dolar, elle kaydolan kodu kayıt ekranında yazar." },
    { tab:"davet", sec:".stats", bas:"Davet sayıları", ne:"Davet ettiğin, pakete geçen, kazandığın yıl ve sonraki yıla kalan davet sayılarını gösteren dört kutu.", ise:"Davetlerinin ne kadarının ödüle dönüştüğünü buradan izlersin.", nasil:"\"Pakete geçen\" yalnız ücretli aboneleri sayar; ödül bu sayıya göre verilir. Sayılar sekmeye ilk girişte okunur, güncel hâli için sayfayı yenile." },
    { tab:"davet", sec:":scope > .body:first-child > .flag:only-child", bas:"Seni davet eden", ne:"Kayıt olurken kullandığın referans kodunun sonucu ve seni kimin davet ettiği.", ise:"Pakete geçtiğinde seni davet eden koçun sayacı da ilerler.", nasil:"Kart yalnız referans koduyla kaydolduysan çıkar. Kod uygulanamadıysa kırmızı uyarı görünür; bağlantı hatasında sayfayı yenileyince kod yeniden denenir." },
    { tab:"ozel", sec:":scope > .body:first-child > .flag.bad", bas:"Özel ders erişimi kapalı", ne:"Yönetim özel ders erişimini kapattığında sekmede tek başına çıkan kart.", ise:"Erişimin neden kapandığı burada yazar.", nasil:"Gerekçe kartta yazar. İtiraz için \"Biyoser'e yaz\" bağlantısı WhatsApp'ı hazır mesajla açar." }
  ];

  var OGR = [
    { h2:/^Geçen haftalardan kalanlar/, bas:'Geçen haftalardan kalanlar',
      ne:"Önceki haftalardan kalan, \"Yaptım\" işaretlemediğin ödevler.",
      ise:"Biriken işlerin unutulmaz.",
      nasil:"Bitirdiğin ödeve \"Yaptım\" de. İşaretlemezsen her hafta burada durur." },
    { h2:/^Bu haftanın konu ödevleri/, bas:'Bu haftanın konu ödevleri',
      ne:"Bu hafta öğretmeninin verdiği konu ödevleri.",
      ise:"Çalışacağın konu ve çözeceğin soru sayısı burada yazar.",
      nasil:"Her ödev için \"Yaptım\", \"Yarım\" ya da \"Yapamadım\" seç; soru hedefi varsa doğru, yanlış ve boş sayını da gir. Öğretmenin panelini yenileyince görür." },
    { h2:/^Sabit rutin/, bas:'Sabit rutin',
      ne:"Her hafta tekrarlanan işler, mesela paragraf ve problem soruları.",
      ise:"Pratiğin aksamadan sürer.",
      nasil:"Hafta içinde kaç soru çözdüysen gir; çubuk hedefe ne kadar yaklaştığını gösterir." },
    { h2:/^Kendi çalışmam/, bas:'Kendi çalışmam',
      ne:"Öğretmeninin vermediği, kendi başına çalıştığın konular.",
      ise:"Bu çalışma da kayda geçer, öğretmenin de görür.",
      nasil:"Dersi, üniteyi ve konuyu seçip ekle; eklediğin çalışma yapılmış sayılır." },
    { h2:/^Kendime rutin ekle/, bas:'Kendime rutin ekle',
      ne:"Konuya bağlı olmayan, her hafta tekrar eden kendi işlerin; paragraf ya da kelime çalışması gibi.",
      ise:"Düzenli işlerin haftalık planına girer.",
      nasil:"Dersi ve rutinin adını yazıp ekle. Rutin kendiliğinden Sabit rutin kartına ve Programım takvimine düşer." },
    { h2:/^Kendine ödev ver/, bas:'Kendine ödev ver',
      ne:"Öğretmenin yoksa hedefine göre sıradaki konular.",
      ise:"Planı sen kurarsın.",
      nasil:"Soru sayısını yaz ya da boş bırak; sonra konuyu listeden ödev olarak ekle." },
    { h2:/^Tamamladıkların/, bas:'Tamamladıkların',
      ne:"Bitirip listeden çıkardığın ödevler.",
      ise:"Kaydı kalır, öğretmenin hepsini görür.",
      nasil:"\"Listeyi göster\" ile açılır. Yanlışlıkla bitirdiysen \"geri al\" ile listeye döndür." }
,

    // ---- Kalan sekmeler (ajanların yazdığı, kodla doğrulanmış) ----
    { tab:"konu", h2:"^Yetişir mi\\W+yalnız konu", bas:"Yetişir mi: yalnız konu", ne:"Soru çözümü hariç, kalan konuları bitirmeye haftalık çalışma sürenin yetip yetmediği.", ise:"Konuların sınava kadar bitip bitmeyeceğini anlarsın.", nasil:"Kutuların dolması için Hedefe uzaklık sekmesindeki \"Hedefim\" kartına haftalık çalışma süreni gir. Sağdaki iki sütun gereken süreye %15 ve %30 pay ekler." },
    { tab:"konu", h2:"^Yetişir mi\\W+konu \\+ soru", bas:"Yetişir mi: konu ve soru", ne:"Konuları bitirip hedeflenen soruları da çözmeye haftalık sürenin yetip yetmediği.", ise:"Sınava hazır olup olamayacağını anlarsın.", nasil:"Aksamalara yer kalsın diye sağdaki iki sütun gereken süreye %15 ve %30 pay ekler. Soldaki kart \"Yetişir\", bu kart \"Yetişmez\" diyorsa konuları bitirirsin ama yeterince soru çözemezsin." },
    { h2:"^Ders ders durumun", bas:"Ders ders durumun", ne:"Her dersin bitirdiğin, kalan ve eksik konuları ile tahmini süresi.", ise:"Hangi derste geride kaldığını karşılaştırırsın.", nasil:"Satıra dokununca o dersin konuları aşağıda açılır. \"Tamamlanma\" çubuğu, o derste bitirdiğin konuların payını gösterir." },
    { h2:"^Karneni yapıştır", bas:"Karneni yapıştır", ne:"Deneme karnenin PDF'ini ya da metnini okutup netleri dolduran kutu.", ise:"Doğru ve yanlışları tek tek elle yazman gerekmez.", nasil:"Karneyi \"PDF yükle\" ile seç ya da metnini kopyalayıp yapıştır, sonra \"Karneyi oku\" de. Sayılar deneme formuna geçer; bir göz atıp \"Denemeyi kaydet\"e bas." },
    { tab:"deneme", h2:"^(TYT|AYT|Branş) denemesi", bas:"Deneme girişi", ne:"Bir denemenin ders ders doğru ve yanlışlarını girdiğin form.", ise:"Netlerin kayda geçer; gelişim grafiklerin ve hedef karşılaştırmaların bunlarla dolar.", nasil:"Tarihi ve deneme adını yaz, en az bir dersin doğru ve yanlışını doldurup \"Denemeyi kaydet\"e bas. Net, doğrudan yanlışın dörtte biri çıkarılarak hesaplanır; öğretmenin panelini yenileyince görür." },
    { h2:"^Yanlış ve boş konular", bas:"Yanlış ve boş konular", ne:"Seçtiğin denemede yanlış yaptığın ya da boş bıraktığın konular.", ise:"Öğretmeninin karneden girdiği konuları görür, fark ettiklerini sen eklersin.", nasil:"Dersi ve konuyu seç, adedi ve \"Konudan soru\" sayısını yazıp \"Konuyu ekle\" de. Soru sayısı boşsa doğru oranı hesaplanmaz. Yalnız \"senin\" etiketli satırları silebilirsin, öğretmeninin girdiklerini silemezsin." },
    { h2:"^Zayıf konular", bas:"Zayıf konular", ne:"Deneme konu analizlerinde doğru oranı %50'nin altında kalan konular.", ise:"Gerçekten eksik konunu bulursun; ölçülen, konunun kaç kez çıktığı yerine ne kadarını doğru yaptığın.", nasil:"Oran yalnız konudan çıkan soru sayısı girilmiş denemelerden hesaplanır. Bitirdim dediğin bir konu burada çıkıyorsa Konularım sekmesinde onu \"Eksiğim var\" yap." },
    { h2:"^Son \\d+ deneme", bas:"Son denemeler, ders bazında", ne:"Branş dışı son 3 denemende her dersin netini hedefinle karşılaştıran tablo.", ise:"Hedefin gerisinde kaldığın dersi buradan bulursun.", nasil:"\"Seyir\" sütunu netlerini eskiden yeniye dizer. \"Fark\" ortalamanın hedef netten uzaklığı; kırmızıysa gerisindesin." },
    { h2:"^Geçmiş denemeler", bas:"Geçmiş denemeler", ne:"Senin ve öğretmeninin girdiği bütün denemeler, ders ders net ve toplamla.", ise:"Deneme geçmişini tek tabloda görür, bir denemenin konularına inersin.", nasil:"\"konu gir\" ya da \"konular\" düğmesi o denemenin yanlış ve boş konular kartını açar. \"sil\" önce onay ister; öğretmeninin girdiği denemeyi silersen onun panelinden de gider." },
    { h2:"^Durumun", bas:"Durumun", ne:"Öğretmeninin panelinde seni özetleyen satırın aynısı.", ise:"Son deneme ortalamaların ve ödev düzenin burada bir arada.", nasil:"Ödev uyumu \"Yaptım\" işaretli ödevlerin payıdır, \"Yarım\" kalanlar yarım sayılır. Uyum %60'ın altına düşer ya da 6 ödev devrederse durum \"Acil\" olur." },
    { h2:"^Çözdüğün soru", bas:"Çözdüğün soru", ne:"Ödevlerinde çözdüğünü yazdığın soruların ders ders toplamı.", ise:"Hangi derste ne kadar soru çözdüğünü kıyaslarsın.", nasil:"Ödevlerim sekmesine çözdüğün soruları girdikçe çubuklar uzar. En çok soru çözdüğün ders en üstte durur." },
    { h2:"^TYT gelişimin", bas:"TYT gelişimin", ne:"TYT denemelerindeki toplam netinin deneme deneme grafiği.", ise:"Netinin artıp artmadığını izlersin.", nasil:"Her nokta bir denemedir, altında tarihi yazar. Üstteki satır son netini ve ilk denemene göre farkını gösterir." },
    { h2:"^.*AYT gelişimin", bas:"AYT gelişimin", ne:"Kendi alanındaki AYT denemelerinin toplam netinin grafiği.", ise:"AYT'deki ilerlemeni izlersin.", nasil:"Her nokta bir deneme ve yalnız kendi alanının dersleri sayılır. Son netin ve ilk denemene göre farkın üstteki satırda yazar." },
    { h2:"^Branş denemelerin", bas:"Branş denemelerin", ne:"Tek dersten çözdüğün branş denemeleri ve netleri.", ise:"Branş çalışmanı TYT ve AYT grafiklerine karıştırmadan izlersin.", nasil:"En yeni deneme en üstte durur. Branş denemesi için \"Denememi gir\" sekmesinde \"Branş\" seç." },
    { h2:"^Bölüm seç", bas:"Bölüm seç", ne:"Hedef bölümünü YÖK verisinde aradığın kutu.", ise:"Bölümü seçince hedef puanın ve ders ders hedef netlerin kendiliğinden dolar.", nasil:"\"Bölüm listesini yükle\" de, en az 3 harf yazıp ara ve \"seç\" düğmesine bas. Yalnız kendi alanının bölümleri çıkar; liste bulunamazsa hedefini \"Hedefim\" kartına elle yaz." },
    { h2:"^Hedefim", bas:"Hedefim", ne:"Hedef bölümünü ve haftalık çalışma süreni tuttuğun kart.", ise:"Hedef karşılaştırmaları ve yetişir mi hesapları bu bilgilere dayanır; sınav tarihi ortak, onu öğretmenin belirler.", nasil:"\"Haftalık çalışma sürem\" kutusuna ders dışında haftada kaç saat çalıştığını yaz; boş kalırsa \"Yetişir mi\" kutuları boş kalır. Seçtiğin bölümün taban puanından düşük hedef puan kabul edilmez." },
    { h2:"^Ders ders hedef net", bas:"Ders ders hedef net", ne:"Hedef bölümün için her dersten gereken neti gösteren tablo.", ise:"Hedef karşılaştırmaları bu netlere dayanır.", nasil:"Bölümü seçince kendiliğinden dolar. İstersen \"Hedef net\" kutusunu elle değiştir." },
    { h2:"^TYT net seyri", bas:"TYT net seyri", ne:"TYT denemelerindeki toplam netinin grafiği.", ise:"TYT netinin hedefe doğru gidişini izlersin.", nasil:"Grafik deneme girince belirir. Her nokta bir deneme; üstteki satırda deneme sayın ve son netin yazar." },
    { h2:"^.*AYT net seyri", bas:"AYT net seyri", ne:"Kendi alanındaki AYT denemelerinin toplam netinin grafiği.", ise:"AYT'de netinin hedefe doğru gidişi burada.", nasil:"Deneme girince grafik görünür. Her nokta bir deneme; deneme sayın ve son netin üstteki satırda yazar." },
    { h2:"^Ders ders hedefe uzaklık", bas:"Ders ders hedefe uzaklık", ne:"Her dersteki ortalama netini hedef netinle yan yana gösteren çubuklar.", ise:"Hangi derste ne kadar açığın olduğunu görürsün.", nasil:"Mavi çubuk son denemelerinin (en çok 3) ortalaması, turuncu çizgi hedefin. Sağdaki son sayı aradaki fark; hedef neti girilmemiş derste fark boş kalır." },
    { tab:"odev", h2:"^Bu haftanın planı", bas:"Bu haftanın planı", ne:"Sınava yetişmen için panelin bu hafta önerdiği konular.", ise:"Öğretmenin olmadığı için haftalık ödevini bu planı kabul edip alırsın.", nasil:"Plan sana uyuyorsa \"Bu haftanın ödevlerini bana ver\" düğmesine bas; ödevler oluşup Programım takvimine dağıtılır. Erken bitirirsen sıradaki konuları aynı düğmeden alırsın." },
    { tab:"odev", h2:"^Bitirdin ama tutmamış", bas:"Bitirdin ama tutmamış", ne:"İşliyorum ya da Bitirdim işaretlediğin halde denemelerde doğru oranın %50'nin altında kalan konular.", ise:"Bitti sandığın ama henüz oturmamış konuları yakalarsın.", nasil:"Öğretmenin yoksa satırdaki \"Ödeve ekle\" ile konuyu kendine ödev ver. Öğretmenin varsa listeyi onunla konuş, ödevi o verir." },
    { tab:"program", h2:"^Haftalık programım", bas:"Haftalık programım", ne:"Bu haftanın ödevlerinin 15 dakikalık dilimlerle günlere yerleştirildiği takvim.", ise:"Hangi gün hangi saatte ne çalışacağın belli olur.", nasil:"Müsait olmadığın saatleri \"Saat aç / kapat\" ya da \"Saatlerimi kur\" düğmeleriyle kapat; blokları sürükleyip taşıyabilirsin. \"Yeniden dağıt\" elle taşıdıklarına dokunmaz, gerisini baştan yerleştirir. Bir bloğa tıklarsan o konunun anlatım videoları açılır." },
    { h2:"^Diploma notun", bas:"Diploma notun (OBP)", ne:"Diploma notunu girdiğin ve OBP'nin hesaplandığı kart.", ise:"Diploma notun puanına eklenir, girmezsen puan hesabı eksik kalır.", nasil:"Notunu 100 üzerinden yaz; OBP notun 5 katı olarak kendiliğinden dolar ve kaydedilir. Geçen yıl bir yere yerleştiysen \"Geçen yıl bir üniversiteye yerleştim\" kutusunu işaretle, OBP katkısı yarıya iner." },
    { h2:"^Net dağılımı", bas:"Net dağılımı", ne:"Her dersin netini, katsayısını ve puana katkısını gösteren tablo.", ise:"Hangi dersten kaç net yaparsan hedef puana ulaşacağını denersin.", nasil:"Tablo son 3 denemenin ortalamasıyla açılır; bir neti değiştirdiğin an puanlar yeniden hesaplanır. Netler kendiliğinden kaydedilmez. Beğendiğin dağılımı \"Bu dağılımı hedef net olarak kaydet\" ile hedef netlerine yaz." },
    { h2:"^Hedef puanı değiştir", bas:"Hedef puanı değiştir", ne:"Hedef puanını değiştirdiğin kart; yanında seçili bölümün taban puanı durur.", ise:"Hedef puanınla hedef bölümünü birbiriyle uyumlu tutar.", nasil:"Yeni puanı \"Hedef puan\" kutusuna yaz. Seçili bölümün tabanından düşük puan kabul edilmez; hedefini düşüreceksen önce \"Hedefe uzaklık\" sekmesinden o puana uyan bir bölüm seç." },
    { h2:"^Bu hafta ne yaptın", bas:"Bu hafta ne yaptın", ne:"Ödevlerini hangi durumda işaretlediğini sayan ve rapora girecek denemeleri gösteren özet.", ise:"Raporu göndermeden önce durumuna son bir kez bakarsın.", nasil:"Sayılar Ödevlerim sekmesindeki işaretlerinden gelir ve burada değişmez. Bir ödevi düzeltmek için Ödevlerim sekmesine dön." },
    { h2:"^Öğretmenine not", bas:"Öğretmenine not", ne:"Haftan hakkında öğretmenine yazdığın kısa not.", ise:"Takıldığın yeri öğretmenin buradan öğrenir.", nasil:"Kutuya yazman yeterli, not raporla birlikte gider. Hangi konuyu anlamadığını tek cümleyle söyle." },
    { h2:"^Raporu gönder", bas:"Raporu gönder", ne:"Haftalık raporunu kod olarak öğretmenine ilettiğin kart.", ise:"Hesapsız kullanıyorsan işaretlerin öğretmenine bu yolla ulaşır.", nasil:"\"Öğretmenime WhatsApp'tan gönder\" WhatsApp'ı mesajı hazır açar. İstersen \"Kodu kopyala\" ile kendin yapıştır. Kodun tamamını gönder, ortasından kesme." },
    { h2:"^Yeni paket yükle", bas:"Yeni paket yükle", ne:"Öğretmeninin gönderdiği yeni davet kodunu yapıştırdığın kutu.", ise:"Ödev listeni yenilersin; konu işaretlerin ve denemelerin korunur.", nasil:"Kodun tamamını kutuya yapıştır, sonra \"Paketi yükle\" düğmesine bas. Aynı kodu ikinci kez yüklersen panel uyarır, bir şey eklenmez." },
    { tab:"ayar", h2:"^Kullanım kılavuzu", bas:"Kullanım kılavuzu", ne:"Tam kullanım kılavuzunu açan kısa yol.", ise:"Panelin her sekmesini anlatan sayfaya tek dokunuşla gidersin.", nasil:"\"Kılavuzu aç\" düğmesine bas; kılavuz kendi sekmesinde açılır." },
    { h2:"^Sürüm", bas:"Sürüm", ne:"Kullandığın panel sürümünün adı.", ise:"Öğretmenin yeni sürüm çıktı derse güncel olup olmadığını buradan anlarsın.", nasil:"Yeni sürüm için sayfayı yenile; telefonda aşağı çek, bilgisayarda Ctrl+F5'e bas. Yenilemek verilerini silmez." },
    { h2:"^Verilerim", bas:"Verilerim", ne:"Bu cihazdaki bilgilerini dosyaya yedeklediğin ve geri yüklediğin kart.", ise:"Telefon değiştirince ya da tarayıcı verisi silinince bilgilerini geri getirirsin.", nasil:"\"Yedek indir (.json)\" bir yedek dosyası indirir. \"Yedek yükle\" ile o dosyayı seçersen panel onay sorar ve şimdiki verilerinin yerine yedeği koyar." },
    { h2:"^Yönetime mesaj", bas:"Yönetime mesaj", ne:"Biyoser yönetimiyle yazıştığın mesaj kutusu.", ise:"Panelle ilgili sorun ve önerilerin buradan yönetime gider; ders ve konu sorularını öğretmenine sor.", nasil:"Mesajını yaz, \"Gönder\" düğmesine bas. Cevap gelmişse paneli açınca ya da yenileyince Yardım sekmesinin yanında bir sayı belirir." },
    { h2:"^Başlangıç rehberi", bas:"Başlangıç rehberi", ne:"İlk girişte açılan 5 adımlık tanıtım kutusu.", ise:"Panele nereden başlayacağını hatırlatır.", nasil:"\"Başlangıç rehberini aç\" düğmesine bas. Sağ üstteki çarpı ya da Esc tuşu kutuyu kapatır." },
    { h2:"^Görünüm", bas:"Görünüm", ne:"Panelin renk temasını seçtiğin kart.", ise:"Gözüne en rahat gelen renklerle çalışırsın.", nasil:"Bir temaya dokun, panel o renge geçer. Seçimin yalnız bu cihazda saklanır." },
    { h2:"^Kullanım videoları", bas:"Kullanım videoları", ne:"Panelin kullanımını anlatan kısa videolar.", ise:"Bir özelliği okumak yerine izleyip öğrenirsin.", nasil:"İzlemek istediğin videoya bas, bu sayfada açılır; \"Kapat\" ile kapatırsın. Açılmazsa altındaki \"YouTube'da aç\" bağlantısını kullan." },
    { h2:"^Kısa kılavuz", bas:"Kısa kılavuz", ne:"Panelin sekmelerini birer satırla özetleyen liste.", ise:"Aradığın işin hangi sekmede olduğunu buradan bulursun.", nasil:"Ayrıntı istersen en alttaki \"Tam kullanım kılavuzunu aç\" düğmesine bas." },
    { h2:"^Takıldın mı", bas:"Takıldın mı?", ne:"Öğretmenine WhatsApp'tan yazmanı sağlayan kısa yol.", ise:"Panelde bir sorun yaşadığında öğretmenine hemen haber verirsin.", nasil:"\"Öğretmenime yaz\" WhatsApp'ı öğretmeninin numarası ve hazır bir mesajla açar. Bu mesaj giriş sorununu anlatır; senin durumun farklıysa göndermeden düzelt." },
    { h2:"^Yeni özel ders talebi", bas:"Yeni özel ders talebi", ne:"Tek seferlik özel ders için talep açtığın form.", ise:"Takıldığın konuda seçtiğin branştaki öğretmenlerden destek istersin.", nasil:"Branşı ve tarihi seç, takıldığın konuyu yaz, WhatsApp numaranı gir. Veli kutusunu işaretleyince \"Talebi yayınla\" düğmesi açılır. Adın ve telefonun yalnız dersi kabul eden öğretmene iletilir." },
    { h2:"^Taleplerim", bas:"Taleplerim", ne:"Yayında olan ve öğretmen bulunan özel ders taleplerin.", ise:"Talebinin hangi aşamada olduğunu izlersin.", nasil:"Yayındaki talebi \"Talebi geri çek\" ile kaldırırsın. Öğretmen kabul edince sana WhatsApp'tan ulaşır. Anlaşamazsanız \"Yeniden yayınla\" ile talebi tekrar aç; kaç hakkın kaldığı düğmede yazar." },
    { h2:"^Geçmiş derslerim", bas:"Geçmiş derslerim", ne:"Tamamlanan ve \"gelmedi\" işaretlenen derslerin listesi.", ise:"Yapılan dersi onaylar, yapılmayan ders için itiraz edersin.", nasil:"Ders yapıldıysa 1 ile 5 arasında yıldız ver; yıldız dersin yapıldığını da onaylar. Yapılmadıysa yıldız vermeden \"Bu ders yapılmadı\" düğmesine bas. Başka bir sorun için \"Sorun bildir\" bağlantısını kullan." },
    { h2:"^(Bilgilerin nerede duruyor|⚠ Çok önemli)", bas:"Bilgilerin nerede", ne:"Bilgilerinin nerede saklandığını anlatan kart.", ise:"Hangi durumda veri kaybedebileceğini önceden bilirsin.", nasil:"Hesabınla girdiysen bilgilerin sunucudadır, her cihazdan aynısını görürsün; \"son işlem kayıt olmadı\" penceresi çıkarsa \"Tekrar dene\" düğmesine bas. Hesabın yoksa bilgilerin yalnız bu tarayıcıdadır; geçmişi silme, ayda bir yedek al." },
    { h2:"^Bu panel ne işe yarar", bas:"Bu panel ne işe yarar", ne:"Panelle neler yapabileceğini maddeler hâlinde sayan kart.", ise:"Panelin sana neler kazandıracağı burada kısaca yazar.", nasil:"Maddelerde geçen sekmelerin ayrıntısı aşağıdaki kartlardadır." },
    { h2:"^⚠ Doldurmazsan", bas:"Doldurmazsan çalışmayan yerler", ne:"Boş bırakıldığında panelin hesap yapamadığı alanlar.", ise:"Böylece panel sana yanlış sonuç göstermez.", nasil:"En önemlisi haftalık çalışma süren: \"Hedefe uzaklık\" sekmesindeki \"Hedefim\" kartından gir. Konularını işaretle, hedef bölümünü seç; öğretmenin yoksa haftanın planını da kabul et." },
    { h2:"^(Ödevlerim|Programım|Konularım|Denememi gir|Gelişimim|Hedefe uzaklık|Puan hesapla|Yardım|Özel Ders|Paketim|Rapor gönder|Ayarlar) sekmesi", bas:"Sekme anlatımları", ne:"Her biri bir sekmeyi anlatan kartlar.", ise:"Bir sekmede ne yapacağını bilemediğinde cevap burada.", nasil:"Aradığın sekmenin adıyla başlayan kartı oku. Programım ve Özel Ders kartları yalnız hesabınla girdiğinde, Rapor gönder ve Ayarlar kartları yalnız hesapsız kullanımda görünür." },
    { h2:"^Sık karşılaşılan durumlar", bas:"Sık karşılaşılan durumlar", ne:"Öğrencilerin en sık takıldığı durumlar ve çözümleri.", ise:"Bir sorun çıkınca önce buraya bak; çoğunu kendin çözersin.", nasil:"Her satırın başlığında bir durum, altında ne yapman gerektiği yazar." },
    { h2:"^Üç kural", bas:"Üç kural", ne:"Paneli verimli kullanman için temel kurallar.", ise:"Panelin sana doğru plan çıkarması bu kurallara bağlı.", nasil:"Kuralları bir kez oku ve her hafta işaretlerini dürüstçe yap." },
    { tab:"konu", sec:".stats", bas:"Konu özeti", ne:"Bütün derslerinde toplam, bitirdiğin ve kalan konu sayısı ile gereken süre.", ise:"Konu haritanda nerede durduğunu buradan görürsün.", nasil:"Konuları işaretledikçe sayılar değişir. \"Gereken süre\" kalan konuların anlatımını ve soru çözümünü birlikte kapsar; işlediğin konular yarım sayılır." },
    { tab:"konu", sec:"select", bas:"Ders seçimi", ne:"Konularını göreceğin dersi seçtiğin kutu; o dersi ne kadar bitirdiğini çubukla gösterir.", ise:"Aşağıdaki ünite kartları seçtiğin dersin konularıyla dolar.", nasil:"\"Ders\" listesinden dersi seç. Konuların yanındaki \"ÖNCE BU\" gibi etiketler, ÖSYM'de konudan çıkan soru sayısına bakıp çalışma sırası önerir. \"TEMEL\" işaretli konular başka konulara altyapı olur." },
    { tab:"konu", sec:".topic", bas:"Ünite konuları", ne:"Seçtiğin dersin bir ünitesindeki konular; her konunun tahmini süresi ve soru hedefiyle.", ise:"Konu durumunu işaretlersin; öğretmenin panelini yenileyince görür, yetişir mi hesapları da buna göre değişir.", nasil:"Konunun yanındaki düğmeye her dokunuşta durum Görmedim, İşliyorum, Bitirdim ve Eksiğim var arasında döner; \"Bitirdim\" dediğin konunun bekleyen ödevi varsa onları da \"Yaptım\" sayıp saymayacağın sorulur. \"▶\" düğmesi konunun anlatım ve soru çözümü videolarını YouTube'da aratır." },
    { tab:"deneme", sec:".seg", bas:"Deneme türü", ne:"Gireceğin denemenin türünü seçtiğin düğme grubu.", ise:"Aşağıdaki formda yalnız o türün dersleri çıkar.", nasil:"\"TYT\" bütün TYT derslerini, \"AYT\" kendi alanının AYT derslerini getirir. \"Branş\" seçersen formda tek bir ders seçersin." },
    { tab:"gelisim", sec:"svg[aria-label=\"Net seyri\"]", bas:"Ders ders net seyri", ne:"Her dersin deneme deneme netini gösteren küçük grafikler.", ise:"Hangi derste ilerlediğini, hangisinde durduğunu ayrı ayrı görürsün.", nasil:"Kartın üstünde son netin ve hedef netin yazar; parantezdeki fark kırmızıysa hedefin altındasın. Yalnız deneme girdiğin dersler görünür." },
    { tab:"gelisim", sec:":scope > .empty", bas:"Henüz deneme yok", ne:"Hiç deneme girilmediğinde çıkan bilgi kutusu.", ise:"Grafiklerin nereden dolacağını söyler.", nasil:"\"Denememi gir\" sekmesinden ilk denemeni kaydet; grafikler kendiliğinden oluşur." },
    { tab:"hedef", sec:".stats + .stats", bas:"Sınava kalan süre", ne:"Sınava kalan hafta ile kalan konuların ve soruların gerektirdiği saat.", ise:"Gereken haftalık saati kendi beyanınla karşılaştırırsın.", nasil:"Gereken süre beyan ettiğin haftalık süreyi aşarsa sayı kırmızı olur. \"Konularım'a git\" düğmesi yetişir mi senaryolarını açar." },
    { tab:"hedef", sec:".stats", bas:"Puan ve net farkı", ne:"Son denemelerine göre yaklaşık puanını hedef puanınla karşılaştıran özet.", ise:"Hedefine kaç puan ve kaç net uzakta olduğunu görürsün.", nasil:"Puan, branş dışındaki son 3 denemenin ders ortalamalarından yaklaşık hesaplanır. Fark kırmızıysa hedefin altındasın, yeşilse üstündesin." },
    { tab:"hedef", sec:"svg[aria-label=\"Net seyri\"]", bas:"Ders ders net seyri", ne:"Her dersin deneme deneme netini gösteren küçük grafikler.", ise:"Hedefe hangi derste yaklaştığını ayrı ayrı izlersin.", nasil:"Kartın üstünde son netin ve hedef netin yazar. Parantezdeki fark kırmızıysa hedefin altındasın; yalnız deneme girdiğin dersler görünür." },
    { tab:"odev", sec:".kahraman", bas:"Kalan iş", ne:"Bu hafta kaç ödevin kaldığını, ne kadarını bitirdiğini gösteren özet.", ise:"Panele girer girmez ne kadar işin kaldığını görürsün.", nasil:"Sayılar ödevleri işaretledikçe değişir; geçen haftalardan kalanlar da kalan işe sayılır. \"Kalan süre\" bitmemiş işlerinin tahmini çalışma süresidir." },
    { tab:"odev", sec:":scope > .body:first-child > .flag.warn", bas:"Yedek hatırlatması", ne:"Hiç yedek almadıysan ya da son yedeğinin üzerinden 14 gün geçtiyse çıkan uyarı.", ise:"Telefonun sıfırlansa ya da tarayıcı verisi silinse bile bilgilerini geri getirebilirsin.", nasil:"\"Ayarlara git\" düğmesine bas, orada \"Yedek indir (.json)\" ile dosyayı indir. Yedeği alınca uyarı kalkar." },
    { tab:"puan", sec:":scope > .stats", bas:"Puan özeti", ne:"Netlerinle hesaplanan TYT puanın, yerleştirme puanın, hedef puanın ve hedefe farkın.", ise:"Aşağıdaki tabloda netlerle oynadıkça hedefe ne kadar yaklaştığını izlersin.", nasil:"İki puana da diploma notundan gelen OBP katkısı eklenir. Fark eksideyse kırmızı, hedefe ulaştıysan yeşil yazılır." },
    { tab:"rapor", sec:":scope > .body:first-child > .flag.warn", bas:"İşaretlenmemiş ödevler", ne:"Hiç işaretlemediğin ödevlerin sayısını bildiren uyarı.", ise:"Eksik işaretli rapor gitmesin diye çıkar.", nasil:"Ödevlerim sekmesinde her ödeve bir durum seç, sonra raporu gönder. Yapamadığını yazmakta sorun yok; bütün ödevler işaretlenince uyarı kalkar." },
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
