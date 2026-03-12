# Rethink Your IT — Form Handler

A Cloudflare Worker that processes form submissions from rethinkyourit.co.nz.

## How it works

### All forms
1. Receives a `POST` request from the website.
2. Parses `FormData` (field names are Title Case: `Name`, `Email`, `Business`, `Question 1` etc.).
3. Sends a raw submission email to paul@rethinkyourit.co.nz via Resend.

### Health Check forms (AI pipeline)
After the raw email is dispatched, a background pipeline runs:
1. **Email domain check** — flags personal vs business email; uses domain as search fallback if no business name.
2. **Brave Search** — searches `{Business} New Zealand` for web context (skipped gracefully if no search term).
3. **Claude AI** (claude-haiku via direct API fetch) — generates a brief with:
   - Business Brief (2–3 sentences on the prospect)
   - Pillar Analysis (Foundations, Security, AI Ops, IT Advisory — scored 1–4)
   - Draft Customer Email (ready to send to the prospect)
4. Sends a formatted brief email to Paul.

## Deployment
Push to `main` to deploy via Cloudflare's GitHub integration.

Manual deploy: `npm run deploy` (requires `CLOUDFLARE_API_TOKEN` env var).

## Secrets required
Set via `wrangler secret put <NAME>` or Cloudflare dashboard:

| Secret | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend email API |
| `BRAVE_API_KEY` | Brave Search (Health Check pipeline) |
| `ANTHROPIC_API_KEY` | Claude AI (Health Check pipeline) |

## Configuration
- **Worker URL:** `https://api.rethinkyourit.co.nz`
- **Sender:** `no-reply@forms.rethinkyourit.co.nz`
- **Model:** `claude-haiku-4-5-20251001`
