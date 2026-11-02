# Frontend architecture

This is a feature-oriented React + Vite + TypeScript application. The architecture refactor
preserves portfolio content, native section anchors, contact/assistant contracts, and the cosmic
visual design. No additional dependencies, providers, state-management library, or import alias
are required.

## Assessment and migration decisions

The original application already had typed portfolio datasets, shared Axios infrastructure,
co-located component styles/tests, reduced-motion support, and a deferred Three.js Earth scene.
The principal maintenance issue was ownership: contact, assistant, project visuals, and AI Lab
components lived beside genuinely shared components, while their services and data lived in
general-purpose directories.

The incremental migration first relocated feature-owned files and rewrote imports and test mocks.
Typechecking and all 91 existing tests passed at that boundary. Subsequent changes extracted
application lifecycle hooks, contact geometry/transmission behavior, assistant conversation state,
and skill presentation calculations. Small About and Hero components were intentionally not split.

### Before

```text
src/
  app/                   Page composition, navigation and intro lifecycle
  components/            Shared UI plus contact, assistant and feature visuals
    background/
    intro/
    layout/
  data/                  Projects, skills and experience
  hooks/                 Generic motion preference hook
  lib/                   Contact and assistant services
    api/                 Shared Axios client and error normalization
  sections/              About, AiLab, Contact, Experience, Hero, Projects, Skills
  style.css              Tokens, resets and shared utilities
```

### After

```text
src/
  app/
    App.tsx              Page composition
    hooks/               useActiveSection, useUniverseIntro
  components/
    background/          Shared cosmic canvas/background layers
    common/              ScrollReveal
    intro/               UniverseIntro presentation
    layout/              Navbar and Footer
  features/
    about/components/
    ai-lab/              Case studies and components
    assistant/
      components/
      hooks/             useAssistantConversation
      services/          Independent assistant API contract
    command-palette/     Lazy native dialog, authoritative-data commands and pure matching
    contact/
      components/        Section, form, deferred Earth destination and scene
      hooks/             useContactTransmission
      services/          Contact API
      flight-path.ts     Pure stage-relative Bézier geometry
      types.ts           Contact form model and transmission status
    experience/          Components and typed data
    impact/              Verified impact statistics and the optional animated strip
    playground/          Generic local event-pipeline reducer and lazy interactive UI
    projects/            Components and authoritative typed project data
    skills/              Components, typed data and presentation calculations
  hooks/                 Shared effects preference and viewport animation hooks
  lib/
    api/                 Shared Axios client and error normalization
    profile.ts           Shared public profile, email, résumé and hero proof constants
  sections/Hero/         Simple page presentation retained in place
  styles/
    tokens.css
    global.css
    utilities.css
```

Component CSS and tests stay beside the component. Feature model types stay in the feature's
typed data module when a separate types directory would add no value. There are no new feature
barrels or empty provider/configuration layers.

## Dependency boundaries

- Application composition imports features and shared UI.
- Features may import shared UI, generic hooks, and shared API infrastructure.
- Shared components, generic hooks, and libraries must not import features.
- API infrastructure must not import application UI.
- Skills and AI Lab explicitly consume the authoritative Projects dataset for repository evidence.
  Projects does not import either consumer. Do not copy project metadata into those features.
- Relative imports remain the repository convention. Prefer explicit modules over broad barrels.
- ESLint `no-restricted-imports` enforces shared-to-feature and API-to-UI boundaries for static
  imports. Dynamic imports remain subject to review; this is not a complete dependency-graph tool.

## Component and state responsibilities

### Command palette and below-fold polish

`App` owns a `React.lazy` command-palette boundary, opener reference and preference/navigation
callbacks. Navbar receives generic open/prefetch callbacks, so shared UI never imports features.
Search hover/focus prefetches its chunk; startup does not. Ctrl/Cmd+K ignores input, textarea,
select and contenteditable targets. The native dialog owns scroll locking, opener focus return,
Escape/backdrop dismissal and a combobox/listbox with grouped, scored word/subsequence matches.
Arrow/Home/End order matches the rendered groups; Enter activates commands. Results and clipboard
feedback use a polite live region, with manual-copy instructions on clipboard failure.

