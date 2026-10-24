# Juyel Hushen — Cosmic Portfolio

React + Vite + TypeScript starter for the planned cosmic engineering portfolio.

## Included

- Responsive cosmic hero and navigation
- Canvas starfield with occasional shooting stars
- CSS-rendered planet/orbit layers
- Evidence-backed project cards linked to public repositories
- Engineering introduction, professional experience timeline, and project-backed skills
- AI Lab and contact sections with verified GitHub and LinkedIn destinations
- AI Lab case studies grounded in the public Sentinel and Enterprise Knowledge Assistant documentation
- Portfolio assistant interface with an optional, typed `/api/chat` integration boundary
- Keyboard-accessible mobile navigation and a skip-to-content link
- Reduced-motion support for the starfield and page entrance effects
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

Production build:

```bash
npm run build
```

## Project content notes

Project descriptions and technology lists are based on the linked public repositories. The showcase does not claim unverified outcomes or personal contributions. Corban is not included because the available legacy portfolio copy does not provide a project repository or a verified technical stack. No résumé asset or verified email address is currently included.

No verified employment history or résumé is available in this repository, so the experience timeline remains empty until role, employer, dates, and contributions are confirmed. Skills are grouped from technologies documented in the linked projects; they are not proficiency ratings or claims about employment.

## Follow-up work

- Build and deploy a backend that implements the documented chat contract, portfolio grounding,
  and server-side safety and access controls; none is included in this frontend
- Confirm Corban details and a public project destination
- Replace the CSS project visuals with verified screenshots or diagrams when available
- Add verified employment history, a current résumé, and a direct contact email
