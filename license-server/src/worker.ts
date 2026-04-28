/**
 * AI Rules Manager — License Server (Cloudflare Worker)
 *
 * Deploy:
 *   npm install
 *   wrangler kv namespace create LICENSES
 *   # paste namespace ID into wrangler.toml
 *   wrangler secret put LS_WEBHOOK_SECRET
 *   wrangler secret put JWT_SECRET
 *   wrangler deploy
 *
 * Custom domain: route api.devtools360.xyz/ai-rules/* to this Worker.
 */

interface Env {
  LS_WEBHOOK_SECRET: string;
  JWT_SECRET: string;
  LICENSES: KVNamespace;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization, x-signature'
    };
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    try {
      if (url.pathname === '/ai-rules/lemonsqueezy-webhook' && req.method === 'POST') {
        return withCors(await handleWebhook(req, env), cors);
      }
      if (url.pathname === '/ai-rules/verify' && req.method === 'POST') {
        return withCors(await handleVerify(req, env), cors);
      }
      if (url.pathname === '/ai-rules/sync/push' && req.method === 'POST') {
        return withCors(await handlePush(req, env), cors);
      }
      if (url.pathname === '/ai-rules/sync/pull' && req.method === 'GET') {
        return withCors(await handlePull(req, env), cors);
      }
      return withCors(new Response('Not found', { status: 404 }), cors);
    } catch (err: any) {
      return withCors(new Response(`Error: ${err.message}`, { status: 500 }), cors);
    }
  }
};

function withCors(res: Response, cors: Record<string, string>): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(cors)) {
    headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, headers });
}

// ---------- Webhook ----------

async function handleWebhook(req: Request, env: Env): Promise<Response> {
  const body = await req.text();
  const signature = req.headers.get('x-signature') || '';

  if (!(await verifyHmac(body, signature, env.LS_WEBHOOK_SECRET))) {
    return new Response('bad signature', { status: 401 });
  }

  const event: any = JSON.parse(body);
  const eventName = event.meta?.event_name;

  if (eventName === 'license_key_created') {
    const key: string = event.data.attributes.key;
    const email: string = event.data.attributes.user_email || '';
    const productName: string = event.data.attributes.product_name || '';
    const tier = productName.toLowerCase().includes('team') ? 'team' : 'pro';

    const record = {
      key,
      email,
      tier,
      created: Date.now(),
      revoked: false
    };
    await env.LICENSES.put(key, JSON.stringify(record));
  }

  if (eventName === 'license_key_updated') {
    const key: string = event.data.attributes.key;
    const status: string = event.data.attributes.status;
    const existing = await env.LICENSES.get(key);
    if (existing) {
      const record = JSON.parse(existing);
      record.revoked = status !== 'active';
      await env.LICENSES.put(key, JSON.stringify(record));
    }
  }

  return new Response('ok');
}

// ---------- Verify ----------

async function handleVerify(req: Request, env: Env): Promise<Response> {
  const { key } = (await req.json()) as { key: string };
  if (!key) {
    return jsonResponse({ valid: false, reason: 'no key' }, 400);
  }
  const data = await env.LICENSES.get(key);
  if (!data) {
    return jsonResponse({ valid: false, reason: 'unknown' });
  }
  const record = JSON.parse(data);
  if (record.revoked) {
    return jsonResponse({ valid: false, reason: 'revoked' });
  }
  return jsonResponse({
    valid: true,
    tier: record.tier,
    email_hash: await hashEmail(record.email)
  });
}

// ---------- Cloud sync ----------

async function authLicense(req: Request, env: Env): Promise<{ key: string; tier: string } | null> {
  const auth = req.headers.get('authorization') || '';
  const key = auth.replace(/^Bearer\s+/i, '').trim();
  if (!key) {
    return null;
  }
  const data = await env.LICENSES.get(key);
  if (!data) {
    return null;
  }
  const record = JSON.parse(data);
  if (record.revoked) {
    return null;
  }
  return { key, tier: record.tier };
}

async function handlePush(req: Request, env: Env): Promise<Response> {
  const auth = await authLicense(req, env);
  if (!auth) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  const body = (await req.json()) as { files: { path: string; content: string }[] };
  const storageKey = `sync:${auth.key}`;
  await env.LICENSES.put(storageKey, JSON.stringify({ files: body.files, updated: Date.now() }));
  return jsonResponse({ ok: true, count: body.files.length });
}

async function handlePull(req: Request, env: Env): Promise<Response> {
  const auth = await authLicense(req, env);
  if (!auth) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  const data = await env.LICENSES.get(`sync:${auth.key}`);
  if (!data) {
    return jsonResponse({ files: [] });
  }
  return new Response(data, { headers: { 'content-type': 'application/json' } });
}

// ---------- Helpers ----------

function jsonResponse(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

async function verifyHmac(body: string, sig: string, secret: string): Promise<boolean> {
  if (!sig) {
    return false;
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const expectedHex = [...new Uint8Array(expected)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return timingSafeEqual(expectedHex, sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}

async function hashEmail(email: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.toLowerCase()));
  return [...new Uint8Array(buf)]
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
