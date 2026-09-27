/* node dogrulama-sinama.js
   dogrulama.js'in fetch sarmalayıcısını ağa çıkmadan sınar: jeton yalnız
   giriş/kayıt/sıfırlama isteklerine eklenir, captcha hatası Türkçeleşir. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const giden = [];
const ctx = {
  location: { protocol: 'https:', hostname: 'biyoser.com.tr' },
  document: { head: { appendChild() {} }, body: { appendChild() {} },
              createElement: () => ({ style: {}, remove() {} }) },
  turnstile: { render: (kutu, o) => { setTimeout(() => o.callback('JETON'), 0); return 1; }, remove() {} },
  Response, Promise, JSON, Object, String, Error, setTimeout,
  fetch: (u, a) => {
    giden.push([String(u), a && a.body]);
    const captcha = /signup/.test(u);
    return Promise.resolve(new Response(captcha ? '{"msg":"captcha protection: request disallowed"}' : '{}',
      { status: captcha ? 400 : 200 }));
  }
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/dogrulama.js', 'utf8'), ctx);

(async () => {
  const U = 'https://x.supabase.co';
  await ctx.fetch(U + '/auth/v1/token?grant_type=password', { method: 'POST', body: '{"email":"a"}' });
  await ctx.fetch(U + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: '{"refresh_token":"r"}' });
  await ctx.fetch(U + '/rest/v1/koclar', {});
  const r = await ctx.fetch(U + '/auth/v1/signup?redirect_to=x', { method: 'POST', body: '{"email":"a"}' });
  assert.deepStrictEqual(JSON.parse(giden[0][1]).gotrue_meta_security, { captcha_token: 'JETON' });
  assert.strictEqual(giden[1][1], '{"refresh_token":"r"}');
  assert.strictEqual(giden[2][1], undefined);
  assert.deepStrictEqual(JSON.parse(giden[3][1]).gotrue_meta_security, { captcha_token: 'JETON' });
  assert.match((await r.json()).msg, /Bot doğrulaması/);
  console.log('dogrulama.js: 5 denetim geçti');
})().catch(e => { console.error(e); process.exit(1); });
