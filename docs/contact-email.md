# Contact API configuration

The production portfolio contact form sends messages from the browser to
`https://joefolio-backend.onrender.com/api/v1/contact`. The shared Axios instance in
`src/lib/api/client.ts` reads `VITE_API_BASE_URL`, defaults to the deployed Render URL when absent,
and removes trailing slashes. It uses JSON headers, a 30-second timeout, and no cross-origin
credentials. Services share this instance; the optional assistant uses its own per-request base
URL without changing the contact client's defaults.

The [contact service](../src/features/contact/services/contact-api.ts) owns the payload mapping
and response validation. The [transmission hook](../src/features/contact/hooks/useContactTransmission.ts)
owns pending/flight/success/error state, while the form retains field validation and entered values.

## Environment configuration

Use the public backend target in the ignored `.env.local` file and Vercel's Production/Preview build
environment:

```text
VITE_API_BASE_URL=https://joefolio-backend.onrender.com
```

During `npm run dev`, the client uses the same-origin `/backend` prefix. Vite forwards it to
`VITE_API_BASE_URL`, stripping the prefix. This development-only proxy fixes local browser CORS
without changing production permissions, sending credentials or adding a deployed proxy.
The proxy changes the upstream Host and drops the browser Origin on its server-to-server request;
production builds retain direct browser requests and the backend's explicit CORS checks.
The default target remains the Render service; a local backend can be configured explicitly.
Restart Vite after editing local environment configuration; Vercel environment changes require a new build.
`npm run preview` serves the production build and therefore still calls Render directly; it does not
use the development proxy and requires its own explicitly allowed origin for real API browser checks.
Leave `VITE_AI_ASSISTANT_API_URL` empty until the separately configured assistant implements its
documented contract.

The deployed backend must allow browser requests from the production portfolio origin through its
CORS configuration. Vite variables are public browser configuration;
never put credentials or private backend settings in them.

Keep production allowed origins explicit, using the backend's supported configuration
(`CORS_ALLOWED_ORIGINS` in the existing deployment guide):

```text
https://juyel.vercel.app
```

Allow POST requests and the `Content-Type` header in preflight responses. Local origins
`http://localhost:5173` and `http://127.0.0.1:5173` may be allowed in the backend's development
profile if calling it directly; neither is needed for Vite's same-origin proxy. Do not use wildcard
origins or a production-wide localhost exception just to fix development. Add deployed preview origins
explicitly when needed. This repository contains no backend implementation or deployment credentials,
so no remote CORS policy was changed.

Application startup also sends `GET /actuator/health` to the same host to initiate Render's cold
start. Allow GET and the `Cache-Control` header as well as the shared client's `Content-Type`
header for that endpoint's preflight. The endpoint must be accessible without credentials and
return HTTP 200 with `{ "status": "UP" }` when healthy. Startup failures are silent to visitors;
contact submissions still run independently and keep their existing timeout and error handling.

Health preflight verification repeated on November 3, 2026 returned HTTP 200 for each of
`http://localhost:5173`, `http://127.0.0.1:5173`, and `https://juyel.vercel.app`, but omitted
`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers`.
That is not a successful browser CORS preflight. Ensure the backend CORS/security configuration
covers `/actuator/health`, not just `/api/**`; an allowed-origin environment variable alone may
not enable CORS on Actuator endpoints. No backend configuration was changed in this frontend task.

On the same audit, `/api/v1/contact` preflights correctly returned the requesting allowed origin,
`POST,OPTIONS` and `content-type` for both standard local origins and production. An unrelated
`https://untrusted.invalid` origin returned 403. Contact CORS and health CORS are separate findings:
the health failure is not proof that production message submissions fail. No live POST was sent.

The retired Vercel contact function is no longer used. Any environment settings that existed only
for that function can be removed manually after verifying the new production contact flow; this
change does not alter Vercel dashboard settings.

## Request contract

The form keeps the UI model's `message` property, and the contact service maps it to the backend's
`body` property. It posts JSON with `name`, `email`, `subject`, `body`, and the empty `website`
honeypot field. The backend accepts a message only with HTTP `202 Accepted` and a non-empty
`message` response. The form does not animate or clear its fields before that contract succeeds.

The frontend validates the required fields and limits the name to 80 characters. Existing subject
and message limits remain 120 and 4,000 characters, respectively, within the backend's larger
limits. The backend's honeypot and five-requests-per-client-IP-per-ten-minutes rate limit remain
authoritative. HTTP 429 responses are shown as a useful wait-and-retry message.

Network and server errors are normalized to user-safe messages. Internal server details and
provider errors are not displayed. Failed submissions retain the user's entered values; retrying
is explicit, and the client does not automatically retry POST requests.

## Local checks

`npm run dev` submits to `/backend/api/v1/contact` through Vite. Verify the proxy non-destructively
with `GET /backend/actuator/health`, not a real message. Automated tests use the
shared Axios client with a mocked adapter and never send a real contact request.

On managed Windows systems where Node does not trust the organization's certificate chain, use
Node's `NODE_USE_SYSTEM_CA=1` environment setting (Node 24+) to include the OS trust store.
Do not disable TLS verification or set `secure: false` on the proxy.
