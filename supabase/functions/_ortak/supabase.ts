// Supabase'e supabase-js yerine doğrudan REST ile gidilir (panellerdeki sbCagri
// ile aynı yol): bağımlılık yok, kod Node'da da sahte fetch ile sınanabiliyor.

const IZINLI_KOKENLER = [
  'https://biyoser.com.tr',
  'https://www.biyoser.com.tr',
  'http://localhost:8901',
];

export function ortam(ad: string): string {
  const v = Deno.env.get(ad);
  if (!v) throw new Error(`${ad} tanımlı değil`);
  return v;
}

export function cors(req: Request): Record<string, string> {
  const koken = req.headers.get('Origin') ?? '';
  if (!IZINLI_KOKENLER.includes(koken)) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': koken,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function json(veri: unknown, durum: number, basliklar: Record<string, string>): Response {
  return new Response(JSON.stringify(veri), {
    status: durum,
    headers: { ...basliklar, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// Eski anon/service_role anahtarları 2026 sonunda kalkıyor. Yeni anahtarlar
// tanımlıysa (SUPABASE_*_KEYS, JSON: {"default": "sb_..."}) onlar kullanılır.
// Yeni anahtar JWT değildir: yalnız apikey başlığına konur; Authorization:
// Bearer ile gönderilirse platform "Invalid JWT" der.
// https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
function anahtar(yeni: string, eski: string): string {
  try {
    const k = JSON.parse(Deno.env.get(yeni) ?? '{}')?.default;
    if (typeof k === 'string' && k) return k;
  } catch { /* eski anahtara düş */ }
  return ortam(eski);
}

// deno-lint-ignore no-explicit-any
export type SbYanit = { ok: boolean; durum: number; veri: any };

/**
 * PostgREST / Auth çağrısı.
 * yetki verilirse (kullanıcının "Bearer <jwt>" başlığı) istek o kullanıcı
 * adına gider ve RLS + auth.uid() onun olur. Verilmezse service_role (RLS'i aşar).
 */
export async function sb(yol: string, s: {
  method?: string;
  govde?: unknown;
  yetki?: string | null;
  basliklar?: Record<string, string>;
} = {}): Promise<SbYanit> {
  const k = s.yetki
    ? anahtar('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY')
    : anahtar('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
  const basliklar: Record<string, string> = { apikey: k, 'Content-Type': 'application/json', ...s.basliklar };
  if (s.yetki) basliklar.Authorization = s.yetki;
  else if (k.startsWith('eyJ')) basliklar.Authorization = `Bearer ${k}`;   // eski service_role JWT
  const r = await fetch(ortam('SUPABASE_URL') + yol, {
    method: s.method ?? 'POST',
    headers: basliklar,
    body: s.govde === undefined ? undefined : JSON.stringify(s.govde),
    signal: AbortSignal.timeout(10_000),
  });
  const metin = await r.text();
  let veri = null;
  try { veri = metin ? JSON.parse(metin) : null; } catch { /* JSON değil */ }
  return { ok: r.ok, durum: r.status, veri };
}

export const rpc = (ad: string, args: Record<string, unknown>, yetki?: string | null) =>
  sb(`/rest/v1/rpc/${ad}`, { govde: args, yetki });

/** JWT'yi Auth sunucusuna doğrulatır (supabase.auth.getUser ile aynı uç); geçerliyse kullanıcı id. */
export async function kullanici(yetki: string | null): Promise<string | null> {
  if (!yetki?.startsWith('Bearer ')) return null;
  const r = await sb('/auth/v1/user', { method: 'GET', yetki });
  return r.ok && typeof r.veri?.id === 'string' ? r.veri.id : null;
}

/** Satırı yalnız hâlâ "bekliyor"sa günceller (service_role). */
export function odemeGuncelle(id: string, alanlar: Record<string, unknown>): Promise<SbYanit> {
  return sb(`/rest/v1/odemeler?id=eq.${id}&durum=eq.bekliyor`, {
    method: 'PATCH', govde: alanlar, basliklar: { Prefer: 'return=minimal' },
  });
}
