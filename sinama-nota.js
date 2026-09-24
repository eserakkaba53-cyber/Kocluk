/* Nota ve piyano altyapısının müzik kuralına karşı denetimi.
   node sinama-nota.js
   Kod kopyalanmıyor: fonksiyonlar ogrenme-dunyasi.html'den çıkarılıp
   burada çalıştırılıyor. Her nota, her anahtarda standart porte
   konumuyla karşılaştırılıyor. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KOK = process.env.KOK || __dirname;
const sayfa = fs.readFileSync(path.join(KOK, 'ogrenme-dunyasi.html'), 'utf8').split('\r\n').join('\n');

/* sabit ya da tek satırlık tanım */
function satir(bas) {
  const i = sayfa.indexOf('\n' + bas);
  assert.ok(i >= 0, bas + ' bulunamadı');
  return sayfa.slice(i + 1, sayfa.indexOf('\n', i + 1));
}
/* birden çok satırlık fonksiyon: sütun 0'daki kapanışa kadar */
function govde(ad) {
  const i = sayfa.indexOf('\nfunction ' + ad + '(');
  assert.ok(i >= 0, ad + ' bulunamadı');
  return sayfa.slice(i + 1, sayfa.indexOf('\n}\n', i) + 3);
}

const kap = { Math, console, Array, Set, String, Number, JSON, Object };
vm.createContext(kap);
const yukle = k => vm.runInContext(k.replace(/^const /, 'var '), kap);
[
  "const ISIM=", "const HARF=", "const YARIM=", "const isimAl=", "const TABAN=",
  "const NS=18", "const P_BAS=", "const diyezAd", "const bemolAd",
].forEach(b => yukle(satir(b)));
/* frekans iki satır: tanımın başından ilk "};" kapanışına kadar */
{ const i = sayfa.indexOf('\nconst frekans=') + 1;
  yukle(sayfa.slice(i, sayfa.indexOf('};', i) + 2)); }
yukle(satir('const KILAVUZ_DO='));
yukle(satir('const KIL_X='));
yukle('var kilavuzAcik=false;');
yukle(govde('kilavuzCiz'));
yukle(govde('dizekCiz'));
yukle(govde('piyanoCiz'));

let kal = 0, gec = 0;
function bak(ad, kosul, ek) {
  if (kosul) { gec++; return; }
  kal++; console.log('  [KALDI] ' + ad + (ek !== undefined ? '  -> ' + JSON.stringify(ek) : ''));
}

/* ---- STANDART: porte konumu → nota adı ----
   Sol anahtarı alt çizgi Mi4, fa anahtarı alt çizgi Sol2. Her konum bir
   diyatonik adım. Bilimsel perde adıyla (C4 = orta Do) yazılıyor ki
   kod ile karşılaştırma bağımsız bir kaynağa dayansın. */
const ADLAR = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const TR = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const bilimsel = step => ADLAR[((step % 7) + 7) % 7] + Math.floor(step / 7);
const ALT_CIZGI = { sol: 'E4', fa: 'G2' };
const CIZGILER = { sol: ['E4', 'G4', 'B4', 'D5', 'F5'], fa: ['G2', 'B2', 'D3', 'F3', 'A3'] };

console.log('1) Taban: anahtarların alt çizgisi');
for (const a of ['sol', 'fa'])
  bak(a + ' alt çizgi ' + ALT_CIZGI[a], bilimsel(kap.TABAN[a]) === ALT_CIZGI[a], bilimsel(kap.TABAN[a]));

console.log('2) Beş çizginin her biri doğru notada mı');
for (const a of ['sol', 'fa'])
  CIZGILER[a].forEach((beklenen, i) => {
    const step = kap.TABAN[a] + 2 * i;
    bak(`${a} ${i + 1}. çizgi = ${beklenen}`, bilimsel(step) === beklenen, bilimsel(step));
  });

console.log('3) Orta Do: iki anahtarda da aynı adım, ikisinde de tek ek çizgi');
bak('orta Do = C4 = adım 28', bilimsel(28) === 'C4');
bak('sol anahtarında orta Do bir ek çizgi AŞAĞIDA (o = -2)', 28 - kap.TABAN.sol === -2);
bak('fa anahtarında orta Do bir ek çizgi YUKARIDA (o = 10)', 28 - kap.TABAN.fa === 10);

