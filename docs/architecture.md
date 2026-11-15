# Frontend architecture

Joefolio is a React 19, Vite, and TypeScript single-page portfolio. Its default presentation is
dark navy with a cyan accent; a persisted light theme and four additional accents are available.
The interface is deliberately text-first: a fixed desktop sidebar and a single main reading column,
simple lists, and no global canvas, WebGL scene, or scroll-linked effects.

## Page composition

`src/app/App.tsx` composes the header, intro, About, Work, Contact, footer, search palette, and
on-demand assistant. The intro heading owns the `home-title` focus target used by the footer's
Back to top link. The skip link targets the main landmark.

The About section combines `experience/data/experience.ts` with `skills/data/skills.ts`. It renders
role, employer, dates when known, and a Current label for the current role. Toolbox groups are plain
text lists. Project names, summaries, technologies, repositories, and case-study content come from
`features/projects/data/projects.ts`.

The Contact section keeps the existing typed form and shared fetch API client. Form validation,
pending, success, and error states stay next to the form; the public contact address appears once,
in the social row. The optional résumé download is included only when the build-time
`__HAS_RESUME__` flag is true.

## Navigation and overlays

At 981px and above, the fixed, internally scrollable sidebar links to Home, About, Work, and
Contact. At widths of 980px and below, a sticky top bar presents a disclosure menu with a
backdrop, Escape dismissal, and focus returned to its toggle. It does not lock page scrolling.
The social row is rendered once, in the sidebar on desktop or the footer on smaller screens.
Search is lazy-loaded from its control or Ctrl/Cmd+K; the palette keeps keyboard navigation and
focus restoration.

Project case studies remain native modal dialogs. Opening one uses the existing
`#projects/<project-id>` URL convention, and direct links and browser history continue to work.
Legacy `#experience` and `#skills` targets scroll to their respective About headings; `#ai-lab`
maps to Work.

The assistant loads on first use from an icon-only launcher, in the header on mobile and floating
on desktop. Its service contract is
documented in [ai-assistant-api.md](./ai-assistant-api.md).

## Theme and styling

`src/styles/tokens.css` defines the dark and light palettes, type sizes, spacing, single section
spacing clamp, 4px radius, and hairline border. The Latin subset of Inter is preloaded with a
metric-adjusted fallback; dates and small labels use system monospace. The accent tokens define five
foreground colors for each theme. `theme-contrast.test.ts` computes their contrast ratios against
both theme backgrounds, surfaces, and accent-tinted active rows and tag pills.

An inline head script in `index.html` reads validated theme and accent values before the app bundle
loads, avoiding a first-paint theme flash. The Theme and Colour controls update `<html>` data
attributes and persist changes in local storage; storage failures leave the in-memory controls
usable. The browser theme color follows the selected theme. `global.css` owns document defaults,
focus styling, and reduced-motion behavior.

## Module boundaries

- `src/app/`: page composition, backend health, active-section state, and hash compatibility.
- `src/components/common/`: shared buttons, load boundary, and résumé link.
- `src/components/layout/`: navigation, theme controls, footer, and local time.
- `src/features/about/`, `experience/`, and `skills/`: factual profile content.
- `src/features/projects/`: project list, data, static architecture details, and case-study dialog.
- `src/features/contact/`: form, validation, contact state, and API adapter.
- `src/features/command-palette/`: searchable section, project, résumé, and profile actions.
- `src/features/assistant/`: optional assistant UI, conversation hook, and service client.
- `src/features/impact/`: optional impact strip; it remains unrendered while its data is
  empty.
- `src/lib/api/`: shared HTTP client and response/error normalization.

Removed visual systems have no remaining runtime entry points: startup cinema, cosmic backgrounds,
orbits, cursor magnification, scroll progress, Earth/flight effects, AI Lab, and project art. The
unused Three.js, Simple Icons, Space Grotesk, Motion, and Axios dependencies were removed.

## Verification

Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
Tests cover theme persistence and bootstrap behavior, accent contrast, legacy hashes, project
case-study routes, contact states, single social-row email placement, and preserved API contracts.