`palette-items.ts` derives items from `navItems`, the Projects dataset, `PROFILE_LINKS` and résumé
constants; the existing build-time résumé flag gates downloads. Section commands invoke the
existing navigation handler and native hash. Project commands push `#projects/<id>` and dispatch
hashchange. Unmounted lazy sections listen for hashchange/popstate until loaded, so a command can
open a case study without first scrolling its gallery into view. About is now viewport-lazy too.
Vite explicitly groups the public Motion React barrel to stabilize shared chunk allocation as
lazy consumers change; it does not eagerly collect the entire Motion package.

Below-fold heading masks are whole-line wrappers around plain text and existing line breaks,
styled in `utilities.css`. `headingReveal` on the existing ScrollReveal uses its single observer
for reveal and offscreen pause, retaining it after the one-shot reveal. A tab-visibility listener
pauses CSS keyframes. Mobile widths up to 740px, reduced effects/OS reduced motion, data saving
and missing observers show the heading immediately. The hero and `#home-title` are untouched.

Footer `LocalTime` is inside the existing lazy footer chunk, not a startup import. The shared
`useInteractiveActivity` gates its initial update and one-minute interval; hidden/offscreen
states and unmount clear both timers. A reserved-width/height wrapper avoids first-paint shifts.
`Intl.DateTimeFormat` uses `Asia/Kolkata`, and a semantic `time` carries the ISO timestamp.

The share-card SVG is the source of the 1200×630 PNG. Rasterize using an installed headless
browser (no runtime dependency), then inspect at 600px width. Keep the profile name, role and
positioning line inside safe margins and the favicon's vector monogram legible at 16px/32px.
Search, masks and clock introduce no providers, canvas, WebGL or dependencies. Keep the entry
chunk within a few hundred bytes of baseline and compare five mobile Lighthouse runs using
median and min-max; shared-host noise is not evidence of a certified improvement.

### Profile proof and direct contact

`src/lib/profile.ts` owns `PROFILE_LINKS`, `PUBLIC_EMAIL`, `RESUME_PATH`, `RESUME_FILENAME`
and `HERO_PROOF_LINE`. Hero renders the employment proof with its existing mount-reveal variants.
The shared `ResumeDownload` reads Vite's typed `__HAS_RESUME__` build-time flag, computed with
`fs.existsSync` against `public/resume.pdf`; it omits the link when the asset is absent. Tests
can stub the global flag for both branches. Adding or replacing the real PDF requires a rebuild.

The shared `EmailContact` renders the mailto address, with optional clipboard controls in Contact.
Denied or unavailable clipboard access selects the address, announces failure politely and
provides manual-copy instructions. Copy feedback resets after two seconds, with timer cleanup
on unmount; it introduces no motion. Footer reuses the same address component without copy controls.
`App` passes startup health to Contact as a prop. Only `UNAVAILABLE` displays an email fallback
above the still-enabled form; `CHECKING` and `UP` display no health note. Submission errors include
the same mailto link inside the error region without altering validation, values or flight state.

### Project case studies

Each project card has a case-study action alongside its existing repository/demo links.
`ProjectCaseStudy` uses a native modal dialog with Escape/backdrop dismissal, focus return,
background scroll locking and a short reduced-motion-aware fade/scale transition.
The dialog and `ArchitectureFlow` each have a `React.lazy` boundary. The flow renders labelled
lanes as ordered steps with CSS connectors: horizontal above 740px and vertical in the full-screen
mobile sheet. Visible desktop flows light nodes at 250ms intervals, with decorative packets moving
between them, once per opening. Replay remounts only the ordered lanes, preserving button focus.
CSS custom properties/keyframes animate only transforms and opacity. Effects pause when the flow
leaves the viewport, the tab is hidden, or the dialog exits. Reduced effects, the OS motion
preference, data saving, widths up to 740px, and missing IntersectionObserver show the final static
state without Replay. All content comes from the typed
project dataset; optional role, outcome, metrics, lessons and screenshot fields render only
when supplied. No claims or placeholder values are inserted.

Case-study hashes use `#projects/<project.id>`. Opening pushes a history entry without scrolling;
closing replaces the hash with `#projects`. Back/Forward and initial hash loading synchronize the
dialog. The application navigation hook interprets the section portion of the hash and keeps
Projects active while a case study is open. No router is introduced.