console.log('4) Nota başı dizekte doğru y konumunda mı (bütün aralık)');
/* dizekCiz çıktısındaki nota başı elipsinin cy değeri */
const notaY = svg => { const m = svg.match(/<ellipse cx="165" cy="([-\d.]+)"/); return m ? +m[1] : null; };
const ALT_Y = 186, ARALIK = 18;          /* N_ALT, NS */
for (const a of ['sol', 'fa']) {
  for (let step = kap.TABAN[a] - 6; step <= kap.TABAN[a] + 14; step++) {
    const y = notaY(kap.dizekCiz(a, step));
    const beklenenY = ALT_Y - (step - kap.TABAN[a]) * (ARALIK / 2);
    bak(`${a} ${bilimsel(step)} y`, Math.abs(y - beklenenY) < 0.01, { y, beklenenY });
  }
}

console.log('5) Ek çizgi sayısı');
/* dizek dışındaki notalar için beklenen ek çizgi sayısı (standart) */
const ekSayisi = o => o < 0 ? Math.floor(-o / 2) : o > 8 ? Math.floor((o - 8) / 2) : 0;
for (const a of ['sol', 'fa'])
  for (let step = kap.TABAN[a] - 6; step <= kap.TABAN[a] + 14; step++) {
    const svg = kap.dizekCiz(a, step);
    const n = (svg.match(/x1="139"/g) || []).length;          /* NOTA_X-26 */
    const o = step - kap.TABAN[a];
    bak(`${a} ${bilimsel(step)} ek çizgi ${ekSayisi(o)}`, n === ekSayisi(o), { bulunan: n, o });
  }

console.log('6) Sap yönü (Gould, Behind Bars: orta çizgi ve üstü aşağı, altı yukarı)');
for (const a of ['sol', 'fa'])
  for (let step = kap.TABAN[a] - 2; step <= kap.TABAN[a] + 10; step++) {
    const svg = kap.dizekCiz(a, step);
    const m = svg.match(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="[-\d.]+" y2="([-\d.]+)" stroke="#2a1d0e" stroke-width="3"/);
    const asagi = m && +m[3] > +m[2];
    const o = step - kap.TABAN[a];
    bak(`${a} ${bilimsel(step)} (o=${o}) sap ${o >= 4 ? 'aşağı' : 'yukarı'}`, asagi === (o >= 4),
        { asagi, o });
  }

console.log('7) Frekans: C4 = 261,63 Hz, A4 = 440 Hz');
bak('C4 261,63', Math.abs(kap.frekans(28) - 261.6256) < 0.01, kap.frekans(28));
bak('A4 440', Math.abs(kap.frekans(33) - 440) < 1e-9, kap.frekans(33));
bak('C2 65,41', Math.abs(kap.frekans(14) - 65.4064) < 0.01, kap.frekans(14));
bak('B5 987,77', Math.abs(kap.frekans(41) - 987.7666) < 0.01, kap.frekans(41));

console.log('8) Piyano: beyaz tuş adımı ve siyah tuş yerleri');
const svg = kap.piyanoCiz();
const beyazlar = [...svg.matchAll(/class="il beyaz" data-p="b(\d+)"/g)].map(m => +m[1]);
const siyahlar = [...svg.matchAll(/class="il siyah" data-p="s(\d+)"/g)].map(m => +m[1]);
bak('beyaz tuşlar ardışık', beyazlar.every((v, i) => i === 0 || v === beyazlar[i - 1] + 1));
/* Mi (E) ve Si (B) sonrasında siyah tuş olmaz */
for (const s of siyahlar)
  bak(`siyah s${s} (${bilimsel(s)}♯) Mi/Si sonrasında değil`,
      !['E', 'B'].includes(ADLAR[((s % 7) + 7) % 7]), bilimsel(s));
for (const b of beyazlar) {
  const ad = ADLAR[((b % 7) + 7) % 7];
  const siyahVar = siyahlar.includes(b);
  bak(`${bilimsel(b)} sonrası siyah tuş ${ad === 'E' || ad === 'B' ? 'yok' : 'var'}`,
      siyahVar === !(ad === 'E' || ad === 'B') || b === beyazlar[beyazlar.length - 1], { ad, siyahVar });
}

