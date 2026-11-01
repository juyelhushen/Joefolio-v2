# Contact API configuration

The portfolio contact form sends messages from the browser to
`https://joefolio-backend.onrender.com/api/v1/contact`. The shared Axios instance in
`src/lib/api/client.ts` reads `VITE_API_BASE_URL`, defaults to the deployed Render URL when absent,
and removes trailing slashes. It uses JSON headers, a 30-second timeout, and no cross-origin
credentials. Services share this instance; the optional assistant uses its own per-request base
URL without changing the contact client's defaults.

## Environment configuration

Use the same public value in the ignored `.env.local` file and Vercel's Production/Preview build
environment:

```text
VITE_API_BASE_URL=https://joefolio-backend.onrender.com
```

Do not point this configuration at a local Spring Boot server or add a Vite proxy. Restart Vite
after editing local environment configuration; Vercel environment changes require a new build.
Leave `VITE_AI_ASSISTANT_API_URL` empty until the separately configured assistant implements its
documented contract.

The deployed backend must allow browser requests from both the production portfolio origin and the
local Vite origin through its CORS configuration. Vite variables are public browser configuration;
never put credentials or private backend settings in them.

Configure `CORS_ALLOWED_ORIGINS` on Render to include the actual browser origins:

```text
https://juyel.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

Allow POST requests and the `Content-Type` header in preflight responses. Add other preview or
production origins explicitly when needed. This frontend change does not alter backend settings.

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

`npm run dev` submits to the configured API URL directly from the browser. Ensure the backend CORS
policy allows the local Vite origin (normally `http://localhost:5173`). Automated tests use the
shared Axios client with a mocked adapter and never send a real contact request.
