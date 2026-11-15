# Frontend architecture

Joefolio is a React 19, Vite, and TypeScript single-page portfolio. Its default presentation is
dark navy with a cyan accent; a persisted light theme and four additional accents are available.
The interface is deliberately text-first: one centered reading column, plain section navigation,
simple lists, and no global canvas, WebGL scene, or scroll-linked effects.

## Page composition

`src/app/App.tsx` composes the header, intro, About, Work, Contact, footer, search palette, and
idle-loaded assistant. The intro heading owns the `home-title` focus target used by the footer's
Back to top link. The skip link targets the main landmark.

The About section combines `experience/data/experience.ts` with `skills/data/skills.ts`. It renders
role, employer, dates when known, and a Current label for the current role. Toolbox groups are plain
text lists. Project names, summaries, technologies, repositories, and case-study content come from
`features/projects/data/projects.ts`.

The Contact section keeps the existing typed form and shared Axios API client. Form validation,
pending, success, and error states stay next to the form; the public contact address is used only
by the footer's Email link. The optional résumé download is included only when the build-time
`__HAS_RESUME__` flag is true.

## Navigation and overlays

The sticky header links to About, Work, and Contact. At widths of 740px and below, it presents a
disclosure menu with a backdrop, Escape dismissal, and focus returned to its toggle. It does not
lock page scrolling. Search is lazy-loaded from the Search control or Ctrl/Cmd+K; the palette keeps
keyboard navigation and focus restoration.

Project case studies remain native modal dialogs. Opening one uses the existing
`#projects/<project-id>` URL convention, and direct links and browser history continue to work.
Legacy `#experience` and `#skills` targets map to About; `#ai-lab` maps to Work.

The assistant is loaded after idle time and remains an icon-only launcher. Its service contract is
documented in [ai-assistant-api.md](./ai-assistant-api.md).

## Theme and styling

`src/styles/tokens.css` defines the dark and light palettes, type sizes, spacing, single section
spacing clamp, 4px radius, and hairline border. Inter is the text family; JetBrains Mono is reserved
for dates and small labels. The accent tokens define five foreground colors for each theme.
`theme-contrast.test.ts` computes their contrast ratios against both theme backgrounds and surfaces.

An inline head script in `index.html` reads validated theme and accent values before the app bundle
loads, avoiding a first-paint theme flash. The Theme and Colour controls update `<html>` data
attributes and persist changes in local storage; storage failures leave the in-memory controls
usable. `global.css` owns document defaults, focus styling, and reduced-motion behavior.

## Module boundaries

- `src/app/`: page composition, backend health, active-section state, and hash compatibility.
- `src/components/common/`: shared buttons, load boundary, and résumé link.
- `src/components/layout/`: navigation, theme controls, footer, and local time.
- `src/features/about/`, `experience/`, and `skills/`: factual profile content.
- `src/features/projects/`: project list, data, static architecture details, and case-study dialog.
- `src/features/contact/`: form, validation, contact state, and API adapter.
- `src/features/command-palette/`: searchable section, project, résumé, and profile actions.
- `src/features/assistant/`: optional assistant UI, conversation hook, and service client.
- `src/features/impact/`: unchanged optional impact strip; it remains unrendered while its data is
  empty.
- `src/lib/api/`: shared HTTP client and response/error normalization.

Removed visual systems have no remaining runtime entry points: startup cinema, cosmic backgrounds,
orbits, cursor magnification, scroll progress, Earth/flight effects, AI Lab, and project art. The
unused Three.js, Simple Icons, and Space Grotesk dependencies were removed. The Motion dependency is
retained for the existing assistant and optional impact strip.

## Verification

Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
Tests cover theme persistence and bootstrap behavior, accent contrast, legacy hashes, project
case-study routes, contact states, footer-only email placement, and preserved API contracts.
