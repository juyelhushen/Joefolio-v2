# Juyel Hushen — Cosmic Portfolio

React + Vite + TypeScript starter for the planned cosmic engineering portfolio.

## Included

- Responsive cosmic hero and navigation
- Canvas starfield with occasional shooting stars
- CSS-rendered planet/orbit layers
- Evidence-backed project cards linked to public repositories
- On-demand case-study architecture sequences with Replay and a static mobile/reduced-effects view
- Engineering introduction, professional experience timeline, and project-backed skills
- AI Lab with documented project case studies and a contact form with server-side email delivery
- AI Lab case studies grounded in the public Sentinel and Enterprise Knowledge Assistant documentation
- Portfolio assistant interface with an optional, typed `/api/chat` integration boundary
- Keyboard-accessible mobile navigation and a skip-to-content link
- On-demand command palette: header Search, mobile-menu Search or Ctrl/Cmd+K; sections,
  project case studies, profile links and résumé availability
- Whole-line masked headings below the hero, with immediate mobile/reduced-effects fallbacks
- A visibility-gated Bengaluru footer clock using the Asia/Kolkata time zone
- Automatic OS reduced-motion support and lightweight mobile/data-saving backgrounds
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
value empty to hide the unconfigured launcher and avoid downloading the assistant interface;
no sample answers are simulated. Existing search, projects and contact remain available.
Vite environment values are public, so never put model/provider credentials or backend secrets in
this variable.

The contact form submits to the deployed Spring Boot API. Development uses Vite's same-origin
`/backend` proxy; production calls the configured API directly without a proxy or widened CORS.
Set `VITE_API_BASE_URL=https://joefolio-backend.onrender.com` in `.env.local` and Vercel's build
environment. See the [contact API guide](./docs/contact-email.md) for details.

After the browser has idle time, the portfolio initiates one silent `GET /actuator/health`
warm-up through the shared Axios client. It does not block rendering, allows up to 90 seconds for a
Render cold start, and does not poll or retry automatically. The backend must allow this health
endpoint and its `Cache-Control` request header from the production frontend's origin.

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

Project descriptions and technology lists are based on the linked public repositories. The author
confirmed solo ownership of the five featured projects. Each case study separates contribution,
engineering decisions, trade-offs, source-backed testing and unmeasured outcomes. Repository tests
are evidence of implementation, not a claim that external project suites were run in this workspace.
No traffic, business-impact or production-scale metrics are invented. Corban is not included because
the available legacy portfolio copy does not provide a project repository or a verified technical stack.

Experience entries support optional summaries, highlights and technology stacks; these fields are
currently unused until their content is verified.

The mobile navigation uses a disclosure menu with Escape, backdrop and focus-leave dismissal.
About, Experience, Skills, Projects, AI Lab, Contact and Footer load near the viewport; their native
section anchors remain available for direct hash navigation. The configured assistant and the animated
background render after browser idle time, with the CSS cosmic gradient visible first.
Motion's animation features load asynchronously rather than being included in the entry module;
mobile/data-saving/reduced-motion hero copy is visible immediately without an entrance sequence.
Three.js and the Earth texture remain deferred until the contact globe approaches the viewport.
Changing reduced-motion preferences pauses/resumes the existing renderer without recreating GPU
resources or reloading its texture.
At widths up to 740px or when data saving/OS reduced motion is active, the background stays lightweight:
the mesh uses its CSS gradient and the starfield is a static CSS pattern with no canvas or animation
loop.

Skills are grouped from technologies documented in the linked projects; they are not proficiency
ratings or claims about employment.

## Interactive project demonstrations

Case studies load on demand. On desktop, visible architecture lanes light steps in sequence and
move decorative packets between them once per open; Replay restarts the sequence. Mobile-lite,
OS reduced motion, data saving and missing IntersectionObserver show all steps
statically without Replay.

The gallery ends after its five project cards; architecture diagrams remain inside individual
case studies. These features add no dependencies, canvas or WebGL. Keep their code/CSS lazy, use only
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
OS reduced motion and missing observers show headings immediately. The footer reserves room
for “Bengaluru · HH:MM”, formats with `Intl.DateTimeFormat`,
and updates once per minute only while visible in an active tab, clearing timers on cleanup.

