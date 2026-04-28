# License server

Cloudflare Worker that:
- Receives Lemon Squeezy webhooks → stores license keys in KV.
- Exposes `/verify` for the extension to revalidate keys (optional online check).
- Exposes `/sync/push` and `/sync/pull` for Pro cloud sync.

## Setup (one-time)

```sh
cd license-server
npm install

# Create KV namespace (note the ID, paste into wrangler.toml)
npx wrangler kv namespace create LICENSES

# Set secrets
npx wrangler secret put LS_WEBHOOK_SECRET   # from Lemon Squeezy webhook config
npx wrangler secret put JWT_SECRET           # any 32+ char random string

# Deploy
npx wrangler deploy
```

## Wire up DNS

1. In Cloudflare for `devtools360.xyz`, add CNAME `api → ai-rules-license-server.<your-subdomain>.workers.dev` (orange-cloud proxied).
2. Or, add a route in `wrangler.toml`:
   ```toml
   [[routes]]
   pattern = "api.devtools360.xyz/ai-rules/*"
   zone_name = "devtools360.xyz"
   ```
   then redeploy.

## Wire up Lemon Squeezy

In Lemon Squeezy → Settings → Webhooks:
- URL: `https://api.devtools360.xyz/ai-rules/lemonsqueezy-webhook`
- Events: `license_key_created`, `license_key_updated`
- Copy the signing secret → `wrangler secret put LS_WEBHOOK_SECRET`.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai-rules/lemonsqueezy-webhook` | HMAC sig | Receive purchase events |
| POST | `/ai-rules/verify` | none | `{ key }` → `{ valid, tier }` |
| POST | `/ai-rules/sync/push` | Bearer key | Save user's rule files |
| GET  | `/ai-rules/sync/pull` | Bearer key | Retrieve user's rule files |

## Local dev

```sh
npx wrangler dev
# Hit endpoints at http://localhost:8787/ai-rules/...
```

## Cost

Cloudflare Workers free tier: 100k req/day, 10ms CPU.
Cloudflare KV free tier: 1k writes/day, 100k reads/day.

For the first ~10k Pro users, this stays free.
