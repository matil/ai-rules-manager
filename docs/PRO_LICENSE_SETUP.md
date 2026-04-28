# Pro license setup — Lemon Squeezy + license server

Goal: customer pays $9 → gets `AIRM-PRO-xxxxxxxx` license key in their inbox → activates inside the extension → unlocks Pro features.

## Architecture

```
User                                 Lemon Squeezy
 │ ─── checkout ──────────────────▶  │
 │                                   │ ─── webhook ─────▶  License Server (Cloudflare Worker)
 │                                   │                       │
 │ ◀──── email with key ─────────────┤ ◀── email key ───── │
 │                                                           │
 │  paste key into VS Code                                   │
 │  ┌─────────────────────────────┐                          │
 │  │ activate ▶ verify (offline) │                          │
 │  └─────────────────────────────┘                          │
 │                                                           │
 │  optional: revalidate every 30 days ─────────────────────▶│ /verify endpoint
```

## 1. Create Lemon Squeezy product

1. Sign up at https://lemonsqueezy.com (no credit card needed).
2. Create a store → name: `DevToolKit`.
3. **Products → New product**:
   - Name: `AI Rules Manager Pro`
   - Type: **Single payment** (not subscription, for v0.1)
   - Price: $9 USD
   - Description: paste from `marketplace-listing.md` (see this repo)
   - License keys: **enabled**, length 24, prefix `AIRM-PRO-`
4. Note the **Variant ID** and **Store ID** from the product URL.

## 2. Create webhook

In Lemon Squeezy:
- **Settings → Webhooks → +**
- URL: `https://api.devtools360.xyz/ai-rules/lemonsqueezy-webhook`
- Events: `order_created`, `license_key_created`, `license_key_updated`
- Generate a signing secret and save it as `LS_WEBHOOK_SECRET`.

## 3. License server (Cloudflare Worker)

Minimal Worker — verify webhook, sign JWT keys, expose verify endpoint:

```ts
// worker.ts
import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

interface Env {
  LS_WEBHOOK_SECRET: string;
  JWT_SECRET: string;
  LICENSES: KVNamespace;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/ai-rules/lemonsqueezy-webhook' && req.method === 'POST') {
      return handleWebhook(req, env);
    }
    if (url.pathname === '/ai-rules/verify' && req.method === 'POST') {
      return handleVerify(req, env);
    }
    return new Response('Not found', { status: 404 });
  }
};

async function handleWebhook(req: Request, env: Env): Promise<Response> {
  const body = await req.text();
  const signature = req.headers.get('x-signature') || '';

  // Verify HMAC-SHA256 signature
  const valid = await verifyHmac(body, signature, env.LS_WEBHOOK_SECRET);
  if (!valid) return new Response('bad sig', { status: 401 });

  const event = JSON.parse(body);
  const eventName = event.meta?.event_name;

  if (eventName === 'license_key_created') {
    const key = event.data.attributes.key; // e.g. AIRM-PRO-XXXX
    const email = event.data.attributes.user_email;

    // Sign offline JWT for the extension
    const jwt = await sign(
      { tier: 'pro', email_hash: await hashEmail(email), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 5 },
      env.JWT_SECRET
    );

    // Store mapping
    await env.LICENSES.put(key, JSON.stringify({ email, jwt, created: Date.now() }));

    // (Optional) Send the user the JWT-form key via Lemon Squeezy customer portal note.
    // For v0.1, the raw LS key is enough — we just check prefix offline.
  }

  return new Response('ok');
}

async function handleVerify(req: Request, env: Env): Promise<Response> {
  const { key } = (await req.json()) as { key: string };
  const data = await env.LICENSES.get(key);
  if (!data) return new Response(JSON.stringify({ valid: false }), { status: 200 });
  return new Response(data, { headers: { 'content-type': 'application/json' } });
}

async function verifyHmac(body: string, sig: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const expectedHex = [...new Uint8Array(expected)].map(b => b.toString(16).padStart(2, '0')).join('');
  return expectedHex === sig;
}

async function hashEmail(email: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.toLowerCase()));
  return [...new Uint8Array(buf)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## 4. Deploy

```sh
npm i -g wrangler
wrangler kv namespace create LICENSES
# Note the namespace ID, paste into wrangler.toml
wrangler secret put LS_WEBHOOK_SECRET
wrangler secret put JWT_SECRET
wrangler deploy
```

DNS: Point `api.devtools360.xyz` to the Worker via Cloudflare custom domain.

## 5. Sales page on devtools360.xyz

Create `/ai-rules-pro` with:
- Headline: "AI Rules Manager Pro — $9 once, lifetime updates"
- Bullets: Cloud sync, AI generation, history, premium templates
- "Buy" button → Lemon Squeezy checkout URL
- Below: "Already bought? Activate inside VS Code → Cmd+Shift+P → 'AI Rules: Activate Pro License'"

## 6. Funnel

```
DevToolKit (existing AdSense traffic)
     │
     ▼
/ai-rules-pro page
     │
     ▼
Lemon Squeezy checkout
     │
     ▼
Email with license key
     │
     ▼
Activate in VS Code → unlock features → recurring usage → potential upsell to Team tier
```

## Pricing ladder (later)

| Tier | Price | What you get |
|---|---|---|
| Free | $0 | Editor, sync, 9 templates, validator |
| Pro | $9 one-time | + AI gen, cloud sync, history, premium templates |
| Team | $5/seat/mo | + Shared rule library, RBAC, audit log |
| Enterprise | $custom | + SSO, SLA, on-prem cloud sync |