The existing scanner portals into the active dialog through the generic `cosmic-overlay-host`
DOM event so it remains decorative above the native top layer; shared cursor code never imports
Projects. Closing restores the overlay to the document body.

### Event pipeline playground

The end of the Projects gallery reserves space for a viewport-loaded `React.lazy` playground;
neither the playground nor architecture animation is evaluated during initial hero rendering.
`src/features/playground/pipeline.ts` owns the pure readonly reducer. It has no network, clock,
DOM, employer or client dependencies. Events progress from API (202 Accepted) to Topic, Consumer
and Delivery. Failed delivery enters three backoff stages lasting one, two and four 650ms ticks,
then stays in the dead-letter topic. Redrain resets attempts and returns those events to Topic.
Accepted/Delivered counters are cumulative; Retrying/In dead-letter describe current queues.
The cap of twelve includes retained dead letters, bounding memory until they are redrained;
completed events are removed and only the eight most recent activity messages are retained.
Disabled reducers ignore simulation actions, preserving progress across viewport/tab pauses.

`useInteractiveActivity` supplies intersection/tab visibility and the mobile/static policy.
The effective effects preference is passed from Projects, avoiding an entry-to-lazy-chunk
dependency cycle. The UI schedules a single timeout only while visible, tab-active and processing
events, plus a debounced 250ms polite announcement. Both timers are canceled offscreen and on
unmount; static/mobile mode retains simulation progress with no travel animation. Missing
IntersectionObserver exposes usable static controls without attempting animation. Controls use
44px minimum targets and readable 14px text. No canvas, WebGL, dependencies, providers, new
navigation item or section number are introduced.

Performance guardrails for these additions are a mobile five-run median Performance of at least
90 and TBT no more than 300ms, with median/range reporting against a fresh baseline. Keep new code
and CSS behind lazy boundaries, reserve the playground slot, animate only transforms/opacity on
screen, and check entry bytes as well as requested chunks. Shared-host variability must be reported
explicitly rather than attributed to effects that were never loaded.

### Experience highlights and impact

Experience entries may include readonly `summary`, `highlights` and `stack` fields. The timeline
renders each optional part only when supplied (showing at most four highlights); these fields are
currently unused in the production experience data. The current role retains its viewport reveal
and marker behavior, with stronger accent treatment and a text label.

`src/features/impact/data/impact.ts` exports readonly `impactStats`, intentionally empty until
verified statistics are supplied. `ImpactStrip` returns no markup when the array is empty. With
one to four entries it reveals once, then animates numeric MotionValues; reduced motion, unavailable
IntersectionObserver or observer initialization failure show final values directly. Animated
digits are hidden from assistive technology while final values and labels remain accessible.

- `App` composes the page. `useUniverseIntro` owns per-tab intro policy; its presentation is lazy
  and skipped at widths up to 740px or when data saving/reduced effects is active. The hero remains
  visible beneath the optional desktop overlay. `useActiveSection` owns scroll/hash/history
  tracking. Pending explicit navigation remains authoritative until scrolling settles or user
  scrolling resumes. Scheduled history measurements are canceled on replacement and unmount.
- `PortfolioAssistant` owns panel presentation, focus trapping/restoration, Escape handling, and
  transcript scrolling. `useAssistantConversation` owns drafts, turns, follow-ups, pending/error
  state, duplicate prevention, and request cancellation on unmount.
- `CosmicContactSection` composes the form, envelope and Earth destination.
  `useContactTransmission` owns request/flight state, geometry measurement, observer cleanup, and
  successful reset. `CosmicContactForm` retains field validation and entered values on failure.
- `useEffectsPreference` combines the OS motion preference, `navigator.connection.saveData`, and
  the persisted explicit choice. The footer and mobile navigation share the same toggle; the
  application mirrors the effective setting to `data-effects-reduced` on `<html>`. Explicit
  choices override device defaults. At widths up to 740px, with data saving enabled, or when
  effects are reduced, the mesh stays on its CSS gradient and does not initialize WebGL; the
  starfield uses a small CSS-only static pattern without creating a canvas or animation loop.
  The cursor, scroll beam, intro and continuous CSS flourishes are also disabled when effects
  are reduced.
