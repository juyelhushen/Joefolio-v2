# Juyel Hushen — Cosmic Portfolio

React + Vite + TypeScript starter for the planned cosmic engineering portfolio.

## Included

- Responsive cosmic hero and navigation
- Canvas starfield with occasional shooting stars
- CSS-rendered planet/orbit layers
- Evidence-backed project cards linked to public repositories
- On-demand case-study architecture sequences with Replay and a static mobile/reduced-effects view
- A lazy, local-only event pipeline playground below Projects: delivery, retry backoff and dead-letter redrain
- Engineering introduction, professional experience timeline, and project-backed skills
- AI Lab with documented project case studies and a contact form with server-side email delivery
- AI Lab case studies grounded in the public Sentinel and Enterprise Knowledge Assistant documentation
- Portfolio assistant interface with an optional, typed `/api/chat` integration boundary
- Keyboard-accessible mobile navigation and a skip-to-content link
- On-demand command palette: header Search, mobile-menu Search or Ctrl/Cmd+K; sections,
  project case studies, profile links, email copy, résumé availability and effects preference
- Whole-line masked headings below the hero, with immediate mobile/reduced-effects fallbacks
- A visibility-gated Bengaluru footer clock using the Asia/Kolkata time zone
- Persisted “Reduce effects” control shared by the footer and mobile navigation; device motion
  and data-saving preferences are used as defaults
- Genuine viewport-triggered reveals, a cosmic scroll-progress beam, and a fine-pointer Artifact Scanner with localized hover magnification
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

After the browser has idle time, the portfolio initiates one silent `GET /actuator/health`
warm-up through the shared Axios client. It does not block rendering, allows up to 90 seconds for a
Render cold start, and does not poll or retry automatically. The backend must allow this health
endpoint and its `Cache-Control` request header from the frontend's origin.

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

To show the impact strip, add verified stats to `src/features/impact/data/impact.ts`.

Project descriptions and technology lists are based on the linked public repositories. The showcase does not claim unverified outcomes or personal contributions. Corban is not included because the available legacy portfolio copy does not provide a project repository or a verified technical stack.

Experience entries support optional summaries, highlights and technology stacks; these fields are
currently unused until their content is verified.

The mobile navigation uses a disclosure menu with Escape, backdrop and focus-leave dismissal.
About, Experience, Skills, Projects, AI Lab, Contact and Footer load near the viewport; their native
section anchors remain available for direct hash navigation. The assistant and the animated
background render after browser idle time, with the CSS cosmic gradient visible first.
At widths up to 740px or when data saving/reduced effects is active, the background stays lightweight:
the mesh uses its CSS gradient and the starfield is a static CSS pattern with no canvas or animation
loop.

Skills are grouped from technologies documented in the linked projects; they are not proficiency
ratings or claims about employment.

## Interactive project demonstrations

Case studies load on demand. On desktop, visible architecture lanes light steps in sequence and
move decorative packets between them once per open; Replay restarts the sequence. Mobile-lite,
reduced effects, OS reduced motion, data saving and missing IntersectionObserver show all steps
statically without Replay.

“How an async pipeline behaves” loads only when its slot below the project gallery enters view.
It is a generic simulation: no emails are sent and no network calls are made. Send an event,
enable simulated failure to see three backoffs and a dead letter, then disable failure and redrain
to deliver it. At most twelve events are retained (including dead letters). Timers pause when the
block is offscreen or the tab is hidden, and are cleared on unmount. Mobile/reduced-effects mode
keeps the controls, log and counters without travel animation.

These features add no dependencies, canvas or WebGL. Keep their code/CSS lazy, use only
transform/opacity animations while visible, and measure five mobile Lighthouse runs before/after
changes (median and min-max), targeting Performance >=90 and TBT <=300ms without entry-bundle
growth beyond noise.

## Search and finishing details

Search code and styles are loaded with `React.lazy` on first open, or prefetched on the first
hover/focus of a Search button, never at startup. Ctrl/Cmd+K is ignored in editable fields.
The native dialog keeps focus in its search combobox; arrows, Home/End and Enter operate grouped
results, Escape/backdrop dismiss it, and closing restores the opener. Navigation reuses the
existing section handler and `#projects/<id>` case-study hashes, including unmounted destinations.
Project, navigation and profile data remain authoritative; a missing résumé has no search action.

Section heading masks reuse each heading's existing ScrollReveal observer and animate whole
lines, not letters. They pause outside the viewport or in hidden tabs. Mobile-lite, data saving,
reduced effects, reduced motion and missing observers show headings immediately; the hero is
unchanged. The footer reserves room for “Bengaluru · HH:MM”, formats with `Intl.DateTimeFormat`,
and updates once per minute only while visible in an active tab, clearing timers on cleanup.

The social card's source is `public/images/social-preview.svg`; regenerate
`public/images/social-preview.png` at exactly 1200×630 after editing it. For example, with Chrome
installed, run headless Chrome against the served SVG using `--window-size=1200,630`,
`--force-device-scale-factor=1`, `--hide-scrollbars` and `--screenshot=<absolute PNG path>`.
Inspect the result at half size and the vector favicon at 16px/32px. Existing Open Graph/Twitter
URLs remain unchanged. No generation dependency is added to the application.

## Adding your résumé

Place your current PDF at `public/resume.pdf` and rebuild with `npm run build`. Vite checks for
the file at build time; the hero and footer show “Download résumé” only when it exists, using
`Juyel-Hushen-Resume.pdf` as the download filename. No placeholder PDF is supplied. Restart Vite
if you add the file while the development server is running.

The public contact address and hero employment proof live in `src/lib/profile.ts`. Email and
manual-copy options remain available independently of the backend; a calm contact-only note
appears after an unavailable health result, and submission errors include a direct email link.

## Follow-up work

- Build and deploy a backend that implements the documented chat contract, portfolio grounding,
  and server-side safety and access controls; none is included in this frontend
- Confirm Corban details and a public project destination
- Replace the CSS project visuals with verified screenshots or diagrams when available
- Add a current résumé when a verified public asset is available