The social card's source is `public/images/social-preview.svg`; regenerate
`public/images/social-preview.png` at exactly 1200×630 after editing it. For example, with Chrome
installed, run headless Chrome against the served SVG using `--window-size=1200,630`,
`--force-device-scale-factor=1`, `--hide-scrollbars` and `--screenshot=<absolute PNG path>`.
Inspect the result at half size and the vector favicon at 16px/32px. Existing Open Graph/Twitter
URLs use the verified canonical origin `https://juyel.vercel.app/`, also used by `robots.txt`,
`sitemap.xml` and the single Person JSON-LD record. Only the root page belongs in the sitemap:
section and project hashes are not separate server-rendered pages. No generation dependency is
added to the application. The obsolete `joefolio-2-0-two.vercel.app` deployment returned 404 during
the November 3, 2026 audit; it is not used as a canonical URL.

## Adding your résumé

Place your current PDF at `public/resume.pdf` and rebuild with `npm run build`. Vite checks for
the file at build time; the footer and command palette offer the download only when it exists, using
`Juyel-Hushen-Resume.pdf` as the download filename. No placeholder PDF is supplied. Restart Vite
if you add the file while the development server is running.

The public contact address lives in `src/lib/profile.ts` and is used only as the footer's
`mailto:` destination. The visible label is Gmail, immediately after GitHub; the actual address
is never shown as portfolio copy. Contact offline/error messages point
to that footer link without repeating the address; the visitor email field and submission
contract are unchanged. There are no copy-email or manual effects controls and no persisted
effects preference. Motion's `useReducedMotion` and CSS `prefers-reduced-motion` automatically
honor the operating-system setting. A small OS-only media subscription supplements Motion's
initial snapshot so mounted effects also stop immediately when the system setting changes.

The hero introduces “SOFTWARE ENGINEER II · FULL-STACK · AI” with one editorial heading:
“I turn complex ideas into reliable software.” Supporting copy connects dependable backend
systems, thoughtful digital experiences and practical AI. Explore my work and Get in touch
remain the two primary actions. A contained engineering constellation replaces the hero planet:
Backend, Full-stack and AI systems nodes link to Projects, Skills and AI Lab. Fine SVG paths
connect them to a breathing core, with one slow satellite. The visual stacks below the copy on
mobile without cropping. Native keyboard focus and the heading focus target remain intact.
CTA hover/focus states provide a light sweep, border illumination, lift and tactile press.

Typography reuses locally bundled Space Grotesk headings and Inter body/navigation/button text.
Shared tokens in `src/styles/tokens.css` now carry the hero direction through the portfolio:
navy `#090D19`, ivory `#F1F0EA`, lime `#C5F477`, lavender `#A99AF6` and supporting `#AAB2C2`.
Lime identifies actions and selected states; lavender is reserved for secondary detail.
`src/styles/utilities.css` owns the three action variants: `.button-primary` (solid lime),
`.button-secondary` (neutral bordered surface) and `.button-tertiary` (text-only lime).
Use `.button` with exactly one variant; `.button-icon` preserves the same 48px target for icon
controls. Shared padding, 10px control radius, 18px icons, 240ms transitions, focus, press and
disabled states apply everywhere. Primary sweeps activate only on hover/focus, not continuously.
Shared `.form-control` styling covers contact, search and assistant fields with visible focus
and semantic invalid/disabled states. Cards use shared 16px radii, fine borders and navy surfaces.
Composite controls (skill planets, timeline markers, search options and navigation items)
keep their specialized geometry and keyboard semantics, using the same focus/selected palette.
There are no feature-local action palettes. The core and 42-second satellite pause
offscreen or in hidden tabs, with static mobile-lite/reduced-motion fallbacks. The existing starfield
owns three occasional CSS shooting stars in the outer gutters, replacing its canvas meteors.
No new frame loop, timer, dependency or font request is added. The satellite is hidden on mobile,
and OS reduced motion disables continuous animation without hiding the meaningful node links.

## Follow-up work

- Build and deploy a backend that implements the documented chat contract, portfolio grounding,
  and server-side safety and access controls; none is included in this frontend
- Confirm Corban details and a public project destination
- Replace the CSS project visuals with verified screenshots or diagrams when available
- Add a current résumé when a verified public asset is available
