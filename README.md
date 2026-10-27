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

The contact form's Vercel Function is not available through plain Vite development. Configure the
server-only variables described in [the contact email setup guide](./docs/contact-email.md), then
run `npx vercel dev --listen 3000` to test the app and `/api/contact` together. Do not configure a
real Resend key unless you intend to send a real email.

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
