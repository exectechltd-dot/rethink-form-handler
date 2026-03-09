# Rethink Your IT - Form Handler

A Cloudflare Worker that processes form submissions from rethinkyourit.co.nz and sends them via email using MailChannels.

## How it works
1. Receives a `POST` request from the website forms (Health Check and Contact).
2. Parses the `FormData`.
3. Formats the data into a plain-text email.
4. Dispatches the email via the MailChannels API to paul@rethinkyourit.co.nz.
5. Redirects the user to the `/thanks.html` page on success.

## Deployment
This worker is connected to GitHub. Any push to the `main` branch automatically deploys to Cloudflare via the integrated build pipeline.

## Configuration
- **Worker URL:** `https://rethink-form-handler.paul.workers.dev` (Update this if changed)
- **Email Service:** MailChannels (No API key required when running on Cloudflare Workers).
- **DNS Requirement:** Requires a TXT record `_mailchannels.rethinkyourit.co.nz` for SPF/DKIM alignment.