console.log('9) Diyez / bemol adları (enharmonik eşler)');
const ESLER = { C: ['Do♯', 'Re♭'], D: ['Re♯', 'Mi♭'], F: ['Fa♯', 'Sol♭'], G: ['Sol♯', 'La♭'], A: ['La♯', 'Si♭'] };
for (const [h, [d, b]] of Object.entries(ESLER)) {
  const step = 28 + ADLAR.indexOf(h);
  bak(`${h}♯ = ${d}`, kap.diyezAd(step) === d, kap.diyezAd(step));
  bak(`${h}♯ = ${b}`, kap.bemolAd(step) === b, kap.bemolAd(step));
}

console.log('10) 6. ve 7. seviye: iki oktavlık klavye ESKİSİYLE BİREBİR aynı');
/* Eski kod siyah tuşları sabit listeden alıyordu; yenisi kuraldan üretiyor.
   Eski çıktıyı bağımsız olarak kurup karşılaştırıyoruz. */
{
  const ESKI_SIYAH = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
  let s = '';
  for (let i = 0; i < 14; i++)
    s += `<rect class="il beyaz" data-p="b${28 + i}" x="${i * 40 + 1}" y="4"` +
         ` width="38" height="152" rx="4"/>`;
  for (const i of ESKI_SIYAH)
    s += `<rect class="il siyah" data-p="s${28 + i}" x="${(i + 1) * 40 - 12}" y="4"` +
         ` width="24" height="96" rx="3"/>`;
  const eski = `<svg class="piyano" viewBox="0 0 560 162"` +
    ` xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Piyano klavyesi">${s}</svg>`;
  bak('piyanoCiz() eski çıktıyla aynı', kap.piyanoCiz() === eski);
  bak('piyanoCiz(null,true) yalnız tikla sınıfı ekliyor',
      kap.piyanoCiz(null, true) === eski.replace('class="piyano"', 'class="piyano tikla"'));
}

console.log('11) 8. seviye: dört oktav Do2–Si5, orta Do işaretli');
{
  const svg4 = kap.piyanoCiz(null, true, { bas: 14, oktav: 4, ortaDo: true });
  const b4 = [...svg4.matchAll(/class="il beyaz" data-p="b(\d+)"/g)].map(m => +m[1]);
  const s4 = [...svg4.matchAll(/class="il siyah" data-p="s(\d+)"/g)].map(m => +m[1]);
  bak('28 beyaz tuş', b4.length === 28, b4.length);
  bak('ilk beyaz Do2', bilimsel(b4[0]) === 'C2', bilimsel(b4[0]));
  bak('son beyaz Si5', bilimsel(b4[b4.length - 1]) === 'B5', bilimsel(b4[b4.length - 1]));
  bak('20 siyah tuş (oktavda 5 × 4)', s4.length === 20, s4.length);
  for (const s of s4)
    bak(`siyah s${s} Mi/Si sonrasında değil`, !['E', 'B'].includes(ADLAR[((s % 7) + 7) % 7]), bilimsel(s));
  /* orta Do noktası tam Do4 tuşunun ortasında mı */
  const m = svg4.match(/class="ortaDoNokta" cx="([\d.]+)"/);
  const beklenenCx = (28 - 14 + 0.5) * 40;
  bak('orta Do noktası Do4 tuşunun ortasında', m && +m[1] === beklenenCx, { bulunan: m && +m[1], beklenenCx });
  bak('orta Do klavyenin tam ortasında (14. beyaz tuş)', 28 - 14 === 14);
  bak('işaretler tıklamayı kesmiyor',
      (svg4.match(/class="(ortaDoNokta|ortaDoYazi|yarimYazi)"[^>]*pointer-events="none"/g) || []).length === 4);
  bak('kaydırma kutusuna sarılı', svg4.startsWith('<div class="piyanoKaydir">'));
  bak('iki oktav kaydırma kutusuna SARILMIYOR', !kap.piyanoCiz().includes('piyanoKaydir'));
}

