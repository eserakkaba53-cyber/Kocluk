/* node dogrulama-sinama.js
   dogrulama.js'i ağa çıkmadan sınar: jeton yalnız giriş/kayıt/sıfırlama
   isteklerine eklenir, captcha hatası Türkçeleşir; iki adımlı giriş kodu
   yalnız doğrulanmış faktörde ve aal1 oturumda sorar. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const giden = [];
let faktorlu = false, kodlar = [];
const yanit = (govde, durum) => Promise.resolve(new Response(JSON.stringify(govde), { status: durum || 200 }));
const ctx = {
  location: { protocol: 'https:', hostname: 'biyoser.com.tr' },
  document: { head: { appendChild() {} }, body: { appendChild() {} },
              createElement: () => ({ style: {}, remove() {} }) },
  turnstile: { render: (kutu, o) => { setTimeout(() => o.callback('JETON'), 0); return 1; }, remove() {} },
  prompt: () => kodlar.shift(),
  Response, Promise, JSON, Object, String, Error, setTimeout, atob,
  fetch: (u, a) => {
    u = String(u); giden.push([u, a && a.body]);
    if (/\/auth\/v1\/user$/.test(u)) return yanit({ factors: faktorlu ? [{ id: 'F1', factor_type: 'totp', status: 'verified' }] : [] });
    if (/challenge$/.test(u)) return yanit({ id: 'C1' });
    if (/verify$/.test(u)) return JSON.parse(a.body).code === '123456'
      ? yanit({ access_token: 'aal2-oturum' }) : yanit({ msg: 'Invalid TOTP code entered' }, 422);
    if (/signup/.test(u)) return yanit({ msg: 'captcha protection: request disallowed' }, 400);
    return yanit({});
  }
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/dogrulama.js', 'utf8'), ctx);
const jwt = aal => 'x.' + Buffer.from(JSON.stringify({ aal })).toString('base64url') + '.y';

(async () => {
  const U = 'https://x.supabase.co';
  /* captcha jetonu */
  await ctx.fetch(U + '/auth/v1/token?grant_type=password', { method: 'POST', body: '{"email":"a"}' });
  await ctx.fetch(U + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: '{"refresh_token":"r"}' });
  await ctx.fetch(U + '/rest/v1/koclar', {});
  const r = await ctx.fetch(U + '/auth/v1/signup?redirect_to=x', { method: 'POST', body: '{"email":"a"}' });
  assert.deepStrictEqual(JSON.parse(giden[0][1]).gotrue_meta_security, { captcha_token: 'JETON' });
  assert.strictEqual(giden[1][1], '{"refresh_token":"r"}');
  assert.strictEqual(giden[2][1], undefined);
  assert.deepStrictEqual(JSON.parse(giden[3][1]).gotrue_meta_security, { captcha_token: 'JETON' });
  assert.match((await r.json()).msg, /Bot doğrulaması/);

  /* iki adımlı giriş */
  giden.length = 0;
  assert.strictEqual(await ctx.ikiAdimTamamla(U, 'k', jwt('aal2')), null);
  assert.strictEqual(giden.length, 0, 'aal2 oturumda sunucuya sorulmaz');
  assert.strictEqual(await ctx.ikiAdimTamamla(U, 'k', jwt('aal1')), null, 'faktör yoksa kod sorulmaz');
  faktorlu = true; kodlar = ['000000', '123 456'];
  assert.deepStrictEqual(await ctx.ikiAdimTamamla(U, 'k', jwt('aal1')), { access_token: 'aal2-oturum' });
  kodlar = [null];
  await assert.rejects(ctx.ikiAdimTamamla(U, 'k', jwt('aal1')), /tamamlanmadı/);
  console.log('dogrulama.js: 9 denetim geçti');
})().catch(e => { console.error(e); process.exit(1); });
