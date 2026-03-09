# Rethink Your IT - Form Handler

A Cloudflare Worker that processes form submissions from rethinkyourit.co.nz and sends them via email using Resend.

## How it works
1. Receives a `POST` request from the website forms (Health Check and Contact).
2. Parses the `FormData`.
3. Formats the data into a plain-text email.
4. Dispatches the email via the Resend API to paul@rethinkyourit.co.nz.
5. Returns a JSON success response.

## Deployment
This worker is connected to GitHub. Any push to the `main` branch automatically deploys to Cloudflare via the integrated build pipeline.

## Configuration
- **Worker URL:** `https://api.rethinkyourit.co.nz`
- **Email Service:** [Resend](https://resend.com) — requires an API key and verified domain.
- **Sender address:** `no-reply@forms.rethinkyourit.co.nz`

## Resend Setup (one-time)
1. Create an account at [resend.com](https://resend.com).
2. Go to **Domains → Add Domain** → enter `forms.rethinkyourit.co.nz` → add the DNS records provided.
3. Go to **API Keys → Create API Key** → copy the key.
4. In Cloudflare Workers: **Settings → Variables → Add encrypted secret** named `RESEND_API_KEY`.

## Optional: Dynamic email subject
Forms can include a hidden field `form-type` to customise the email subject line:
```html
<input type="hidden" name="form-type" value="Health Check">
```
This produces the subject: `New Health Check Submission`.
