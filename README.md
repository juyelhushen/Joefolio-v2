# Juyel Hushen — Cosmic Portfolio

React + Vite + TypeScript starter for the planned cosmic engineering portfolio.

## Included

- Responsive cosmic hero and navigation
- Canvas starfield with occasional shooting stars
- CSS-rendered planet/orbit layers
- Evidence-backed project cards linked to public repositories
- Engineering introduction, professional experience timeline, and project-backed skills
- AI Lab with documented project case studies and a contact form with server-side email delivery
- AI Lab case studies grounded in the public Sentinel and Enterprise Knowledge Assistant documentation
- Portfolio assistant interface with an optional, typed `/api/chat` integration boundary
- Keyboard-accessible mobile navigation and a skip-to-content link
- Reduced-motion support for the starfield, Earth scene, and message-flight interaction
- Local visual concept asset at `public/images/cosmic-portfolio-concept.png`

## Run locally

```bash
npm ci
npm run dev
```

The assistant is intentionally unavailable until a separate backend implements the
[assistant API contract](./docs/ai-assistant-api.md). To configure a local or deployed service,
copy `.env.example` to `.env.local` and set `VITE_AI_ASSISTANT_API_URL` to its base URL. Leave the
value empty to keep the assistant in its honest unavailable state; no sample answers are simulated.
Vite environment values are public, so never put model/provider credentials or backend secrets in
this variable.

The contact form submits to the deployed Spring Boot API from both local and production builds.
Set `VITE_API_BASE_URL=https://joefolio-backend.onrender.com` in `.env.local` and Vercel's build
environment. See the [contact API guide](./docs/contact-email.md) for details.

Opening the portfolio also initiates one silent `GET /actuator/health` warm-up through the shared
Axios client. It runs without blocking rendering, allows up to 90 seconds for a Render cold start,
and does not poll or retry automatically. The backend must allow this health endpoint and its
`Cache-Control` request header from the frontend's origin.

## Frontend architecture and development

Feature-owned components, services, hooks and data live under `src/features`. Shared UI remains
under `src/components`, and all API services use the single client under `src/lib/api`.
See the [architecture guide](./docs/architecture.md) for module boundaries, migration decisions,
styling responsibilities, test conventions and remaining technical debt.

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
```

Production build:

```bash
npm run build
```

For versioned releases and the tag-triggered draft-release workflow, see the
[release guide](./docs/releasing.md).

## Project content notes

Project descriptions and technology lists are based on the linked public repositories. The showcase does not claim unverified outcomes or personal contributions. Corban is not included because the available legacy portfolio copy does not provide a project repository or a verified technical stack. No résumé asset or verified email address is currently included.

Skills are grouped from technologies documented in the linked projects; they are not proficiency
ratings or claims about employment.

## Follow-up work

- Build and deploy a backend that implements the documented chat contract, portfolio grounding,
  and server-side safety and access controls; none is included in this frontend
- Confirm Corban details and a public project destination
- Replace the CSS project visuals with verified screenshots or diagrams when available
- Add a current résumé when a verified public asset is available