- `scheduleAfterIdle` uses `requestIdleCallback` with a bounded timeout and a timer fallback.
  On eligible desktop configurations, starfield animation and WebGL mesh setup wait until idle;
  CSS gradients provide the initial background. Backend health warm-up and the assistant are also
  deferred so they cannot compete with initial rendering. The animated starfield and mesh pause
  when the document is hidden or the mesh leaves the viewport, and all idle callbacks are canceled
  on cleanup.
- `useAnimationVisibility` pauses section-owned infinite CSS motion outside the viewport.
  About, Experience, Skills, Projects, AI Lab, Contact and Footer are loaded with `React.lazy` near the
  viewport and reserve section-specific placeholder heights. An initial or in-page section hash
  activates the lazy section and scrolls to the rendered anchor after its chunk resolves; native
  anchors and `useActiveSection` scroll tracking remain in use.
- `EarthDestination` preserves the 180px near-viewport preload and lazy scene import. Earth
  renderer resource disposal, visibility pausing, DPR limits and reduced motion remain intact.
- Skill orbit/counter-rotation calculations are pure and independently tested. A closed icon
  union and exhaustive `satisfies` mapping replace unchecked string indexing.
- Project, skill and experience records use readonly types, including nested collections.
  Event handlers and extracted small functions use arrow functions; component declarations remain
  named where that is clearer.

## API flow

```text
Contact form -> useContactTransmission -> contact service -> apiClient -> Render
Assistant panel -> useAssistantConversation -> assistant service -> apiClient (host override)
App startup -> useBackendHealth -> wakeBackend -> apiClient -> Render /actuator/health
```

There is one Axios instance in `src/lib/api/client.ts`: JSON headers, 30-second timeout,
`withCredentials: false`, and no interceptors or automatic POST retries. `VITE_API_BASE_URL`
defaults to `https://joefolio-backend.onrender.com`; local development uses that same host.

Contact still posts `/api/v1/contact`, maps UI `message` to backend `body`, forwards the `website`
honeypot, and requires HTTP 202 with a non-empty response message before success. Safe centralized
errors preserve entered values and explicit retry.

`wakeBackend` in `src/lib/api/backend-health.ts` retains one in-flight/settled promise per loaded
page, preventing StrictMode, re-renders, extra consumers and remounts from sending duplicate
health requests. It requires HTTP 200 and body status `UP`; transport failures and invalid
responses resolve to `UNAVAILABLE`. The request overrides only its own timeout to 90 seconds,
uses `Cache-Control: no-cache, no-store`, and does not retry, poll or block rendering.
`useBackendHealth` exposes `CHECKING`, `UP` and `UNAVAILABLE` to application consumers with
unmount-safe updates. It schedules its one warm-up after idle time without blocking UI and passes
the result to Contact; only `UNAVAILABLE` adds a local email fallback, not a global status banner.
A reload starts a new operation, but an unavailable result is not automatically retried within
the same page.

Assistant still uses its own optional `VITE_AI_ASSISTANT_API_URL` as a per-request base URL and
posts `/api/chat`. Empty configuration remains unavailable. Response/citation validation,
AbortSignal cancellation and assistant-specific errors are unchanged.

See [contact configuration](./contact-email.md) and [assistant contract](./ai-assistant-api.md).
Vite environment configuration is public; credentials belong only on the backend. Render must
allow the actual production and local Vite origins; frontend code cannot grant CORS permission.

## CSS responsibilities

`main.tsx` imports global styles followed by utilities at the original stylesheet import position.
`global.css` imports the tokens first. Tokens, element resets, focus and reduced-motion defaults,
and shared section/button utilities are separate without changing their values or component CSS.
Repeated heading/kicker declarations were consolidated while preserving effective properties.

Breakpoints remain literal media queries; CSS custom properties cannot provide native media-query
breakpoints. Existing token aliases remain for compatibility rather than forcing unrelated
component-style rewrites.

## Development and testing

### Scroll reveals and pointer lens

The shared `ScrollReveal` remains the sole general-purpose reveal observer. It supports
`fade-up`, `fade-down`, `fade-left`, `fade-right`, `scale-up`, `blur-reveal`, and
`stagger-container`. Section duration defaults to 750ms, vertical travel to 40px, horizontal travel
to 38px, scale to 0.97, and child stagger to 110ms. Individual project and case-study cards have
their own observer and 650ms entrance, avoiding gallery-wide premature reveals.
`ScrollRevealItem` inherits parent Motion labels without adding observers. Hero uses the same
variant definitions with its existing mount animation; timeline path drawing and Contact's
transmission animation remain separate specialized effects.

