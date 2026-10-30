# Contact API configuration

The portfolio contact form sends messages from the browser to the Spring Boot API at
`POST /api/v1/contact`. The shared Axios client in `src/lib/api/client.ts` reads its base URL from
`VITE_API_BASE_URL`, falling back to `https://joefolio-backend.onrender.com`.

## Environment configuration

Set `VITE_API_BASE_URL` in the Vercel project's **Settings → Environment Variables** for Production
and any Preview or Development environments where the form should work:

```text
VITE_API_BASE_URL=https://joefolio-backend.onrender.com
```

Vite embeds `VITE_` values in browser assets, so this URL is public configuration. Never put
credentials or private backend settings in a Vite variable. The backend URL must
allow browser requests from the deployed portfolio origin through its CORS configuration.

For local development, add the following to the ignored `.env.local` file when the Spring Boot
backend is running locally:

```text
VITE_API_BASE_URL=http://localhost:8082
```

The same value can be used as a temporary override when testing against the deployed API:

```text
VITE_API_BASE_URL=https://joefolio-backend.onrender.com
```

Restart Vite after changing environment variables. A production environment-variable change takes
effect in the next Vercel build/deployment; do not assume an already-built deployment has picked
up the new value.

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
