var KOK = (typeof window !== 'undefined') ? window : global;

KOK.ENV_DEGER = {
  kod: 'DEGER',
  ad: 'Meslek Değerler Sıralama Tekniği',

  boyutlar: [
    {
      k: 'BAS',
      ad: 'Başarı ve yetkinlik',
      aciklama: 'Bu değeri üst sıraya koyan kişi, işini iyi yapmanın kendisinden aldığı doyumu önemser. Zorlanacağı, zamanla ustalaşacağı ve sonucunu görebileceği görevler onu ayakta tutar.',
      meslek_ipucu: 'Emeğin sonucunun açıkça görüldüğü ve ustalığın yıllar içinde arttığı işler ona uygun düşer.'
    },
    {
      k: 'BAG',
      ad: 'Bağımsızlık',
      aciklama: 'Bu değeri üst sıraya koyan kişi, kendi kararını kendi verebildiği bir çalışma düzeni arar. Sürekli denetlenmek yerine kendi yöntemini kurmak ona daha verimli gelir.',
      meslek_ipucu: 'Çalışma sırasını ve yöntemini kişinin kendi belirlediği, denetimin seyrek olduğu işler ona uygun düşer.'
    },
    {
      k: 'TAN',
      ad: 'Tanınma ve ilerleme',
      aciklama: 'Bu değeri üst sıraya koyan kişi, emeğinin görülmesini ve karşılığını almasını bekler. Yıllar içinde sorumluluğunun ve saygınlığının artacağı bir yol görmek ister.',
      meslek_ipucu: 'İlerleme basamakları belli olan, başarının görünür biçimde karşılık bulduğu kurumlar ona uygun düşer.'
    },
    {
      k: 'ILI',
      ad: 'İlişkiler',
      aciklama: 'Bu değeri üst sıraya koyan kişi, gün içinde kurduğu insan ilişkilerinden güç alır. İyi bir ekibin parçası olmak ve yaptığı işin başkalarına dokunması onun için belirleyicidir.',
      meslek_ipucu: 'Ekip hâlinde yürütülen, insanla doğrudan temasın gün boyu sürdüğü işler ona uygun düşer.'
    },
    {
      k: 'GUV',
      ad: 'Güvence ve destek',
      aciklama: 'Bu değeri üst sıraya koyan kişi, yarınını kestirebildiği bir düzende daha rahat çalışır. Adil bir yönetici ve düzenli bir gelir onun için işin temel taşıdır.',
      meslek_ipucu: 'İş tanımı ve geliri oturmuş, kurumsal yapısı belirgin ve yönetimi öngörülebilir yerler ona uygun düşer.'
    },
    {
      k: 'KOS',
      ad: 'Koşullar ve denge',
      aciklama: 'Bu değeri üst sıraya koyan kişi, işin hayatının geri kalanıyla nasıl bağdaştığına bakar. Çalışma saatleri, ortam ve kazanç onun için işin içeriği kadar önemlidir.',
      meslek_ipucu: 'Saatleri belirli olan, iş dışındaki zamana karışmayan ve emeğin karşılığını veren işler ona uygun düşer.'
    }
  ],

  turlar: [
    {
      n: 1,
      yonerge: "İşe yeni başladığın ilk yılda seni en çok ne mutlu ederdi? Altı seçeneği senin için en önemli olandan en az önemli olana doğru 1'den 6'ya sırala.",
      secenekler: [
        { m: 'İlk verilen zor görevi hatasız biçimde tamamlamak.', b: 'BAS' },
        { m: 'İşten çıktıktan sonra akşamın tamamını kendime ayırmak.', b: 'KOS' },
        { m: 'Öğle aralarını keyifle geçirdiğim bir ekibe katılmak.', b: 'ILI' },
        { m: 'Sözleşmemin uzun süreli olduğunu ilk günden bilmek.', b: 'GUV' },
        { m: 'Günlük iş sıramı kimseye sormadan kendim belirlemek.', b: 'BAG' },
        { m: 'Yaptığım işin toplantıda örnek gösterildiğini duymak.', b: 'TAN' }
      ]
    },
    {
      n: 2,
      yonerge: "İki iş teklifi arasında seçim yaparken hangisi daha ağır basardı? Altı seçeneği sendeki ağırlığına göre 1'den 6'ya sırala.",
      secenekler: [
        { m: 'Maaşın her ay aynı tarihte hesaba geçmesi.', b: 'GUV' },
        { m: 'Nasıl çalışacağıma çoğu zaman kendimin karar vermesi.', b: 'BAG' },
        { m: 'Birkaç yıl içinde ekip sorumlusu olma ihtimali.', b: 'TAN' },
        { m: 'Çalışma saatlerinin her hafta baştan belli olması.', b: 'KOS' },
        { m: 'İşin zamanla ustalaşabileceğim zor görevler içermesi.', b: 'BAS' },
        { m: 'Gün boyunca birlikte iş yaptığım insanların olması.', b: 'ILI' }
      ]
    },
    {
      n: 3,
      yonerge: "Bir işten ayrılmana en çok ne yol açardı? Bu turdaki cümleler, bir işte aradığın şeyin eksik kaldığı durumları anlatır. Seni en çok zorlayacak duruma 1, en az zorlayacak duruma 6 ver. Yani yine senin için en önemli olanı en başa koymuş olursun.",
      secenekler: [
        { m: 'Yaptığım işin kimsenin dikkatini çekmediğini görmek.', b: 'TAN' },
        { m: 'Her akşam geç saate kadar işte kalmak.', b: 'KOS' },
        { m: 'Yıllarca aynı işi yapıp yeni bir şey öğrenememek.', b: 'BAS' },
        { m: 'Gün boyu kimseyle iki laf edemeden çalışmak.', b: 'ILI' },
        { m: 'Yöneticinin adaletsiz davranışına her gün katlanmak.', b: 'GUV' },
        { m: 'En küçük kararı bile tek başıma verememek.', b: 'BAG' }
      ]
    },
    {
      n: 4,
      yonerge: "Otuz yaşındaki hâlini düşün. Hangisi senin için olmazsa olmaz? Altı seçeneği vazgeçilmezlik sırasına göre 1'den 6'ya sırala.",
      secenekler: [
        { m: 'Zor anımda arayabileceğim iş arkadaşlarına sahip olmak.', b: 'ILI' },
        { m: 'İşimin en zor kısmını rahatça yapabiliyor olmak.', b: 'BAS' },
        { m: 'Gelecek yılı düşünürken iş konusunda tedirgin olmamak.', b: 'GUV' },
        { m: 'Alanımda adı bilinen biri hâline gelmek.', b: 'TAN' },
        { m: 'Kazandığım parayla istediğim hayatı rahatça kurabilmek.', b: 'KOS' },
        { m: 'Günümü nasıl planlayacağıma kendim karar vermek.', b: 'BAG' }
      ]
    },
    {
      n: 5,
      yonerge: "Ailene işinden bahsederken en çok neyi anlatmak isterdin? Altı seçeneği anlatmak isteme sırasına göre 1'den 6'ya sırala.",
      secenekler: [
        { m: 'Sabahları isteyerek gittiğim bir ortamda çalıştığımı.', b: 'KOS' },
        { m: 'Ekipte sözüne en çok güvenilen kişi olduğumu.', b: 'TAN' },
        { m: 'İşimi tamamen kendi kurduğum düzenle yürüttüğümü.', b: 'BAG' },
        { m: 'Kimsenin çözemediği bir sorunu benim çözdüğümü.', b: 'BAS' },
        { m: 'Yaptığım işin başka insanların hayatını kolaylaştırdığını.', b: 'ILI' },
        { m: 'Bu işin yıllar sonra da ayakta olacağını.', b: 'GUV' }
      ]
    }
  ]
};
