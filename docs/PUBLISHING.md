# Publisher onboarding — VS Code Marketplace

This is a one-time setup so you can run `vsce publish` and ship updates from CI.

## 1. Microsoft / Azure DevOps account

You need a Microsoft account (any @outlook / @live / @hotmail / Gmail-linked-MS account works).

1. Go to https://dev.azure.com → sign in.
2. If prompted, create your default Azure DevOps organization. The org name doesn't matter — pick anything (e.g. `matil-dev`). It's only used to host the Personal Access Token (PAT).

## 2. Create a Personal Access Token (PAT)

1. In Azure DevOps, click your avatar → **Personal access tokens**.
2. **+ New Token**.
3. Name: `vsce-publish`.
4. Organization: **All accessible organizations**. (This is critical — if you scope to one org, vsce will fail.)
5. Expiration: 1 year (max).
6. Scopes: click **Custom defined**, then under **Marketplace**, check **Manage**.
7. **Create**. Copy the token immediately — it's shown only once.

Save it locally (e.g. password manager) as `VSCE_PAT`.

## 3. Create the publisher

```sh
npx vsce login matil
# Pastes PAT when prompted
```

Or via the web UI: https://marketplace.visualstudio.com/manage → **Create publisher**.

- Publisher ID: `matil` (must match `package.json#publisher`)
- Display name: e.g. `matil` or your real name
- Email: a real one — they may email about policy issues

## 4. Verify domain (optional but boosts trust)

In the publisher management UI: **Verify a domain** → add `devtools360.xyz` → add the TXT record they give you to Cloudflare DNS for `devtools360.xyz` → click verify.

After verification, the marketplace listing shows a checkmark badge next to your publisher name.

## 5. Test publish (don't actually push yet)

```sh
cd ai-rules-manager
npm install
npm run compile
npx vsce package          # creates .vsix locally
npx vsce publish --dry-run  # validates manifest without uploading
```

If the dry-run is clean → you're ready.

## 6. Real publish

```sh
npx vsce publish
# OR for a specific version bump:
npx vsce publish patch    # 0.1.0 → 0.1.1
npx vsce publish minor    # 0.1.0 → 0.2.0
```

The extension will appear at:
https://marketplace.visualstudio.com/items?itemName=matil.ai-rules-manager

It can take 5–15 min for first listing. Updates appear within ~1 min.

## 7. Automate publishing via GitHub Actions

Add `VSCE_PAT` as a repo secret:
https://github.com/matil/ai-rules-manager/settings/secrets/actions

Then create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install && npm run compile
      - run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
```

Now `git tag v0.1.1 && git push --tags` ships an update.

## Troubleshooting

- **"Publisher 'matil' not found"** → publisher not created or PAT scoped wrong. Re-do step 2 with **All accessible organizations**.
- **"Missing publisher name"** → check `package.json#publisher` matches your publisher ID exactly.
- **"Icon not found"** → ensure `media/icon.png` is included (not in `.vscodeignore`).
- **Listing shows but no install button** → marketplace approval can take 30 min on first publish. Wait it out.
