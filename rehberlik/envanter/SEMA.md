# Envanter veri şeması

Beş envanterin tamamı `veri/` altında düz JavaScript dosyası olarak durur.
Her dosya `KOK.ENV_<AD> = {...}` biçiminde tek bir nesne yayımlar. Kısa anahtar
kullanılır, dosya küçük kalsın diye.

```js
var KOK = (typeof window !== 'undefined') ? window : global;
KOK.ENV_KISILIK = { ... };
```

## 1. Likert tipi envanterler (kişilik, ilgi, beceri)

```js
{
  kod: 'KISILIK',
  ad: 'Kişilik Envanteri',
  olcek: ['Hiç uymuyor','Az uyuyor','Kısmen uyuyor','Çoğunlukla uyuyor','Tamamen uyuyor'],
  boyutlar: [ { k:'D', ad:'Dışadönüklük', aciklama:'...' }, ... ],
  maddeler: [
    { n:1, m:'Kalabalık ortamda konuşmayı severim.', b:'D', t:false },
    ...
  ]
}
```

| Alan | Anlam |
|---|---|
| `n` | madde numarası, 1'den başlar, atlamasız |
| `m` | madde metni |
| `b` | boyut kodu, `boyutlar` içindeki bir `k` değeri |
| `t` | ters puanlanır mı (true/false) |

## 2. Sıralama envanteri (meslek değerleri)

```js
{
  kod: 'DEGER',
  ad: 'Meslek Değerler Sıralama Tekniği',
  boyutlar: [ { k:'BAS', ad:'Başarı ve yetkinlik', aciklama:'...' }, ... ],
  turlar: [
    { n:1, yonerge:'...', secenekler:[ { m:'...', b:'BAS' }, ... ] },
    ...
  ]
}
```

Her turda altı seçenek bulunur, her boyuttan tam bir tane. Öğrenci 1'den 6'ya
sıralar. Puan: 1. sıra 6 puan, 6. sıra 1 puan. Beş tur, boyut başına 5-30 aralığı.

## 3. Yetenek testi (doğru cevaplı)

```js
{
  kod: 'YETENEK',
  ad: 'Yetenek Testi',
  sure: 45,
  boyutlar: [ { k:'SOZ', ad:'Sözel akıl yürütme', aciklama:'...' }, ... ],
  maddeler: [
    { n:1, b:'SOZ', s:'Soru kökü', sec:['...','...','...','...','...'],
      d:2, z:3, ac:'Çözüm açıklaması.' }
  ]
}
```

| Alan | Anlam |
|---|---|
| `s` | soru metni |
| `sec` | beş seçenek, A'dan E'ye sırayla |
| `d` | doğru seçeneğin indeksi (0 = A) |
| `z` | zorluk, 10 üzerinden, **en fazla 5** |
| `ac` | çözüm açıklaması, öğrenciye gösterilir |
| `g` | görsel gerekiyorsa çizim tarifi (yalnız uzamsal maddelerde) |

## Ortak kurallar

- Öğrenci kitlesi: lise 9-12. sınıf, 14-18 yaş. Dil o yaşa uygun olacak.
- Madde metni tek cümle, en fazla 15 kelime. İkili madde yasak ("hem hızlı
  hem dikkatliyimdir" gibi iki şeyi birden soran cümle kurulmaz).
- Uzun tire yok. Emoji yok. Soru işaretiyle biten Likert maddesi yok.
- Cinsiyet, gelir, inanç, etnik köken imâ eden madde yok.
- Meslek adı geçen maddelerde YÖK'te karşılığı olan alan kullanılır.
- Her boyutun madde sayısı eşit olacak.
- Ters maddeler boyut içinde dengeli dağıtılacak, art arda gelmeyecek.
- Aynı boyutun maddeleri listede blok hâlinde durmayacak, karıştırılacak.