Reveals are one-shot by default; `once={false}` opts into re-entry. Reduced motion and missing
IntersectionObserver support show content immediately, as does observer initialization failure.
There is no reveal timer: offscreen elements remain in their initial state until real viewport
entry. Keyboard focus also reveals a container so native anchor/focus interactions remain usable.
Skill planets use opacity-only native viewport entrances to preserve orbital transforms; timeline
markers inherit the corresponding card's viewport labels. Categories and skill detail have their
own reveal boundaries rather than animating during page load.

`CosmicScrollProgress` adds a two-pixel cyan/violet progress beam driven by Motion `useScroll`
and `useSpring`, with no scroll-driven React state. It is omitted when effects are reduced.

`CosmicMagnifyingCursor` is a decorative overlay enabled only for fine hover-capable pointers
without reduced effects. It keeps the native cursor and focus rings, has `pointer-events: none`
and `aria-hidden`, and uses Motion values/springs rather than pointer-driven React state.
The lens and small radial spotlight do not sample or enlarge arbitrary underlying pixels.
Actual magnification applies to targeted elements: project cards 1.035, project visuals 1.10,
ordinary links/buttons 1.04, and unselected skill planets 1.05. Existing selected-planet emphasis
is retained.

The Artifact Scanner combines an outer orbit, segmented ring, satellites, glass lens, four
targeting brackets, star/crosshair reticle, inspection beam, spotlight and two independently
sprung ghost rings. Target changes select `default`, `interactive`, `inspect`, `image` or `planet`
data modes without pointer-frame React rendering. Rings pause 180ms after the last movement,
and the one-shot idle timer is canceled on hide/unmount. Scanner labels are decorative only.

The small magnetic offset affects the lens, not target hitboxes. Target bounds are measured only
on entry; there are no per-move layout measurements or added frame/polling loops. Scrolling,
pointer exit/cancellation, dragging, text-field interaction, and window blur reset the lens.
Media, pointer and scroll listeners and all three spring pairs clean up on disable/unmount. Project
hover elevation uses the independent CSS `translate` property so it composes with reveal
transforms and hover magnification.

Browser checks cover 1440, 1280, 768 and 390px layouts, reduced motion, native controls, skill
selection and mocked contact acceptance/flight. Fine/coarse pointer gating and cleanup are
covered with deterministic mocked media queries in unit tests; physical touch/GPU-device
verification remains recommended.

```bash
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Prettier preserves each file's checkout line endings (`endOfLine: auto`) so Windows CRLF and Linux
LF checkouts do not generate unrelated formatting failures. Other formatting rules are unchanged.
Vitest uses two workers after measured fork-worker startup timeouts with unrestricted parallelism;
test isolation, assertions and timeouts are unchanged.

Tests use observable component behavior and mocked Axios adapters; they do not send live contact
messages. The refactor retains all 91 original tests and adds six tests covering flight geometry,
skill orbital/reduced-motion/icon invariants, and history animation-frame cleanup. The resulting
architecture-refactor baseline suite has 97 tests across 16 files. Additional backend warm-up
tests cover response/transport validation, startup deduplication and lifecycle status.

## Remaining technical debt and recommended next work

- Vite still reports the approximately 307kB initial JavaScript entry and 534kB deferred Earth
  chunk (the former is about 100kB gzip). Continue to profile runtime tasks before changing the
  remaining bundle boundaries or rendering architecture.
- Global styles retain legacy token aliases; individual feature CSS still contains bespoke scene
  values. Consolidate only demonstrated reusable values, with visual regression coverage.
- The common error normalizer retains contact-oriented fallback wording for compatibility.
  A future second general-purpose API may warrant a generic transport error plus feature messages.
- Assistant backend implementation/configuration remains a separate task.
- Add persistent browser visual regression coverage for desktop/mobile and motion preferences;
  current unit/integration tests are not a substitute for GPU/device testing.
- Stable project identifiers would make cross-feature evidence references less dependent on
  display names. Migrate that separately with explicit data-integrity tests.

Deployment workflows, backend source and production dashboard settings are outside this refactor.