console.log('12) 8. seviyenin her sorusu: dizekteki nota = klavyedeki doğru tuş');
{
  /* Havuz aralıklarını kaynaktan oku, elle yazma: dosya değişirse sınama da görsün */
  const r8 = sayfa.slice(sayfa.indexOf("{id:'r8'"), sayfa.indexOf("{ id:'harita'"));
  const fa  = r8.match(/length:(\d+)\},\(_,i\)=>\['fa',\s*(\d+)\+i\]/);
  const sol = r8.match(/length:(\d+)\},\(_,i\)=>\['sol',\s*(\d+)\+i\]/);
  bak('havuzda fa aralığı var', !!fa);
  bak('havuzda sol aralığı var', !!sol);
  const havuz = [
    ...Array.from({ length: +fa[1] }, (_, i) => ['fa', +fa[2] + i]),
    ...Array.from({ length: +sol[1] }, (_, i) => ['sol', +sol[2] + i])];
  bak('fa Do2–Do4', bilimsel(+fa[2]) === 'C2' && bilimsel(+fa[2] + +fa[1] - 1) === 'C4',
      [bilimsel(+fa[2]), bilimsel(+fa[2] + +fa[1] - 1)]);
  bak('sol Do4–Si5', bilimsel(+sol[2]) === 'C4' && bilimsel(+sol[2] + +sol[1] - 1) === 'B5',
      [bilimsel(+sol[2]), bilimsel(+sol[2] + +sol[1] - 1)]);
  bak('orta Do iki anahtarda da soruluyor',
      havuz.some(([a, s]) => a === 'fa' && s === 28) && havuz.some(([a, s]) => a === 'sol' && s === 28));
  const tekil = new Set(havuz.map(([a, s]) => a + s));
  bak('tekil anahtar+adım: tekrar yok', tekil.size === havuz.length, { tekil: tekil.size, havuz: havuz.length });

  const klavye = kap.piyanoCiz(null, true, { bas: 14, oktav: 4, ortaDo: true });
  const tuslar = new Set([...klavye.matchAll(/data-p="(b\d+)"/g)].map(m => m[1]));
  for (const [a, st] of havuz) {
    bak(`${a} ${bilimsel(st)}: klavyede b${st} var`, tuslar.has('b' + st));
    /* dizekteki nota başının konumu o adımın standart konumu */
    const y = notaY(kap.dizekCiz(a, st));
    bak(`${a} ${bilimsel(st)}: dizekte doğru yerde`,
        Math.abs(y - (ALT_Y - (st - kap.TABAN[a]) * (ARALIK / 2))) < 0.01, y);
  }
  console.log(`   ${havuz.length} soru (fa ${fa[1]} + sol ${sol[1]})`);
}

console.log('13) Bütün simgeler Windows yazı tipinde görünür (boş kare yok)');
{
  /* U+1FA70–1FAFF (Symbols & Pictographs Ext-A) Unicode 12–15 ile geldi.
     Bu makinedeki Segoe UI Emoji'de tuvale çizilip ölçüldü: 🪗 🪢 🫀 🪶 🪞 🫁
     boş kare çıkıyordu. Yalnız simge ALANLARINA bakılıyor, yorumlara değil. */
  const alanlar = [...sayfa.matchAll(/(emoji|simge|sen|hayalet|hedef):'([^']+)'/g)];
  const riskli = alanlar.filter(([, , v]) => [...v].some(ch => {
    const cp = ch.codePointAt(0); return cp >= 0x1FA70 && cp <= 0x1FAFF; }));
  bak(`${alanlar.length} simge alanında riskli simge yok`, riskli.length === 0,
      riskli.map(([, a, v]) => a + ':' + v));
  bak('8. seviyede 🪗 kalmadı', !/id:'r8'[^}]*emoji:'🪗'/.test(sayfa));
}

console.log('14) Cevap boyanınca beyaz tuş siyahların üstüne taşınmıyor');
{
  const i = sayfa.indexOf('const boya=');
  const boya = sayfa.slice(i, sayfa.indexOf('};', i));
  bak('boya() beyaz tuşu taşımıyor', /contains\('beyaz'\)/.test(boya));
  const v = govde('vurgula');
  bak('vurgula() beyaz tuşu taşımıyor (eskiden de öyleydi)', /contains\('beyaz'\)/.test(v));
}

console.log('');
console.log(`geçen ${gec}, kalan ${kal}`);
console.log(kal ? 'BAŞARISIZ' : 'TAMAM — nota ve piyano altyapısı standarda uyuyor');
process.exit(kal ? 1 : 0);
