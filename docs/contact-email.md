# Contact email delivery

The portfolio sends contact messages to `POST /api/contact`, a root-level Vercel Function.
The browser does not receive the Resend API key. The function only reports acceptance after
Resend accepts the message; the animated envelope starts after that response.

## Server environment variables

Configure these variables in the Vercel project settings for each environment that should send
email. For local function development, put them in an ignored `.env.local` file at the repository
root. Do not add secrets or a personal recipient address to `.env.example`, Vite variables, or
source control.

| Variable                  | Purpose                                                                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`          | Server-side Resend API key. Never use a `VITE_` prefix.                                                                                                                                                  |
| `CONTACT_TO_EMAIL`        | Private inbox that receives portfolio messages.                                                                                                                                                          |
| `CONTACT_FROM_EMAIL`      | Sender identity authorized for the verified Resend sending domain, for example `Portfolio <contact@your-verified-domain.example>`.                                                                       |
| `CONTACT_ALLOWED_ORIGINS` | Comma-separated exact origins, without paths or wildcards; include the production site origin and local Vercel development origin. Add a preview origin only when you intend to accept messages from it. |

The From identity must belong to a domain verified with Resend before production delivery is
enabled. The visitor's address is placed in `Reply-To`, never used as the sender. Use the Resend
dashboard to verify the domain and configure DNS; the application cannot verify domain ownership.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and an authorized `CONTACT_FROM_EMAIL` only when you
   intend to test actual delivery. Add the exact local origin to `CONTACT_ALLOWED_ORIGINS`.
3. Link the workspace to a Vercel project and run `npx vercel dev --listen 3000`. Vercel CLI serves
   the Vite app and executes `api/contact.ts`; plain `npm run dev` does not run Vercel Functions.
4. Submit a safe test message only after confirming the configured recipient is a test inbox you
   control. A configured test still sends a real email through Resend.

Automated tests inject a mocked provider at the email-sending boundary and never make a network
request to Resend. Do not add real keys to test environments.

## Request and response

`POST /api/contact` accepts JSON with required bounded `name`, `email`, `subject`, and `message`
strings plus an optional `website` honeypot. The response is `{ "accepted": true }` only after
Resend accepts the email. Configuration failures return `503`; invalid requests, origins, and
rate-limited requests return non-success responses. Provider failures return a generic `502`
without provider details.

## Abuse controls and limits

The function checks the request method, JSON content type, a 16 KiB body limit, field lengths and
email syntax, an exact origin allow-list, and an empty honeypot. It applies a five-message,
ten-minute per-address throttle using an in-memory map with bounded entries. Vercel may run
multiple or short-lived instances, so this throttle is best-effort and is not a durable or
cross-instance rate limit. For higher-volume use, replace the in-memory store with a shared
rate-limit service and consider additional abuse controls. Provider requests have an eight-second
abort timeout; a timeout is returned as a generic send failure. Vercel's `x-forwarded-for` value is
hashed before it is used as the in-memory key; raw addresses and message contents are not logged.
