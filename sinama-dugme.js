/* Yonetim panelindeki uc dugmenin onclick ozniteligi gercekten calisiyor mu.
   Kod kopyalanmiyor: onclick ifadeleri kocluk-sunucu.html'den CIKARILIP
   burada calistiriliyor.   node sinama-dugme.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const KOK = process.env.KOK || 'C:/Users/Eser AKKABA/Desktop/Biyoser code';
const sayfa = fs.readFileSync(path.join(KOK, 'kocluk-sunucu.html'), 'utf8');

/* Panelin kendi esc'i, dosyadan cikariliyor. */
const escSatir = sayfa.split('\n').find(l => l.startsWith('const esc='));
assert.ok(escSatir, 'esc tanimi bulunamadi');
const esc = eval('(' + escSatir.replace(/^const esc=/, '').replace(/;\s*$/, '') + ')');

/* Denenecek onclick ifadeleri: dosyadaki satirlardan ${...} icerigi cekiliyor. */
function onclickIfadesi(imza) {
  const satir = sayfa.split('\n').find(l => l.includes('onclick="') && l.includes(imza));
  assert.ok(satir, imza + ' iceren onclick satiri yok');
  const bas = satir.indexOf('onclick="') + 'onclick="'.length;
  const son = satir.indexOf('">', bas);
  return satir.slice(bas, son);
}

/* Tarayici taklidi: oznitelik ilk cift tirnakta biter, sonra varlik kodlari cozulur. */
const oznitelikKes = h => { const i = h.indexOf('"'); return i === -1 ? h : h.slice(0, i); };
const varlikCoz = s => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const zorAd = 'O\'Brien "lakapli" & Ort<ak>';
const k = { id: 'abc-123', ad: zorAd, eposta: 'ali@x.com', ogrenci: 9, engelli: false };
const o = { id: 'def-456', eposta: 'ogrenci+etiket@hotmail.com' };
const SB = { uid: 'baskasi' };

let kal = 0;
function bak(ad, kosul, ek) {
  if (kosul) { console.log('  [gecti] ' + ad); return; }
  kal++; console.log('  [KALDI] ' + ad + (ek !== undefined ? '  -> ' + JSON.stringify(ek) : ''));
}

function dene(ad, sablon, kap, beklenenFn, beklenenArgs) {
  /* sablon, dosyadan gelen ${...}'li metin; panelin degiskenleriyle uretiliyor */
  const uretilen = new Function('esc', 'k', 'o', 'SB', 'return `' + sablon + '`;')(esc, k, o, SB);
  const tarayicininGordugu = varlikCoz(oznitelikKes(uretilen));

  bak(ad + ': oznitelik erken kapanmiyor', tarayicininGordugu === varlikCoz(uretilen), tarayicininGordugu);

  let ayristi = true, yakalanan = null;
  try {
    new Function(beklenenFn, tarayicininGordugu)((...a) => { yakalanan = a; });
  } catch (e) { ayristi = false; }
  bak(ad + ': gecerli JS', ayristi, tarayicininGordugu);
  if (ayristi) {
    bak(ad + ': dogru degerler', JSON.stringify(yakalanan) === JSON.stringify(beklenenArgs),
        { gelen: yakalanan, beklenen: beklenenArgs });
  }
}

console.log('1) engelle dugmesi');
dene('engelle', onclickIfadesi('kocEngelKaldir'), null, 'kocEngelle', [k.id, k.ad, k.eposta]);

console.log('2) sil dugmesi');
dene('sil', onclickIfadesi('kocHesapSil'), null, 'kocHesapSil', [k.id, k.ad, k.eposta, k.ogrenci]);

console.log('3) elle onayla dugmesi');
dene('onayla', onclickIfadesi('epostaOnayla'), null, 'epostaOnayla', [o.id, o.eposta]);

console.log('');
console.log(kal ? ('BASARISIZ — ' + kal + ' denetim kaldi') : 'TAMAM — uc dugme de gecerli onclick uretiyor');
process.exit(kal ? 1 : 0);
