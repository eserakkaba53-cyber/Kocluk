/* ═══════════════════════════════════════════════════════════════════
   BİYOSER — HAFTALIK ÇALIŞMA PROGRAMI MOTORU
   ───────────────────────────────────────────────────────────────────
   Tek dosya, bağımlılık yok. Hem koç hem öğrenci paneli bunu yükler.

   KULLANIM
     1) <script src="program.js"></script>
     2) Sekme çizilirken:   ... + PROG.iskelet() + ...
     3) innerHTML yazıldıktan HEMEN SONRA:  PROG.mont({...})

   SAHİPLİK (senkronun temeli)
     kapali  → ÖĞRENCİNİN. Müsait olmadığı saatler. Koç görür, değiştirmez.
     bloklar → KOÇUN. Yerleştirilmiş ödevler. Öğrenci görür, taşımaz.
   İki taraf jsonb'nin farklı dalını yazdığı için birbirini ezmez.
   ═══════════════════════════════════════════════════════════════════ */
window.PROG = (function(){
'use strict';

/* ═══ SABİTLER ═══ */
var GUN=7, DILIM=48, DILIM_DK=30, MAX_BLOK_DK=90;
var GUNLER=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
var GUN_KISA=['PZT','SAL','ÇAR','PER','CUM','CMT','PAZ'];
var SATIR_PX=26;   /* bir yarım saatlik satırın yüksekliği */

/* Ders renkleri — panelin ders kodlarıyla birebir. */
var RENK={
  tyt_tur:'#0891B2', tyt_mat:'#2563EB', tyt_geo:'#7C3AED', tyt_fiz:'#DC2626',
  tyt_kim:'#EA580C', tyt_biy:'#16A34A', tyt_tar:'#A16207', tyt_cog:'#0D9488',
  tyt_fel:'#6D28D9', tyt_din:'#7E22CE',
  ayt_mat:'#1D4ED8', ayt_geo:'#6D28D9', ayt_fiz:'#B91C1C', ayt_kim:'#C2410C',
  ayt_biy:'#15803D', ayt_edb:'#0E7490', ayt_tar1:'#92400E', ayt_tar2:'#A16207',
  ayt_cog1:'#0F766E', ayt_cog2:'#14837B', ayt_fel:'#5B21B6', ayt_din:'#6B21A8',
  ydt:'#BE185D'
};
/* Soru başına dakika — sayısal derste bir soru daha uzun sürer. */
var KAT={
  tyt_mat:2, tyt_geo:2, ayt_mat:2, ayt_geo:2,
  tyt_fiz:1.5, tyt_kim:1.5, tyt_biy:1.5,
  ayt_fiz:1.5, ayt_kim:1.5, ayt_biy:1.5, ydt:1.2
};
var SEBEPLER=[['OKUL','Okul'],['UYKU','Uyku'],['YEMEK','Yemek'],
              ['KURS','Kurs'],['IZIN','İzin günü'],['OZEL','Meşgul']];

/* ═══ DURUM ═══ */
var C={};
var kapali=new Set(), sebep={}, bloklar=[], bekleyenler=[];
var katlaAcik=true, acikKatlar=new Set(), boyaAcik=false, boyaSebep='OZEL';
var suAnahtar=null;
var kayitSaat=null, kayitKuyruk={};
/* Program, ödev listesinin GERİSİNDE mi kaldı? Koç Ödevler sekmesinde yeni
   ödev verip Haftalık'a döndüğünde blok listesi eski kalıyordu ve panel
   "bütün ödevler haftaya sığdı" diyordu — bu doğru değildi. Artık ölçülüyor. */
var tazelik={yeni:0, giden:0};
/* Günlük çalışma tavanı — koçun tercihi, öğrencinin verisi değil.
   Bu yüzden sunucudaki program jsonb'sine değil, koçun kendi tarayıcısına
   yazılır; senkron sözleşmesini (kapali=öğrenci, bloklar=koç) kirletmez. */
var TAVAN_ANAHTAR='biyoser_prog_tavan';
function tavan(){
  if(C.gunEnFazla) return C.gunEnFazla;
  try{ var v=+localStorage.getItem(TAVAN_ANAHTAR); if(v>=180&&v<=900) return v; }catch(e){}
  return 480;   /* 8 saat */
}
function tavanYaz(dk){
  try{ localStorage.setItem(TAVAN_ANAHTAR,String(dk)); }catch(e){}
}

/* ═══ YARDIMCI ═══ */
function ah(g,d){ return g+'-'+d; }
function saatYaz(d){
  var h=Math.floor(d/2);
  return (h<10?'0':'')+h+':'+(d%2?'30':'00');
}
function sa(dk){
  var h=Math.floor(dk/60), m=Math.round(dk%60);
  return h?(h+' sa'+(m?' '+m+' dk':'')):(m+' dk');
}
function esc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function renkOf(sub){ return RENK[sub] || '#5B6B78'; }
function adOf(sub){
  if(typeof C.dersAdi==='function'){ try{ return C.dersAdi(sub)||sub; }catch(e){} }
  return sub;
}
function kisaAd(sub){ return adOf(sub).replace(/^TYT\s+/,'').replace(/^AYT\s+/,''); }
function katOf(sub){ return KAT[sub]!==undefined?KAT[sub]:1; }
/* Soru çözümü kaç dakika?
   Panel bir ödevin süresini TEK sayı olarak tutuyor (sureOf) ve "haftalık
   hedef süre" istatistiği onu topluyor. Kullanıcı konu çalışması ile soru
   çözümünün ayrılabilmesini istedi; bu yüzden panel bize hazır bölünmüş
   değer (soruDk) gönderir. Böylece programın toplamı panelin gösterdiği
   süreyle BİREBİR aynı kalır — iki ekran birbirini yalanlamaz.
   soruDk gelmezse soru sayısı × ders katsayısı ile tahmin edilir. */
function soruDk(o){
  if(o.soruDk!==undefined && o.soruDk!==null) return Math.round(o.soruDk);
  return Math.round((o.soru||0)*(o.kat!==undefined?o.kat:katOf(o.sub)));
}
function toplamDk(o){ return (o.calisma||0)+soruDk(o); }
function odevler(){ return C.odevler||[]; }
function kocMu(){ return C.rol==='koc'; }

/* ═══ VARSAYILAN KAPALI SAATLER ═══
   Öğrenci hiç dokunmamışsa makul bir başlangıç. Öneridir; öğrenci
   hepsini açıp kendi hayatına göre kurabilir. */
function kapat(g,d,neden){ kapali.add(ah(g,d)); if(neden) sebep[ah(g,d)]=neden; }
function varsayilan(){
  kapali=new Set(); sebep={};
  for(var g=0;g<GUN;g++){
    /* PAZAR — varsayılan olarak tamamen kapalı (dinlenme günü).
       Tabloda görünür ama iş yerleştirilmez; öğrenci isterse açar.
       Haftada bir tam gün boş bırakmak plan değil, sürdürülebilirlik
       meselesi: yedi gün program verilen öğrenci üçüncü haftada bırakır. */
    if(g===6){ for(var dp=0;dp<DILIM;dp++) kapat(g,dp,'IZIN'); continue; }
    for(var d=0;d<14;d++) kapat(g,d,'UYKU');               /* 00:00–07:00 */
    if(g<5) for(var d2=16;d2<32;d2++) kapat(g,d2,'OKUL');  /* 08:00–16:00 */
    kapat(g,38,'YEMEK'); kapat(g,39,'YEMEK');              /* 19:00–20:00 */
    kapat(g,47,'UYKU');
  }
}

/* ═══════════════════════════════════════════════════════════
   BLOK ÜRETİMİ
   ═══════════════════════════════════════════════════════════ */
function blokListesi(){
  var ayir = C.ayir!==false;
  var ONC={onkosul:0,cekirdek:1,rutin:2,guvenlik:3};
  var sirali=odevler().slice().sort(function(a,b){
    return ((ONC[a.oncelik]||1)-(ONC[b.oncelik]||1))||(toplamDk(b)-toplamDk(a));
  });
  var cikti=[], n=0;
  sirali.forEach(function(o){
    var parcalar=[];
    /* KONU ve SORU HER ZAMAN AYRI. Eskiden toplamı 120 dk'yı aşmayan ödev
       tek "karma" blok kalıyordu; o blokta ne KONU ne SORU etiketi vardı ve
       öğrenci o saatte ne yapacağını bilmiyordu. Blok sayısı artıyor ama
       ızgaranın işi tam da bunu söylemek. */
    if(ayir && o.calisma>0 && soruDk(o)>0){
      parcalar.push({tur:'konu',dk:o.calisma});
      parcalar.push({tur:'soru',dk:soruDk(o)});
    }else if(o.calisma>0 && soruDk(o)>0){
      parcalar.push({tur:'karma',dk:toplamDk(o)});
    }else{
      /* yalnız biri varsa (rutinlerde konu süresi yoktur) türü doğru yaz */
      parcalar.push({tur:o.calisma>0?'konu':'soru', dk:toplamDk(o)});
    }
    parcalar.forEach(function(p){
      /* PARÇALAMA — dilim ızgarasına oturur.
         Eşit dakikaya bölmek 200 dk'yı 90/90/20 yapıyordu; son parça 20 dk
         ama tabloda 30 dk'lık dilim kaplıyordu. Her parçadaki bu kayıp
         haftada saatlerce ölü zamana dönüşür. Artık önce gereken DİLİM
         sayısı bulunur (ceil(200/30)=7), dilim olarak bölünür (3+2+2),
         dakika bu dilimlere yayılır: 90/60/50. */
      var MAXSLOT=Math.floor(MAX_BLOK_DK/DILIM_DK);
      var toplamSlot=Math.ceil(p.dk/DILIM_DK);
      var adet=Math.max(1,Math.ceil(toplamSlot/MAXSLOT));
      var taban=Math.floor(toplamSlot/adet), fazla=toplamSlot%adet;
      var kalan=p.dk, sira=0;
      for(var i=0;i<adet && kalan>0;i++){
        var slot=taban+(i<fazla?1:0);
        var dk=(i===adet-1)?kalan:Math.min(slot*DILIM_DK,kalan);
        cikti.push({
          id:o.id+'|'+p.tur+'|'+i, odevId:o.id, sub:o.sub, konu:o.konu, tur:p.tur,
          dk:dk, uzunluk:Math.max(1,Math.ceil(dk/DILIM_DK)),
          oncelik:o.oncelik||'cekirdek', rutin:!!o.rutin, dev:o.dev||0,
          pi:i,                                  /* parça sırası — 0 tabanlı */
          parca:adet>1?((++sira)+'/'+adet):'', sirano:cikti.length
        });
        kalan-=dk;
      }
    });
  });
  /* SIRALAMA — üç katman
     1) ÖNCE TÜM KONU, SONRA TÜM SORU. Kritik: soru bloğu neredeyse her
        zaman konu bloğundan uzundur (105 dk konu vs 200 dk soru). Yalnız
        boyuta göre sıralarsak soru önce yerleşir ve "konu çalışması soru
        çözümünden önce gelir" kuralı çöker.
     2) Katman içinde öncelik   3) Onun içinde büyük blok önce (FFD) */
  var KATM={onkosul:0,cekirdek:1,rutin:2,guvenlik:3};
  var TUR={konu:0,karma:0,soru:1};
  cikti.sort(function(a,b){
    return (TUR[a.tur]-TUR[b.tur]) || (KATM[a.oncelik]-KATM[b.oncelik]) ||
           (b.dk-a.dk) || (a.sirano-b.sirano);
  });
  return cikti;
}

/* ═══════════════════════════════════════════════════════════
   YERLEŞTİRME
   ═══════════════════════════════════════════════════════════ */
/* Bir günde verilen uzunluğa sığan başlangıçlar + içinde bulundukları
   boşluğun genişliği. Genişlik "best-fit" için gerekli: 150 dk'lık bloğu
   5 saatlik pencerenin başına koymak onu ikiye böler; dar bir deliğe otursa
   boşluk parçalanmaz ve dengeleme turunda taşınacak yer kalır. */
function bosDetay(gun,uzunluk,dolu){
  var sonuc=[], bas=-1, s;
  for(var d=0;d<=DILIM;d++){
    var musait = d<DILIM && !kapali.has(ah(gun,d)) && !dolu.has(ah(gun,d));
    if(musait){ if(bas<0) bas=d; }
    else{
      if(bas>=0 && d-bas>=uzunluk)
        for(s=bas;s<=d-uzunluk;s++) sonuc.push({s:s,bosluk:d-bas});
      bas=-1;
    }
  }
  return sonuc;
}
function enIyiYer(gun,uzunluk,dolu){
  /* best-fit: önce en dar sığan boşluk, eşitlikte en erken saat */
  return bosDetay(gun,uzunluk,dolu)
    .sort(function(p,r){ return (p.bosluk-r.bosluk)||(p.s-r.s); })
    .map(function(a){ return a.s; });
}

/* Gün başına HEDEF yük — "su doldurma": eşit paylaştır, ama bir günün açık
   zamanı payından azsa o gün kapasitesi kadar alır, artan diğerlerine
   yeniden bölüşülür. Okul günü boğulmaz, hafta sonu gereksiz şişmez. */
function gunHedefleri(toplamYuk){
  var acik=[], g, d, n;
  for(g=0;g<GUN;g++){
    n=0; for(d=0;d<DILIM;d++) if(!kapali.has(ah(g,d))) n++;
    acik.push(n*DILIM_DK);
  }
  var hedef=[], kalanGun=[];
  for(g=0;g<GUN;g++){ hedef.push(0); kalanGun.push(g); }
  var kalanYuk=toplamYuk;
  for(var tur=0;tur<GUN && kalanGun.length;tur++){
    var pay=kalanYuk/kalanGun.length;
    var tasan=kalanGun.filter(function(x){ return acik[x]<pay; });
    if(!tasan.length){ kalanGun.forEach(function(x){ hedef[x]=pay; }); break; }
    tasan.forEach(function(x){ hedef[x]=acik[x]; kalanYuk-=acik[x]; });
    kalanGun=kalanGun.filter(function(x){ return tasan.indexOf(x)<0; });
  }
  return {hedef:hedef,acik:acik};
}

/* Bu konum konu→soru sırasını bozuyor mu?
   soru bloğu: aynı ödevin konu bloğu BİTTİKTEN sonra başlamalı
   konu bloğu: aynı ödevin soru bloğu BAŞLAMADAN önce bitmeli */
function siraUygun(b,gun,dilim){
  function mut(g,d){ return g*DILIM+d; }
  var i, l;
  if(b.tur==='soru'){
    l=bloklar.filter(function(x){ return x.odevId===b.odevId && x.tur==='konu'; });
    for(i=0;i<l.length;i++)
      if(mut(gun,dilim) < mut(l[i].gun,l[i].dilim+l[i].uzunluk)) return false;
  }
  if(b.tur==='konu'){
    l=bloklar.filter(function(x){
      return x.odevId===b.odevId && x.tur==='soru' && x.id!==b.id; });
    for(i=0;i<l.length;i++)
      if(mut(gun,dilim+b.uzunluk) > mut(l[i].gun,l[i].dilim)) return false;
  }
  /* PARÇA SIRASI — "1/3" bitmeden "2/3" başlamaz.
     Uzun bir işi üçe böldüğümüzde parçalar takvimde karışık sırayla
     görünebiliyordu (2/3 Salı, 1/3 Perşembe). Numarası olan bir şeyin
     sırasız durması "sistem şaşırmış" hissi veriyor; üstelik konu
     çalışmasında ikinci parça birincinin üstüne kurulur. */
  if(b.pi!==undefined){
    l=bloklar.filter(function(x){
      return x.odevId===b.odevId && x.tur===b.tur && x.id!==b.id && x.pi!==undefined; });
    for(i=0;i<l.length;i++){
      if(l[i].pi < b.pi && mut(gun,dilim) < mut(l[i].gun,l[i].dilim+l[i].uzunluk)) return false;
      if(l[i].pi > b.pi && mut(gun,dilim+b.uzunluk) > mut(l[i].gun,l[i].dilim)) return false;
    }
  }
  return true;
}

function dagitCekirdek(){
  var liste=blokListesi();
  var dolu=new Set(), gunYuku=[], gunSonDers=[], gunSonYer=[], i;
  for(i=0;i<GUN;i++){ gunYuku.push(0); gunSonDers.push(null); gunSonYer.push(0); }

  /* KİLİTLİLER KORUNUR — koç elle taşıdıysa blok kilitlenir ve yeniden
     dağıtımda yerinde kalır. Aksi hâlde koç her "dağıt"ta kendi
     düzenlemesini kaybeder ve butona bir daha basmaz. */
  var kilitli=bloklar.filter(function(b){ return b.kilit; });
  var kilitliId={};
  kilitli.forEach(function(b){
    kilitliId[b.id]=true;
    for(var j=0;j<b.uzunluk;j++) dolu.add(ah(b.gun,b.dilim+j));
    gunYuku[b.gun]+=b.dk;
  });
  bloklar=kilitli.slice(); bekleyenler=[];

  var toplamYuk=liste.reduce(function(a,b){ return a+b.dk; },0);
  var hedef=gunHedefleri(toplamYuk).hedef;
  /* GÜNLÜK TAVAN — matematiğin izin verdiği her şey iyi plan değildir.
     Öğrencinin Cumartesi'si tamamen boşsa "su doldurma" oraya 11 saat
     yığabiliyor: tabloda kusursuz, hayatta imkânsız. Hiçbir gün bu tavanı
     aşamaz; aşan iş BEKLEYENLER'e düşer ve koça "bu hafta fazla ödev var,
     ya saat açılmalı ya ödev azalmalı ya da tavan yükseltilmeli" der.
     Sessizce sıkıştırmaktan iyidir — koç kararı görerek verir. */
  var enFazla = tavan();

  liste.forEach(function(b){
    if(kilitliId[b.id]) return;

    /* KONU bloğu erken güne, SORU bloğu en boş güne.
       Soru bloğu kendi konusundan sonra gelmek ZORUNDA. Konuyu yalnız
       "en boş gün"e koyarsak Perşembe/Cuma'ya düşüyor, o ödevin sorusuna
       da tek Cumartesi kalıyor ve hafta sonu şişiyor. Küçük bir erken-gün
       eğilimi soru bloklarına manevra alanı açar. */
    var erken = (b.tur==='soru') ? 0 : 0.16;
    var gunSira=[]; for(var q=0;q<GUN;q++) gunSira.push(q);
    gunSira.sort(function(x,y){
      return (gunYuku[x]/Math.max(1,hedef[x]) + erken*x) -
             (gunYuku[y]/Math.max(1,hedef[y]) + erken*y);
    });

    var yerlesti=false;
    for(var gecis=0;gecis<3 && !yerlesti;gecis++){
      for(var gi=0;gi<gunSira.length;gi++){
        var g=gunSira[gi];
        var pay = gecis===0?1.10 : gecis===1?1.40 : 99;
        /* Son turda hedef serbest bırakılır ama günlük tavan ASLA. */
        if(gunYuku[g]+b.dk > Math.min(hedef[g]*pay, enFazla)) continue;

        var adaylar=enIyiYer(g,b.uzunluk,dolu)
          .filter(function(s){ return siraUygun(b,g,s); });
        if(!adaylar.length) continue;

        /* aynı dersi arka arkaya koyma (yalnız ilk turda) */
        if(gecis===0 && gunSonDers[g]===b.sub && adaylar.length>1){
          var uzak=adaylar.filter(function(s){ return s>=gunSonYer[g]+b.uzunluk+2; });
          if(uzak.length) adaylar=uzak;
        }

        var sec=adaylar[0];
        for(var k=0;k<b.uzunluk;k++) dolu.add(ah(g,sec+k));
        var yeni={}; for(var p in b) yeni[p]=b[p];
        yeni.gun=g; yeni.dilim=sec;
        bloklar.push(yeni);
        gunYuku[g]+=b.dk; gunSonDers[g]=b.sub; gunSonYer[g]=sec;
        yerlesti=true; break;
      }
    }
    if(!yerlesti) bekleyenler.push(b);
  });

  dengele(hedef,dolu);
}

/* SIKIŞTIRMA — gün içindeki blokları güne doğru öne çeker.
   Neden gerekli: gün "zaman" olarak değil "delik" olarak doluyor. 7,5 saati
   açık bir Salı'da 5,8 saat iş varken kalan 1,7 saat üç ayrı 30 dakikalık
   parçaya dağılmışsa 60 dakikalık hiçbir blok oraya giremez ve iş, günü boş
   olmasına rağmen BEKLEYENLER'e düşer. Blokları öne çekmek delikleri günün
   sonunda tek parçada toplar. Kilitli bloklar (koçun elle koyduğu) sabit
   kalır — sıkıştırma koçun kararını bozmaz. */
function sikistir(dolu){
  for(var g=0;g<GUN;g++){
    var gunun=bloklar.filter(function(b){ return b.gun===g; })
                     .sort(function(a,b){ return a.dilim-b.dilim; });
    gunun.forEach(function(b){
      if(b.kilit) return;
      var i;
      for(i=0;i<b.uzunluk;i++) dolu.delete(ah(g,b.dilim+i));
      var yer=bosDetay(g,b.uzunluk,dolu)
        .map(function(a){ return a.s; })
        .filter(function(s){ return s<=b.dilim && siraUygun(b,g,s); })
        .sort(function(x,y){ return x-y; });
      if(yer.length) b.dilim=yer[0];
      for(i=0;i<b.uzunluk;i++) dolu.add(ah(g,b.dilim+i));
    });
  }
}

/* DENGELEME — en yüklü günden en az yüklü güne blok taşımayı dener.
   Parçalı hafta içi pencereler yüzünden büyük blokların hafta sonuna
   yığılması bu turda kısmen geri alınır. */
function dengele(hedef,dolu){
  var i, j, k;
  for(var tur=0;tur<120;tur++){
    var y=gunYukleri(), agir=0, hafif=0;
    for(var g=1;g<GUN;g++){
      if(y[g]-hedef[g] > y[agir]-hedef[agir]) agir=g;
      if(y[g]-hedef[g] < y[hafif]-hedef[hafif]) hafif=g;
    }
    var kazanc=(y[agir]-hedef[agir])-(y[hafif]-hedef[hafif]);
    if(kazanc<=30) break;   /* yarım saatten az kazanç: dur */

    var adaylar=bloklar.filter(function(b){
      return b.gun===agir && b.dk<=kazanc && !b.kilit;
    }).sort(function(a,b){ return b.dk-a.dk; });

    var tasindi=false;
    for(var ai=0;ai<adaylar.length;ai++){
      var b=adaylar[ai];
      var gecici=new Set(dolu);
      for(i=0;i<b.uzunluk;i++) gecici.delete(ah(b.gun,b.dilim+i));
      /* Dengeleme uğruna pedagojik kural feda edilmez. */
      var yerler=enIyiYer(hafif,b.uzunluk,gecici)
        .filter(function(s){ return siraUygun(b,hafif,s); });
      if(!yerler.length) continue;
      if(y[hafif]+b.dk > tavan()) continue;   /* tavana taşıma yok */
      for(j=0;j<b.uzunluk;j++) dolu.delete(ah(b.gun,b.dilim+j));
      b.gun=hafif; b.dilim=yerler[0];
      for(k=0;k<b.uzunluk;k++) dolu.add(ah(b.gun,b.dilim+k));
      tasindi=true; break;
    }
    if(!tasindi) break;
  }

  /* Delikleri birleştir, sonra bekleyenleri yeniden dene. Sıra önemli:
     sıkıştırmadan önce denemek boşuna, çünkü delikler hâlâ dağınık. */
  if(bekleyenler.length) sikistir(dolu);

  /* bekleyenleri son bir kez dene — sıkıştırma yer açmış olabilir */
  if(bekleyenler.length){
    var kalan=[], y2=gunYukleri();
    bekleyenler.forEach(function(b){
      var sira=[]; for(var q=0;q<GUN;q++) sira.push(q);
      sira.sort(function(x,z){ return (y2[x]-hedef[x])-(y2[z]-hedef[z]); });
      var kondu=false;
      for(var gi=0;gi<sira.length && !kondu;gi++){
        var g=sira[gi];
        if(y2[g]+b.dk > tavan()) continue;   /* tavana taşıma yok */
        var yerler=enIyiYer(g,b.uzunluk,dolu)
          .filter(function(s){ return siraUygun(b,g,s); });
        if(!yerler.length) continue;
        for(var i2=0;i2<b.uzunluk;i2++) dolu.add(ah(g,yerler[0]+i2));
        var yeni={}; for(var p in b) yeni[p]=b[p];
        yeni.gun=g; yeni.dilim=yerler[0];
        bloklar.push(yeni); y2[g]+=b.dk; kondu=true;
      }
      if(!kondu) kalan.push(b);
    });
    bekleyenler=kalan;
  }
}

/* ═══ ÖLÇÜMLER ═══ */
function gunYukleri(){
  var y=[]; for(var i=0;i<GUN;i++) y.push(0);
  bloklar.forEach(function(b){ y[b.gun]+=b.dk; });
  return y;
}
function gunAcik(g){
  var n=0; for(var d=0;d<DILIM;d++) if(!kapali.has(ah(g,d))) n++;
  return n*DILIM_DK;
}
function acikDakika(){
  var t=0; for(var g=0;g<GUN;g++) t+=gunAcik(g);
  return t;
}
/* Programdaki işler ile ödev listesi örtüşüyor mu?
   Dönen: {yeni: programda olmayan ödev sayısı, giden: ödevi silinmiş blok sayısı} */
function tazelikOlc(){
  var odevId={}, blokId={};
  odevler().forEach(function(o){ odevId[o.id]=1; });
  bloklar.concat(bekleyenler).forEach(function(b){ blokId[b.odevId]=1; });
  var yeni=0, giden=0, k;
  for(k in odevId) if(!blokId[k]) yeni++;
  for(k in blokId) if(!odevId[k]) giden++;
  return {yeni:yeni, giden:giden};
}

/* Blok kapalı saate mi düştü? Öğrenci saat kapatınca koçun bloğu orada
   kalabilir. Bloğu sessizce taşımak sahipliği bozar — kırmızı işaretlenir,
   koç görüp yeniden dağıtır. */
function cakisanlar(){
  return bloklar.filter(function(b){
    for(var i=0;i<b.uzunluk;i++) if(kapali.has(ah(b.gun,b.dilim+i))) return true;
    return false;
  });
}
function blokCakisiyor(b,g,d,haric){
  if(d<0 || d+b.uzunluk>DILIM) return true;
  /* Elle sürüklemede de sıra korunur: koç 2/3'ü 1/3'ün önüne, ya da soru
     bloğunu konusundan öne bırakamaz. Hedef hücre kırmızı yanar. */
  if(!siraUygun(b,g,d)) return true;
  for(var i=0;i<b.uzunluk;i++){
    if(kapali.has(ah(g,d+i))) return true;
    for(var j=0;j<bloklar.length;j++){
      var o=bloklar[j];
      if(o.id===(haric||b.id)) continue;
      if(o.gun!==g) continue;
      if(d+i>=o.dilim && d+i<o.dilim+o.uzunluk) return true;
    }
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════
   KAYIT — sahibi olduğun dalı, gecikmeli olarak yaz
   ═══════════════════════════════════════════════════════════ */
/* Kaydedilemeyen bir değişiklik SESSİZ KALMAMALI: koç blokları düzenler,
   lisansı bitmiştir, hiçbir şey kaydolmaz ve panel bunu hiç söylemez —
   koç ertesi gün emeğinin yok olduğunu görür. Hata artık ekranda. */
var kayitHatasi=null;
function isaretle(dal){
  kayitKuyruk[dal]=true;
  if(kayitSaat) clearTimeout(kayitSaat);
  /* Hangi kaydın hangi öğrenciye ait olduğu 900 ms sonra değişmiş olabilir
     (koç bu arada öğrenci değiştirir). Kaydı ŞU ANKİ hedefe kilitle,
     yoksa yazı yanlış öğrencinin kaydına gider. */
  var hedefKaydet=C.kaydet, hedefAnahtar=suAnahtar;
  kayitSaat=setTimeout(function(){
    kayitSaat=null;
    var k=kayitKuyruk; kayitKuyruk={};
    if(!hedefKaydet) return;
    var isler=[];
    try{
      if(k.kapali && hedefKaydet.kapali) isler.push(hedefKaydet.kapali(disaKapali()));
      if(k.bloklar && hedefKaydet.bloklar) isler.push(hedefKaydet.bloklar(disaBloklar()));
    }catch(e){ isler.push(Promise.reject(e)); }
    Promise.all(isler.map(function(x){ return Promise.resolve(x); }))
      .then(function(){
        if(kayitHatasi){ kayitHatasi=null; if(suAnahtar===hedefAnahtar) ciz(); }
      })
      .catch(function(e){
        kayitHatasi = (e && e.message) ? String(e.message) : 'Sunucuya yazılamadı.';
        if(window.console) console.warn('program kaydı:',e);
        if(suAnahtar===hedefAnahtar) ciz();
      });
  }, 900);
}
/* Sayfa kapanırken bekleyen kayıt varsa hemen gönder — 900 ms'lik pencere
   içinde sekme kapatılırsa değişiklik kayboluyordu. */
function bekleyeniHemenYaz(){
  if(!kayitSaat) return;
  clearTimeout(kayitSaat); kayitSaat=null;
  var k=kayitKuyruk; kayitKuyruk={};
  if(!C.kaydet) return;
  try{
    if(k.kapali && C.kaydet.kapali) C.kaydet.kapali(disaKapali());
    if(k.bloklar && C.kaydet.bloklar) C.kaydet.bloklar(disaBloklar());
  }catch(e){}
}
/* "3-20" ya da sebepliyse "3-20|OKUL" */
function disaKapali(){
  var l=[];
  kapali.forEach(function(a){ l.push(sebep[a] ? a+'|'+sebep[a] : a); });
  return l.sort();
}
/* Yerleşmiş bloklar VE yerleşemeyenler birlikte kaydedilir.
   Neden: bekleyenler kaydedilmezse sayfa yenilendiğinde "bu iş sığmadı"
   bilgisi tamamen kayboluyordu — panel de bunu göremeyip yeşil "Bütün
   ödevler haftaya sığdı" yazıyordu. Ağır bir haftada 50+ saatlik iş
   sessizce yok olup koça "her şey yolunda" deniyordu. Yerleşemeyen blok
   gun:null ile işaretlenir; okurken bekleyenler dizisine geri ayrılır. */
function blokDisa(b, yerlesmis){
  return {id:b.id, odevId:b.odevId, sub:b.sub, konu:b.konu, tur:b.tur,
          dk:b.dk, gun:yerlesmis?b.gun:null, dilim:yerlesmis?b.dilim:null,
          uzunluk:b.uzunluk, parca:b.parca||'', pi:b.pi, rutin:!!b.rutin, dev:b.dev||0,
          kilit:yerlesmis?!!b.kilit:false};
}
function disaBloklar(){
  return bloklar.map(function(b){ return blokDisa(b,true); })
    .concat(bekleyenler.map(function(b){ return blokDisa(b,false); }));
}
function iceriAl(p){
  p=p||{};
  kapali=new Set(); sebep={};
  /* DİKKAT: boş dizi ile "hiç kayıt yok" AYNI ŞEY DEĞİL.
     Öğrenci "Hepsini aç" derse kapalı saat listesi boş dizi olur; bunu
     "veri yok" sayıp varsayılan uyku/okul saatlerini geri koymak
     öğrencinin kararını sessizce iptal ediyordu. Ayrım: alan HİÇ yoksa
     (undefined/null) varsayılan uygulanır, boş DİZİ ise aynen korunur. */
  if(Array.isArray(p.kapali)){
    p.kapali.forEach(function(x){
      var s=String(x), i=s.indexOf('|');
      var a = i<0 ? s : s.slice(0,i);
      kapali.add(a);
      if(i>=0) sebep[a]=s.slice(i+1);
    });
  }else{
    varsayilan();
  }
  /* Sunucudan gelen veriye güvenme: eksik/bozuk tek bir alan (ör. dk yok)
     gün yükünü NaN yapar ve bütün hafta tek güne yığılır. Süz. */
  var gelen = Array.isArray(p.bloklar) ? p.bloklar : [];
  /* sayiMi: isFinite(null) JavaScript-te TRUE doner (Number(null)===0).
     Bu yuzden "gun:null" ile kaydedilmis BEKLEYEN blok, sadece isFinite ile
     bakildiginda "0. gune yerlesmis" sayiliyordu ve yerlesemeyen isler
     yeniden yuklemede sessizce yerlesmis gorunup panel yine "hepsi sigdi"
     diyordu. typeof denetimi sart. */
  function sayiMi(x){ return typeof x==='number' && isFinite(x); }
  var saglam = gelen.filter(function(b){
    return b && typeof b==='object' &&
           sayiMi(b.dk) && b.dk>0 &&
           sayiMi(b.uzunluk) && b.uzunluk>0 && b.uzunluk<=DILIM;
  });
  bloklar=[]; bekleyenler=[];
  saglam.forEach(function(b){
    var yerlesik = sayiMi(b.gun) && b.gun>=0 && b.gun<GUN &&
                   sayiMi(b.dilim) && b.dilim>=0 && b.dilim+b.uzunluk<=DILIM;
    if(yerlesik) bloklar.push(b); else bekleyenler.push(b);
  });
}

/* ═══════════════════════════════════════════════════════════
   ÇİZİM
   ═══════════════════════════════════════════════════════════ */
function kokEl(){ return document.getElementById('pg-kok'); }

function iskelet(){
  return '<div class="pg" id="pg-kok">' +
    '<div class="pg-ozet" id="pg-ozet"></div>' +
    '<div class="pg-arac" id="pg-arac"></div>' +
    '<div class="pg-izsar"><table class="pg-iz" id="pg-tablo"></table></div>' +
    '<div class="pg-yuk" id="pg-yuk"></div>' +
    '<div class="pg-alt" id="pg-alt"></div>' +
  '</div>';
}

function ciz(){
  var t=document.getElementById('pg-tablo');
  if(!t) return;
  var h='<thead><tr><th class="sa">SAAT</th>';
  for(var gi=0;gi<GUN;gi++)
    h+='<th>'+GUN_KISA[gi]+'<i>'+GUNLER[gi]+'</i></th>';
  h+='</tr></thead><tbody>';

  var blokAt={}, kapli={};
  bloklar.forEach(function(b){
    blokAt[ah(b.gun,b.dilim)]=b;
    for(var i=1;i<b.uzunluk;i++) kapli[ah(b.gun,b.dilim+i)]=1;
  });
  var cak={}; cakisanlar().forEach(function(b){ cak[b.id]=1; });

  /* tamamen kapalı ve blok içermeyen ardışık satırları katla */
  var katlanabilir=[];
  for(var d0=0;d0<DILIM;d0++){
    var hepsi=true;
    for(var g0=0;g0<GUN;g0++){
      var a0=ah(g0,d0);
      if(!kapali.has(a0) || blokAt[a0] || kapli[a0]){ hepsi=false; break; }
    }
    katlanabilir.push(hepsi);
  }

  var d=0;
  while(d<DILIM){
    if(katlaAcik && katlanabilir[d] && !acikKatlar.has(d)){
      var son=d;
      while(son+1<DILIM && katlanabilir[son+1] && !acikKatlar.has(son+1)) son++;
      if(son-d+1>=4){
        h+='<tr class="pg-katli"><td colspan="'+(GUN+1)+'" data-kat="'+d+'-'+son+'">▾ '+
           saatYaz(d)+' – '+saatYaz(son+1)+' · tüm günlerde kapalı ('+
           ((son-d+1)/2)+' saat) — açmak için tıkla</td></tr>';
        d=son+1; continue;
      }
    }
    var tam=(d%2===0);
    h+='<tr><td class="sa'+(tam?' tam':'')+'">'+(tam?saatYaz(d):'')+'</td>';
    for(var g=0;g<GUN;g++){
      var a=ah(g,d);
      if(kapli[a]){ h+='<td class="pg-h'+(tam?' tamsaat':'')+'" data-g="'+g+'" data-d="'+d+'"></td>'; continue; }
      var b=blokAt[a];
      var kap=kapali.has(a)?' kapali':'';
      /* sebep etiketi yalnız bloğun İLK satırında yazılır, tekrar etmesin */
      var sb=(kapali.has(a) && sebep[a] && !kapali.has(ah(g,d-1))) ? sebep[a] : '';
      h+='<td class="pg-h'+kap+(tam?' tamsaat':'')+'" data-g="'+g+'" data-d="'+d+
         '" data-sebep="'+esc(sb)+'">';
      if(b){
        var renk=renkOf(b.sub), yuk=b.uzunluk*SATIR_PX-3, kisa=b.uzunluk<=2;
        /* SÜRE HER ZAMAN YAZILIR. Kısa bloklarda ayrı satır sığmadığı için
           üst etikete eklenir — eskiden .bs gizleniyor ve 30-60 dk'lık
           bloklarda süre hiç görünmüyordu. */
        var etiket=(b.dev?'⚠ DEVREDEN · ':'')+
                   kisaAd(b.sub)+(b.tur==='soru'?' · SORU':b.tur==='konu'?' · KONU':'')+
                   (b.parca?' '+b.parca:'')+
                   (kisa?' · '+sa(b.dk):'');
        h+='<div class="pg-blok'+(b.tur==='soru'?' soru':'')+(kisa?' kisa':'')+
           (b.dev?' devreden':'')+
           (b.kilit?' kilitli':'')+(cak[b.id]?' cakisik':'')+
           (kocMu()?'':' salt')+'" data-b="'+esc(b.id)+'" data-u="'+b.uzunluk+
           '" style="height:'+yuk+'px;background:'+renk+'" title="'+
           esc(adOf(b.sub)+' — '+b.konu+' ('+sa(b.dk)+')')+
           (cak[b.id]?' · KAPALI SAATE DENK GELİYOR':'')+'">'+
           (cak[b.id]?'<span class="pg-kil">!</span>':b.kilit&&kocMu()?'<span class="pg-kil">🔒</span>':'')+
           '<div class="bd">'+esc(etiket)+'</div>'+
           '<div class="bk">'+esc(b.konu)+'</div>'+
           (kisa?'':'<div class="bs">'+sa(b.dk)+'</div>')+'</div>';
      }
      h+='</td>';
    }
    h+='</tr>'; d++;
  }
  t.innerHTML=h+'</tbody>';
  blokBoyunuOlc(t);

  cizOzet(); cizArac(); cizYuk(); cizAlt();
}

/* BLOK YÜKSEKLİĞİNİ GERÇEK SATIRA GÖRE AYARLA.
   Blok yüksekliği sabit bir satır varsayımıyla (SATIR_PX) yazılıyor, ama
   satırın gerçek yüksekliğini saat sütununun içeriği belirliyor: punto,
   dolgu, panelin kendi "td{padding}" kuralı... Ölçüldü — CSS 26px derken
   satır 32px çıkıyordu ve bloklar kendi dilimlerinin altına yetişmiyor,
   ızgarada kayık duruyordu. Tek doğru yol çizimden sonra ölçmek. */
function blokBoyunuOlc(t){
  var satir=t.querySelector('tbody tr:not(.pg-katli)');
  if(!satir) return;
  var h=satir.getBoundingClientRect().height;
  if(!h || h<6) return;
  var bl=t.querySelectorAll('.pg-blok');
  for(var i=0;i<bl.length;i++){
    var u=+bl[i].getAttribute('data-u')||1;
    bl[i].style.height=(u*h-3)+'px';
  }
}

function cizOzet(){
  var el=document.getElementById('pg-ozet'); if(!el) return;
  var toplam=odevler().reduce(function(a,o){ return a+toplamDk(o); },0);
  var yerlesen=bloklar.reduce(function(a,b){ return a+b.dk; },0);
  var acik=acikDakika(), y=gunYukleri();
  var fark=Math.max.apply(null,y)-Math.min.apply(null,y);
  var oran=toplam?Math.round(yerlesen/toplam*100):0;
  function kutu(k,v,n,renk){
    return '<div><div class="k">'+k+'</div><div class="v"'+
      (renk?' style="color:'+renk+'"':'')+'>'+v+'</div><div class="n">'+n+'</div></div>';
  }
  var devSay=odevler().filter(function(o){ return o.dev; }).length;
  el.innerHTML =
    kutu('Bu haftanın yükü', toplam?sa(toplam):'—',
         odevler().length+' ödev'+(devSay?' · '+devSay+' devreden':'')) +
    kutu('Açık zaman', sa(acik), acik<toplam?'yetmiyor':'yeterli',
         acik<toplam?'var(--bad)':'') +
    kutu('Yerleşen', toplam?oran+'%':'—', sa(yerlesen)+' / '+sa(toplam),
         bekleyenler.length?'var(--warn)':'var(--ok)') +
    kutu('Gün dengesi', sa(fark), 'en yoğun – en boş gün farkı',
         fark>180?'var(--warn)':'var(--ok)');
}

function cizArac(){
  var el=document.getElementById('pg-arac'); if(!el) return;
  var h='';
  if(kocMu()){
    h+='<button class="pg-btn" data-ac="dagit">Yeniden dağıt</button>'+
       '<button class="pg-btn gh" data-ac="temizle">Tabloyu boşalt</button>'+
       '<span class="pg-ayrac"></span>'+
       '<span class="pg-et">Günde en fazla</span><select class="pg-sec" id="pg-tavan">';
    for(var t=4;t<=12;t++)
      h+='<option value="'+(t*60)+'"'+(tavan()===t*60?' selected':'')+'>'+t+' saat</option>';
    h+='</select><span class="pg-ayrac"></span>';
  }else{
    /* Öğrencinin kendi hayatını hızlı kurması için hazır şablonlar */
    h+='<span class="pg-et">Saatlerimi kur:</span>';
    h+='<button class="pg-btn gh mini" data-sb="OKUL">Okul saatleri</button>'+
       '<button class="pg-btn gh mini" data-sb="UYKU">Uyku</button>'+
       '<button class="pg-btn gh mini" data-sb="KURS">Kurs</button>'+
       '<button class="pg-btn gh mini" data-ac="hepsiac">Hepsini aç</button>'+
       '<span class="pg-ayrac"></span>';
  }
  h+='<button class="pg-btn gh'+(boyaAcik?' on':'')+'" data-ac="boya">'+
     (boyaAcik?'✓ Saat düzenleme açık':'Saat aç / kapat')+'</button>';
  if(boyaAcik && !kocMu()){
    h+='<select class="pg-sec" id="pg-sebep">';
    SEBEPLER.forEach(function(s){
      h+='<option value="'+s[0]+'"'+(boyaSebep===s[0]?' selected':'')+'>'+s[1]+'</option>';
    });
    h+='</select>';
  }
  h+='<button class="pg-btn gh'+(katlaAcik?' on':'')+'" data-ac="katla">'+
     (katlaAcik?'Boş saatleri katla':'24 saati göster')+'</button>';
  h+='<span class="pg-bilgi">'+(boyaAcik
       ? '🖌 Hücrelere sürükleyerek saat aç/kapat'
       : (kocMu()?'Blokları sürükleyerek taşıyabilirsin'
                : 'Koçunun yerleştirdiği blokları taşıyamazsın — saatlerini düzenleyebilirsin'))+
     '</span>';
  el.innerHTML=h;
}

function cizYuk(){
  var el=document.getElementById('pg-yuk'); if(!el) return;
  var y=gunYukleri(), enb=Math.max(1,Math.max.apply(null,y));
  var h='<div class="et">GÜN YÜKÜ</div>';
  y.forEach(function(v,i){
    var acikG=gunAcik(i), asiri=v>acikG;
    h+='<div><b>'+(v?sa(v):'—')+'</b><div class="cb"><i class="'+(asiri?'asiri':'')+
       '" style="width:'+Math.round(v/enb*100)+'%"></i></div>'+
       '<div class="ac">açık '+sa(acikG)+'</div></div>';
  });
  el.innerHTML=h;
}

function cizAlt(){
  var el=document.getElementById('pg-alt'); if(!el) return;
  var cak=cakisanlar();
  var h='';

  if(kayitHatasi){
    h+='<div class="pg-flag bad"><span class="ic">!</span><span>'+
       '<b>Değişikliklerin kaydedilemedi.</b> '+esc(kayitHatasi)+
       ' Sayfayı kapatma — bağlantını kontrol edip bir blok taşıyarak yeniden dene.'+
       '</span></div>';
  }

  /* Bu uyarı "hepsi sığdı" mesajından ÖNCE gelir ve onu bastırır: program
     ödev listesinin gerisindeyken "bütün ödevler yerleşti" demek yanlıştır. */
  if(tazelik.yeni || tazelik.giden){
    var parca=[];
    if(tazelik.yeni)  parca.push('<b>'+tazelik.yeni+' ödev</b> programda yok');
    if(tazelik.giden) parca.push('<b>'+tazelik.giden+' iş</b> artık ödev listesinde değil');
    h+='<div class="pg-flag warn"><span class="ic">!</span><span>'+
       parca.join(' · ')+'. '+
       (kocMu()
         ? 'Elle yerleştirdiğin bloklar olduğu için otomatik güncellemedim — kaybolmasınlar. '+
           '<b>Yeniden dağıt</b> düğmesine basarsan kilitliler yerinde kalır, gerisi yeniden düzenlenir.'
         : 'Koçun programı henüz güncellemedi.')+
       '</span></div>';
  }

  if(cak.length){
    h+='<div class="pg-flag bad"><span class="ic">!</span><span>'+
      '<b>'+cak.length+' blok kapalı saate denk geliyor.</b> '+
      (kocMu() ? 'Öğrenci bu saatleri kapatmış. "Yeniden dağıt" ile programı güncelle.'
               : 'Kapattığın saatlerde koçunun verdiği çalışma var. Koçun görecek ve programı güncelleyecek.')+
      '</span></div>';
  }

  if(bekleyenler.length){
    /* Sebebi tahmin etme, ÖLÇ: tavan yüzünden mi yer yok, gerçekten yer mi yok? */
    var y=gunYukleri(), tv=tavan(), bosVar=0;
    for(var gi=0;gi<GUN;gi++){
      var kalanSaat=gunAcik(gi)-y[gi];
      if(kalanSaat>0 && y[gi]>=tv-30) bosVar+=kalanSaat;
    }
    h+='<div class="pg-bek-bas">'+bekleyenler.length+' blok sığmadı · '+
       sa(bekleyenler.reduce(function(a,b){ return a+b.dk; },0))+'</div>';
    h+='<div class="pg-bek" id="pg-bek">'+bekleyenler.map(function(b){
      return '<div class="bl" data-bek="'+esc(b.id)+'" style="background:'+renkOf(b.sub)+'">'+
        '<b>'+esc(kisaAd(b.sub))+(b.tur==='soru'?' · SORU':b.tur==='konu'?' · KONU':'')+'</b>'+
        esc(b.konu)+' — '+sa(b.dk)+'</div>';
    }).join('')+'</div>';
    h+='<div class="pg-flag warn"><span class="ic">!</span><span>'+
      (kocMu()
        ? (bosVar>=60
            ? 'Takvimde ' + sa(bosVar) + ' boş yer VAR, ama o günler ' + Math.round(tv/60) +
              ' saatlik günlük tavana dayandı. Üç seçeneğin var: tavanı yükselt, ödevi azalt, ya da öğrenciden hafta içi daha fazla saat açmasını iste.'
            : 'Açık saatler bu haftanın ödevine yetmiyor. Ya öğrenci daha fazla saat açmalı, ya da bu haftanın ödevi azaltılmalı.') +
          ' Blokları buradan takvime sürükleyerek elle de yerleştirebilirsin.'
        : 'Bu çalışmalar açık saatlerine sığmadı. Daha fazla saat açarsan yerleşir; açamıyorsan koçuna söyle.')+
      '</span></div>';
  }else if(!cak.length && !tazelik.yeni && !tazelik.giden && bloklar.length){
    h+='<div class="pg-flag ok"><span class="ic">✓</span><span>'+
      (kocMu() ? 'Bütün ödevler haftaya sığdı. Blokları sürükleyerek ince ayar yapabilirsin.'
               : 'Bu haftanın bütün çalışmaları programına sığdı.')+'</span></div>';
  }else if(!bloklar.length){
    h+='<div class="pg-flag warn"><span class="ic">i</span><span>'+
      (kocMu() ? 'Program boş. "Yeniden dağıt" ile bu haftanın ödevlerini takvime yerleştir.'
               : 'Koçun henüz bu haftanın programını hazırlamadı.')+'</span></div>';
  }

  h+='<div class="pg-lejant">'+
     '<span><i class="kap"></i>Kapalı saat</span>'+
     '<span><i class="sor" style="background:'+renkOf('tyt_mat')+'"></i>Soru çözümü (çizgili)</span>'+
     '<span><i style="background:'+renkOf('tyt_mat')+'"></i>Konu çalışması (düz)</span>'+
     (kocMu()?'<span><i style="background:var(--ink-3)"></i>🔒 elle taşındı, dağıtımda korunur</span>':'')+
     '</div>';
  el.innerHTML=h;
}

/* ═══════════════════════════════════════════════════════════
   ETKİLEŞİM — pointer olayları (fare + dokunma tek yol)
   ═══════════════════════════════════════════════════════════ */
var boyaDurum=null, surukBlok=null, surukBek=null, baglandi=false;

function hayalet(){
  var h=document.getElementById('pg-hayalet');
  if(!h){
    h=document.createElement('div');
    h.id='pg-hayalet';
    document.body.appendChild(h);
  }
  return h;
}
function hayaletGoster(e,renk,metin){
  var h=hayalet();
  h.style.display='block'; h.style.background=renk; h.textContent=metin;
  hayaletTasi(e);
}
function hayaletTasi(e){
  var h=hayalet();
  h.style.left=(e.clientX+14)+'px'; h.style.top=(e.clientY+14)+'px';
}
function hayaletGizle(){
  var h=document.getElementById('pg-hayalet');
  if(h) h.style.display='none';
}

function boyala(g,d){
  var a=ah(g,d);
  if(boyaDurum==='kapat'){
    kapali.add(a);
    if(!kocMu()) sebep[a]=boyaSebep;
  }else{
    kapali.delete(a); delete sebep[a];
  }
  var td=document.querySelector('#pg-tablo td.pg-h[data-g="'+g+'"][data-d="'+d+'"]');
  if(td){
    td.classList.toggle('kapali',kapali.has(a));
    td.setAttribute('data-sebep', kapali.has(a)&&sebep[a]?sebep[a]:'');
  }
}

function bagla(){
  if(baglandi) return;
  baglandi=true;
  window.addEventListener('pagehide', bekleyeniHemenYaz);
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState==='hidden') bekleyeniHemenYaz();
  });

  document.addEventListener('pointerdown', function(e){
    var kok=kokEl(); if(!kok || !kok.contains(e.target)) return;

    /* araç çubuğu */
    var btn=e.target.closest('[data-ac],[data-sb]');
    if(btn && kok.contains(btn)){ arac(btn); return; }

    /* katlanmış bant */
    var kat=e.target.closest('[data-kat]');
    if(kat){
      var p=kat.getAttribute('data-kat').split('-');
      for(var i=+p[0];i<=+p[1];i++) acikKatlar.add(i);
      ciz(); return;
    }

    /* bekleyen bloğu sürükle (yalnız koç) */
    var bek=e.target.closest('[data-bek]');
    if(bek && kocMu()){
      surukBek=bekleyenler.filter(function(x){ return x.id===bek.getAttribute('data-bek'); })[0];
      if(surukBek){
        hayaletGoster(e,renkOf(surukBek.sub),surukBek.konu+' · '+sa(surukBek.dk));
        e.preventDefault();
      }
      return;
    }

    var blokEl=e.target.closest('.pg-blok');
    var td=e.target.closest('td.pg-h');

    if(blokEl && kocMu() && !boyaAcik){
      var b=bloklar.filter(function(x){ return x.id===blokEl.getAttribute('data-b'); })[0];
      if(!b) return;
      surukBlok=b; blokEl.classList.add('suruk');
      hayaletGoster(e,renkOf(b.sub),b.konu+' · '+sa(b.dk));
      e.preventDefault(); return;
    }
    if(td && boyaAcik){
      var g=+td.getAttribute('data-g'), d=+td.getAttribute('data-d');
      boyaDurum = kapali.has(ah(g,d)) ? 'ac' : 'kapat';
      boyala(g,d); e.preventDefault();
    }
  });

  document.addEventListener('pointermove', function(e){
    if(!boyaDurum && !surukBlok && !surukBek) return;
    var td=document.elementFromPoint(e.clientX,e.clientY);
    td = td && td.closest ? td.closest('td.pg-h') : null;

    if(boyaDurum){ if(td) boyala(+td.getAttribute('data-g'),+td.getAttribute('data-d')); return; }

    hayaletTasi(e);
    var t=document.getElementById('pg-tablo'); if(!t) return;
    var eski=t.querySelectorAll('td.hedef,td.gecersiz');
    for(var i=0;i<eski.length;i++) eski[i].classList.remove('hedef','gecersiz');
    var b=surukBlok||surukBek;
    if(td && b){
      var g=+td.getAttribute('data-g'), d=+td.getAttribute('data-d');
      var kotu=blokCakisiyor(b,g,d,surukBlok?b.id:'__yok__');
      for(var k=0;k<b.uzunluk && d+k<DILIM;k++){
        var h=t.querySelector('td.pg-h[data-g="'+g+'"][data-d="'+(d+k)+'"]');
        if(h) h.classList.add(kotu?'gecersiz':'hedef');
      }
    }
  });

  document.addEventListener('pointerup', function(e){
    if(boyaDurum){ boyaDurum=null; isaretle('kapali'); ciz(); return; }
    if(!surukBlok && !surukBek) return;

    var td=document.elementFromPoint(e.clientX,e.clientY);
    var hedef = td && td.closest ? td.closest('td.pg-h') : null;
    if(hedef){
      var g=+hedef.getAttribute('data-g'), d=+hedef.getAttribute('data-d');
      if(surukBlok && !blokCakisiyor(surukBlok,g,d,surukBlok.id)){
        surukBlok.gun=g; surukBlok.dilim=d;
        surukBlok.kilit=true;      /* elle taşındı → yeniden dağıtımda korunur */
        isaretle('bloklar');
      }else if(surukBek && !blokCakisiyor(surukBek,g,d,'__yok__')){
        var yeni={}; for(var p in surukBek) yeni[p]=surukBek[p];
        yeni.gun=g; yeni.dilim=d; yeni.kilit=true;
        bloklar.push(yeni);
        var bid=surukBek.id;
        bekleyenler=bekleyenler.filter(function(x){ return x.id!==bid; });
        isaretle('bloklar');
      }
    }
    surukBlok=null; surukBek=null; hayaletGizle(); ciz();
  });

  document.addEventListener('change', function(e){
    if(!e.target) return;
    if(e.target.id==='pg-sebep') boyaSebep=e.target.value;
    if(e.target.id==='pg-tavan'){
      tavanYaz(+e.target.value);
      dagitCekirdek(); isaretle('bloklar'); ciz();
    }
  });
}

function arac(btn){
  var ac=btn.getAttribute('data-ac'), sb=btn.getAttribute('data-sb');
  if(sb){ sablon(sb); return; }
  if(ac==='dagit'){ dagitCekirdek(); isaretle('bloklar'); ciz(); }
  else if(ac==='temizle'){ bloklar=[]; bekleyenler=[]; isaretle('bloklar'); ciz(); }
  else if(ac==='boya'){ boyaAcik=!boyaAcik; ciz(); }
  else if(ac==='katla'){ katlaAcik=!katlaAcik; acikKatlar=new Set(); ciz(); }
  else if(ac==='hepsiac'){ kapali=new Set(); sebep={}; isaretle('kapali'); ciz(); }
}

/* Öğrencinin hızlı kurulumu. Aynı şablona ikinci kez basmak geri alır —
   yanlışlıkla basan öğrenci sıkışmasın. */
function sablon(tip){
  var g,d,varMi=true;
  function her(fn){
    if(tip==='OKUL'){ for(g=0;g<5;g++) for(d=16;d<32;d++) fn(g,d); }
    else if(tip==='UYKU'){ for(g=0;g<GUN;g++){ for(d=0;d<14;d++) fn(g,d); fn(g,47); } }
    else if(tip==='KURS'){ for(d=18;d<26;d++) fn(5,d); }
  }
  her(function(g,d){ if(!kapali.has(ah(g,d))) varMi=false; });
  her(function(g,d){
    if(varMi){ kapali.delete(ah(g,d)); delete sebep[ah(g,d)]; }
    else kapat(g,d,tip);
  });
  isaretle('kapali'); ciz();
}

/* ═══════════════════════════════════════════════════════════
   BİÇİM — bir kez enjekte edilir, panelin tema değişkenlerini kullanır
   ═══════════════════════════════════════════════════════════ */
function stil(){
  if(document.getElementById('pg-stil')) return;
  var s=document.createElement('style');
  s.id='pg-stil';
  s.textContent=[
'.pg{--pg-cizgi:var(--line-soft,#E2E9EC)}',
'.pg-ozet{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--pg-cizgi);border-bottom:1px solid var(--pg-cizgi)}',
'.pg-ozet>div{background:var(--panel,#fff);padding:12px 15px}',
'.pg-ozet .k{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:650}',
'.pg-ozet .v{font-size:22px;font-weight:750;font-family:var(--mono);line-height:1.2;margin-top:2px;font-variant-numeric:tabular-nums}',
'.pg-ozet .n{font-size:11px;color:var(--ink-3)}',
'@media(max-width:640px){.pg-ozet{grid-template-columns:repeat(2,1fr)}}',

'.pg-arac{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:11px 15px;border-bottom:1px solid var(--pg-cizgi)}',
'.pg-arac .pg-ayrac{width:1px;height:22px;background:var(--pg-cizgi)}',
'.pg-arac .pg-bilgi{font-size:12px;color:var(--ink-3);margin-left:auto}',
'.pg-arac .pg-et{font-size:12px;color:var(--ink-3);font-weight:650}',
'@media(max-width:760px){.pg-arac .pg-bilgi{margin-left:0;flex-basis:100%}}',

'.pg-btn{background:var(--accent);color:#fff;border:0;border-radius:8px;padding:8px 14px;font:inherit;font-weight:650;cursor:pointer;min-height:38px}',
'.pg-btn.gh{background:none;border:1.5px solid var(--accent);color:var(--accent)}',
'.pg-btn.gh.on{background:var(--accent);color:#fff}',
'.pg-btn.mini{padding:6px 10px;font-size:12.5px;min-height:34px}',
/* width:auto ŞART — her iki panelde de genel bir "select{width:100%}"
   kuralı var ve onu yeniyordu; açılır kutu 569px olup araç çubuğunu
   üç satıra çıkarıyordu (ölçüldü). */
'.pg .pg-sec{font:inherit;padding:7px 9px;border-radius:8px;border:1.5px solid var(--line);background:var(--panel);color:var(--ink);min-height:38px;width:auto;max-width:170px;display:inline-block}',

'.pg-izsar{overflow:auto;max-height:70vh;border-bottom:1px solid var(--pg-cizgi);-webkit-overflow-scrolling:touch}',
'table.pg-iz{border-collapse:separate;border-spacing:0;width:100%;table-layout:fixed;min-width:660px}',
'table.pg-iz th{position:sticky;top:0;z-index:5;background:var(--lacivert,#03182B);color:#fff;font-size:11px;font-weight:700;letter-spacing:.04em;padding:7px 3px;text-align:center}',
'table.pg-iz th i{display:block;font-size:8.5px;opacity:.6;font-weight:400;font-style:normal}',
'table.pg-iz th.sa{width:64px;left:0;z-index:6}',
/* Saat sütunu okunur olmalı — 10px punto ile hangi satırda olduğunu
   görmek için tabloya yaklaşmak gerekiyordu. */
'table.pg-iz td.sa{position:sticky;left:0;z-index:4;background:var(--panel);font-family:var(--mono);font-size:12.5px;color:var(--ink-3);text-align:right;padding-right:8px;border-right:1px solid var(--line);white-space:nowrap;letter-spacing:-.02em}',
'table.pg-iz td.sa.tam{color:var(--ink);font-weight:700;font-size:13.5px}',
'td.pg-h{height:26px;border-bottom:1px solid var(--pg-cizgi);border-right:1px solid var(--pg-cizgi);position:relative;background:var(--panel);padding:0}',
'td.pg-h.kapali{background:repeating-linear-gradient(45deg,var(--paper),var(--paper) 5px,var(--panel) 5px,var(--panel) 10px)}',
'td.pg-h.hedef{background:var(--accent-soft)!important;box-shadow:inset 0 0 0 2px var(--accent)}',
'td.pg-h.gecersiz{background:var(--bad-bg)!important}',
'td.pg-h.kapali::after{content:attr(data-sebep);position:absolute;left:5px;top:2px;font-size:8px;font-weight:800;letter-spacing:.06em;color:var(--ink-3);opacity:.7;text-transform:uppercase;pointer-events:none}',
'.pg-boya td.pg-h{cursor:crosshair;touch-action:none}',
'tr.pg-katli td{height:26px;background:var(--paper);text-align:center;font-size:11px;color:var(--ink-3);cursor:pointer;border-bottom:1px solid var(--line);font-weight:600}',

'.pg-blok{position:absolute;left:2px;right:2px;top:1px;border-radius:6px;padding:3px 6px;overflow:hidden;cursor:grab;z-index:2;color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.16);border-left:4px solid rgba(0,0,0,.28);touch-action:none}',
'.pg-blok.salt{cursor:default}',
'.pg-blok.suruk{opacity:.4}',
'.pg-blok .bd{font-size:9px;font-weight:800;letter-spacing:.04em;opacity:.9;line-height:1.15;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.pg-blok .bk{font-size:10.5px;font-weight:650;line-height:1.2;margin-top:1px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
'.pg-blok .bs{font-size:9px;font-family:var(--mono);opacity:.85;margin-top:1px}',
'.pg-blok.soru{background-image:repeating-linear-gradient(135deg,transparent,transparent 6px,rgba(255,255,255,.16) 6px,rgba(255,255,255,.16) 12px)}',
'.pg-blok.kisa{padding:1px 5px}',
'.pg-blok.kisa .bd{font-size:8.5px}',
'.pg-blok.kisa .bk{-webkit-line-clamp:1;font-size:10px;margin-top:0}',
'.pg-blok.kilitli{box-shadow:0 0 0 2px rgba(255,255,255,.55),0 1px 3px rgba(0,0,0,.2)}',
/* Devreden iş: sol kenarda kalın turuncu şerit. Kırmızı değil — geciken
   ödev bir hata değil, bir kuyruk; ama görünmesi şart. */
'.pg-blok.devreden{border-left:5px solid var(--turuncu,#E8873A)}',
'.pg-blok.devreden .bd{opacity:1}',
'.pg-blok.cakisik{box-shadow:0 0 0 2px var(--bad),0 1px 3px rgba(0,0,0,.2)}',
'.pg-blok .pg-kil{position:absolute;right:3px;top:2px;font-size:9px;opacity:.9;line-height:1;font-weight:800}',

'#pg-hayalet{position:fixed;pointer-events:none;z-index:9999;opacity:.92;border-radius:6px;padding:4px 8px;color:#fff;font-size:11px;font-weight:650;box-shadow:0 8px 24px rgba(0,0,0,.35);display:none}',

'.pg-yuk{display:grid;grid-template-columns:64px repeat(7,1fr);border-bottom:1px solid var(--pg-cizgi)}',
'.pg-yuk>div{padding:7px 3px;text-align:center;font-size:11px;border-right:1px solid var(--pg-cizgi)}',
'.pg-yuk .et{text-align:right;padding-right:6px;color:var(--ink-3);font-size:10px;border-right:1px solid var(--line)}',
'.pg-yuk .cb{height:5px;border-radius:3px;background:var(--pg-cizgi);margin-top:4px;overflow:hidden}',
'.pg-yuk .cb i{display:block;height:100%;background:var(--accent);border-radius:3px;transition:width .5s var(--gy,ease)}',
'.pg-yuk .cb i.asiri{background:var(--bad)}',
'.pg-yuk .ac{font-size:9px;color:var(--ink-3);margin-top:2px}',
'.pg-yuk b{font-family:var(--mono);font-size:12px;font-variant-numeric:tabular-nums}',

'.pg-alt{padding:14px 15px}',
'.pg-bek-bas{font-size:12px;font-weight:700;color:var(--ink-2);margin-bottom:7px}',
'.pg-bek{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}',
'.pg-bek .bl{border-radius:7px;padding:7px 11px;color:#fff;font-size:12px;cursor:grab;box-shadow:0 2px 6px rgba(0,0,0,.14);border-left:4px solid rgba(0,0,0,.28);touch-action:none}',
'.pg-bek .bl b{display:block;font-size:9px;letter-spacing:.05em;opacity:.9;text-transform:uppercase}',
'.pg-flag{display:flex;gap:9px;align-items:flex-start;padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:10px}',
'.pg-flag.warn{background:var(--warn-bg);color:var(--warn-ink)}',
'.pg-flag.ok{background:var(--ok-bg);color:var(--ok-ink)}',
'.pg-flag.bad{background:var(--bad-bg);color:var(--bad-ink)}',
'.pg-flag .ic{font-weight:800;flex:none}',
'.pg-lejant{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--ink-3);align-items:center}',
'.pg-lejant i{display:inline-block;width:14px;height:14px;border-radius:4px;vertical-align:-3px;margin-right:5px}',
'.pg-lejant .kap{background:repeating-linear-gradient(45deg,var(--paper),var(--paper) 4px,var(--panel) 4px,var(--panel) 8px);border:1px solid var(--line)}',
'.pg-lejant .sor{background-image:repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(255,255,255,.4) 4px,rgba(255,255,255,.4) 8px)}',

'@media (prefers-reduced-motion: reduce){.pg-yuk .cb i{transition:none}}'
  ].join('\n');
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════
   DIŞ ARAYÜZ
   ═══════════════════════════════════════════════════════════ */
/* cfg = {
     anahtar : 'ogrenciId|hafta'   — değişince durum sunucudan tazelenir
     rol     : 'koc' | 'ogrenci'
     odevler : [{id,sub,konu,calisma,soru,oncelik,rutin}]
     program : {kapali:[...], bloklar:[...]}
     dersAdi : fn(sub)->'TYT Matematik'
     ayir    : true/false
     kaydet  : {kapali:fn(dizi), bloklar:fn(dizi)}
   } */
function mont(cfg){
  stil(); bagla();
  var yeniAnahtar = cfg.anahtar||'';
  C = cfg;
  if(yeniAnahtar !== suAnahtar){
    suAnahtar = yeniAnahtar;
    iceriAl(cfg.program);
    boyaAcik=false; acikKatlar=new Set();
    /* Koç ilk kez açıyorsa ve program boşsa otomatik doldur — koçun
       boş bir tabloyla karşılaşıp "bu ne işe yarıyor" demesini önler. */
    /* isaretle() ŞART: bu ilk dağıtım kaydedilmezse koç ekranda dolu bir
       program görür ama sunucuda hiçbir şey yoktur — öğrenci boş sekme
       açar ve "koçum program hazırlamamış" sanır.

       otoDagit: örnek öğrenci için. Orada koç yok, dolayısıyla kimse
       dağıtım yapmıyor ve tanıtım ızgarası boş kalıyordu. Bayrak açıkken
       öğrenci rolünde de bir kez dağıtılır — kaydedilmez, çünkü örnek
       modda kaydet zaten boştur. */
    if((kocMu() || C.otoDagit) && !bloklar.length && odevler().length){
      dagitCekirdek();
      if(kocMu()) isaretle('bloklar');
    }
  }
  /* Anahtar aynı kalsa bile (aynı öğrenci, aynı hafta) ödev listesi değişmiş
     olabilir — koç az önce yeni ödev vermiş olabilir. Kilitli blok YOKSA
     sessizce yeniden dağıt: kaybedilecek elle düzenleme yok. Kilitli blok
     VARSA dokunma, koça haber ver — onun emeğini habersiz silmek, sessizce
     eski programı göstermekten de kötüdür. */
  tazelik = tazelikOlc();
  if(kocMu() && (tazelik.yeni || tazelik.giden)){
    if(!bloklar.some(function(b){ return b.kilit; })){
      dagitCekirdek();
      isaretle('bloklar');
      tazelik = tazelikOlc();
    }
  }
  var kok=kokEl();
  if(kok) kok.classList.toggle('pg-boya',boyaAcik);
  ciz();
}

return {
  iskelet: iskelet,
  mont: mont,
  ciz: ciz,
  veri: function(){ return {kapali:disaKapali(), bloklar:disaBloklar()}; },
  /* Panel dışarıdan tazeleme yaptıysa (sunucudan yeni program geldi) */
  tazele: function(program){ iceriAl(program); ciz(); },
  /* Ölçüm — sınama ve panelin özet satırı için */
  olcum: function(){
    var y=gunYukleri();
    return {gunYuku:y, bekleyen:bekleyenler.length, blok:bloklar.length,
            cakisan:cakisanlar().length, acik:acikDakika(),
            tazelik:tazelikOlc(),
            fark:Math.max.apply(null,y)-Math.min.apply(null,y)};
  }
};
})();
