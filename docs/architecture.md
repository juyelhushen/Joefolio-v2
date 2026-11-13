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
    hooks/               useActiveSection, useBackendHealth
  components/
    background/          Shared cosmic canvas/background layers
    common/              ScrollReveal, LoadBoundary
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
    projects/            Components and authoritative typed project data
    skills/              Components, typed data and presentation calculations
  hooks/                 Shared viewport animation hooks
  lib/
    api/                 Shared Axios client and error normalization
    profile.ts           Shared public profile, email and résumé constants
  sections/Hero/         Simple page presentation retained in place
  styles/
    tokens.css
    global.css
    utilities.css
```

## Initial startup and lazy loading

The initial document owns Stellar Fold's critical midnight cover and readiness/visibility clock;
it contains no separate graphics renderer. React mounts the existing environment while application
initialization proceeds independently. The single persistent WebGL atmosphere initializes
immediately during the cinematic (otherwise it uses the usual idle scheduling). The clock starts
only after its first rendered frame. Scene boundaries are 0–700ms gravitational anomaly,
700–1500ms spacetime distortion, 1500–2400ms galactic formation and 2400–3200ms dimension reveal.
The opening before the application bundle mounts is intentionally midnight, not a second sky.

The shader deflects sky sampling and traces eight depth slices around a tilted spiral volume's
ray/plane intersection. Corrugation, asymmetric lighting, blue-violet emission, selected cyan
filaments and forward camera travel provide spatial detail without assets, another context or
render passes. A portrait-specific origin/expansion keeps the anomaly in view. At 3200ms the
cinematic branch and deflection vanish exactly, leaving the ordinary live atmospheric shader.
The cinematic atmosphere targets 30 updates/sec at the existing capped resolution; the persistent
particle Canvas uses its desktop/mobile profiles below. Frame targets are not measured FPS claims.
Sustained RAF pressure lowers cinematic render resolution in bounded steps to a 60% floor, without
recompiling shaders or changing the sequence. Normal atmospheric resolution is restored inside
the first live draw, never as a separately cleared visible frame.
The four full noise fields are skipped during the dark opening and blended in from 1900–2500ms;
the ordinary shader does not evaluate the cinematic volume after completion.

`window.__STELLAR_FOLD__` is a mutable clock/handshake, not React frame state. The same stellar
arrays receive depth-dependent perspective, curved lens paths and finite trails. Reused scratch
points avoid per-star frame allocations; the projection becomes the exact identity at 3200ms.
Dust and cached distant structures emerge into their ordinary positions. Meteor clocks and the
underlying stellar simulation wait until the cinematic finishes. No star distribution restarts.
Both renderers acknowledge their actual final draw through a two-bit settled mask (1 atmosphere,
2 particles), then stop RAF while critical readiness is late. Content is uncovered on the next
paint only when both final frames and the hero are ready; the background is never replaced.
`cosmic-intro-complete` resumes those same renderers. Only content opacity transitions.

Reduced motion bypasses the sequence and delay, including runtime preference changes. Hidden
tabs pause drawing and visible time without replay or hidden-time catch-up. Repeated readiness
and painted events are idempotent. WebGL/Canvas failures log and bypass the cinematic; a missing
initial frame has an eight-second visible-attempt fallback; a stalled final-frame acknowledgement
has a two-second fallback. Critical entry failures or a
30-second readiness timeout offer a logged reload message, and a root LoadBoundary handles render
failures. Backend health, the assistant and below-fold assets never gate the intro. JavaScript-disabled
visitors get a GitHub alternative. Active WebGL stops the CSS fallback; static fallbacks have no
fullscreen blur or motion during the intro.

## Orbit Navigation

`Navbar` presents six section destinations in a floating dock above 1100px; the brand remains the
Home destination. The existing `useActiveSection` scroll listener also supplies the compact dock
state (64px on / 24px off). Section activation uses a 12px dead band, while explicit clicks and
history targets activate immediately. A single measured underline responds to active targets,
font readiness and navigation resize. The header reserves a constant height as its inner dock
contracts, preserving surrounding layout.

At 1100px and below, the compact brand/menu capsule opens a native modal exploration dialog.
The browser supplies focus containment and background isolation; the component owns scroll
locking, initial active-link focus, Escape/backdrop dismissal, breakpoint cleanup and trigger
restoration. Search closes the dialog and focuses the trigger before invoking the existing
palette, so its opener remains visible after dismissal. CSS opening/closing transitions use the
shared 240ms duration and respect system reduced motion. No additional scroll observers,
animation library, profile destinations or backend behavior are introduced.

## Infinite Universe environment

One persistent `Starfield` Canvas renders all four depth tiers, mixed ice-white/cyan/lavender stars,
clustered distributions, radial approach, lateral drift, near-camera dust and event-based meteors.
`ParticleUniverse` owns time, reusable particles and a bounded meteor pool; it has no React state,
independent timer or DOM animation. Small generated glow/trail/distant-galaxy textures are cached.
The distant sky also contains a faint constellation; all layers stay fixed behind content.

`UNIVERSE_PROFILES` in `VirtualCamera.ts` is the tuning source:

| Profile | Stars | Near particles | Main event gap | Maximum trails | Particle FPS target |
| --- | ---: | ---: | --- | ---: | ---: |
| Desktop (1024px+) | 620 | 12 | 2–4s | 3 | 60 |
| Tablet (768–1023px) | 400 | 8 | 3–5s | 2 | 30 |
| Mobile (below 768px) | 230 | 6 | 4–6s | 2 | 30 |

Occasional companions follow a main event by 0.4–0.9s (28% desktop, 16% tablet/mobile).
Events vary angle, side, speed, brightness, length and lifetime (1.3–2.45s); cached tapered tails
have bright heads. All effects remain behind text and controls. Four depth tiers survive adaptive
thinning to a 55% floor. Sustained slow RAF delivery reduces density in 15% steps before permitting
desktop's 30 FPS fallback. Canvas DPR caps are 1.5 desktop/tablet and 1.15 mobile.

The existing single WebGL mesh uses four three-octave noise fields for warped cloud bands,
filaments and dark dust lanes, rather than six fields at heavily attenuated opacity. Its updates
target 24 FPS above 768px and 20 FPS at 768px and below; resolution scales by 0.65 / 0.6 with DPR caps
1.25 / 1 at the same breakpoint. Shader uniform locations are cached. Context loss selects CSS atmosphere; restoration
rebuilds the same renderer's GPU resources. Fallbacks have no fullscreen blur.

`EnvironmentProvider` exposes a camera ref, not frame-by-frame React state. Motion smooths scroll
progress; Canvas and shader interpolate that shared target at depth-appropriate scales.
Fine-pointer desktop input changes the target only, with no mouse/orientation tracking dependency
on mobile. Autonomous drift and forward stellar motion continue without scrolling. Reduced motion
stops camera travel, twinkle, dust movement and meteor clocks, retaining the full static sky.
Visibility changes cancel RAF; resume resets timestamps without catching up hidden time.
Stellar Fold uses these same renderers through its 3200ms visibility/readiness gate.

Section-local fake starfields are removed from the timeline/contact atmosphere. A shared
`--cosmic-panel` provides local navy contrast without expensive backdrop blur. Hero copy has a
local contrast wash; cards, skills, timeline and contact use translucent surfaces. Project
illustrations share the cyan, royal-blue and violet accent tokens instead of warm or green lighting.
Dialogs, inputs, mobile navigation and the assistant retain their stronger readability layers
and existing behavior.

Below-fold sections retain their existing viewport/hash activation and minimum-height reservations.
Only pending activated imports show static skeletons. LoadBoundary isolates rejected section imports
with an anchored reload state rather than replacing the whole page. Optional Earth failures retain
the CSS globe; architecture failures retain a textual component list; failed search/case-study
imports provide dismiss/reload states. Errors are logged without exposing exception details in UI.

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

`App` owns a `React.lazy` command-palette boundary, opener reference and navigation
callbacks. Navbar receives generic open/prefetch callbacks, so shared UI never imports features.
Search hover/focus prefetches its chunk; startup does not. Ctrl/Cmd+K ignores input, textarea,
select and contenteditable targets. The native dialog owns scroll locking, opener focus return,
Escape/backdrop dismissal and a combobox/listbox with grouped, scored word/subsequence matches.
Arrow/Home/End order matches the rendered groups; Enter activates commands. Result counts use
a polite live region. Only section, project and profile/résumé link commands are included.

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
pauses CSS keyframes. Mobile widths up to 740px, OS reduced motion, data saving
and missing observers show the heading immediately. `#home-title` remains visible from first paint.

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

### Hero and direct contact

`src/lib/profile.ts` owns `PROFILE_LINKS`, `PUBLIC_EMAIL`, `RESUME_PATH` and `RESUME_FILENAME`.
Hero uses one H1, “I turn complex ideas into reliable software.”, an engineering/full-stack/AI
eyebrow and a brief backend, digital-experience and practical-AI introduction. “Explore my work”
and “Get in touch” retain native section anchors. The shared token layer carries navy, ivory,
lime and lavender throughout the portfolio; Hero no longer overrides global colour tokens.
Local Fontsource imports remain authoritative for Space Grotesk and Inter.

The right column is a contained `EngineeringConstellation` within the Hero module: decorative
SVG paths connect an engineering core to three ordinary, keyboard-accessible node links.
Backend links to Projects, Full-stack to Skills, and AI systems to AI Lab. A CSS opacity/scale
halo and a 42-second transform-only satellite share the existing `useInteractiveActivity` gate:
offscreen and hidden tabs pause motion; OS reduced motion, mobile-lite, data saving and missing
observers show a static fallback. Mobile hides only the satellite and scales the whole scene,
preserving all node text and actions. Its grid stacks below 740px. No per-frame React updates,
new provider, dependency or timer is introduced. The old hero-only planet, rings, satellite
tracks and nebula styles were removed. H1 entrance, heading ref and focus target remain intact.

The global particle renderer described above replaces the former three gutter-only CSS streaks.
It remains aria-hidden and pointer-transparent, independent of hero visibility or active section.
The shared `ResumeDownload` reads Vite's typed `__HAS_RESUME__` build-time flag, computed with
`fs.existsSync` against `public/resume.pdf`; it omits the link when the asset is absent. Tests
can stub the global flag for both branches. Adding or replacing the real PDF requires a rebuild.

Cosmic Pulse extends the existing `.button` utilities rather than introducing a separate theme:
Cosmic Energy uses a cyan surface and one-shot reflection; Orbital Glass uses a translucent
blue surface, a masked cyan/violet edge and a one-shot travelling edge signal; Signal Link
uses cyan text and a drawing underline. Shared targets remain 48px with 10px radii, 18px icons
and 240ms transitions. `.button-compact` uses 44px targets, and `.button-icon` retains square
geometry. Directional Lucide icons move along their indicated direction; other icons stay fixed.
Sweeps last 560ms once per hover/focus entry. Only hover-capable fine pointers receive hover
travel, while touch retains press feedback. No pointer tracking or new animation dependency is used.

`components/common/Button.tsx` adds native-button async presentation on these same utilities.
Its caller-controlled `state` drives loading or confirmed success; it never infers success.
Loading disables the native control and sets `aria-busy`. Idle, loading and success content
occupy the same CSS grid cell so the widest label reserves space without runtime measurement.
The loading indicator rotates only while pending and becomes static under OS reduced motion.
Contact retains its existing submission/flight lifecycle and live announcements; the assistant
retains its duplicate-request guard. Links, including downloads, remain native anchors.

Feature CSS owns layout, not button palettes. `.pulse-control` shares focus and tactile press
with composite command rows, timeline markers and skill planets while preserving their geometry and semantics.
The custom cursor no longer adds competing magnification to these controls. Focus outlines
remain independent of decoration. OS reduced motion disables sweeps, icon travel and control
transforms, retaining static edge illumination and readable states.

The public email is used only as the `mailto:` destination derived from `PUBLIC_EMAIL`, in
`footer-social-links` immediately after GitHub. Its visible and accessible label is “Gmail”,
with a decorative mail icon; the actual address is never rendered as portfolio copy.
The social navigation wraps on narrow screens. Résumé access remains in the footer and palette.
There is no shared email/copy widget or clipboard command. `App` passes startup health to Contact
as a prop. Only `UNAVAILABLE` displays a note directing visitors to the footer email link above
the still-enabled form; `CHECKING` and `UP` display no health note. Submission errors offer the
same footer guidance without duplicating the address or altering validation, values or flight state.

### Project case studies

Each project card has a case-study action alongside its existing repository/demo links.
`ProjectCaseStudy` uses a native modal dialog with Escape/backdrop dismissal, focus return,
background scroll locking and a short reduced-motion-aware fade/scale transition.
The dialog and `ArchitectureFlow` each have a `React.lazy` boundary. The flow renders labelled
lanes as ordered steps with CSS connectors: horizontal above 740px and vertical in the full-screen
mobile sheet. Visible desktop flows light nodes at 250ms intervals, with decorative packets moving
between them, once per opening. Replay remounts only the ordered lanes, preserving button focus.
CSS custom properties/keyframes animate only transforms and opacity. Effects pause when the flow
leaves the viewport, the tab is hidden, or the dialog exits. The OS motion
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

The Projects section ends at its five-card gallery. No standalone simulation, loading slot or
reserved simulation space remains. `ArchitectureFlow` remains lazy inside case studies.
`useInteractiveActivity` supplies intersection/tab visibility and mobile/static policy for the
architecture animation and footer clock.

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

- `App` composes the page. The inline startup controller owns Stellar Fold, its 3200ms
  minimum and the shell/hero readiness gate on all viewport sizes. Only OS reduced motion skips
  the cinematic. `useActiveSection` owns scroll/hash/history
  tracking. Pending explicit navigation remains authoritative until scrolling settles or user
  scrolling resumes. Scheduled history measurements are canceled on replacement and unmount.
- `PortfolioAssistant` owns panel presentation, focus trapping/restoration, Escape handling, and
  transcript scrolling. `useAssistantConversation` owns drafts, turns, follow-ups, pending/error
  state, duplicate prevention, and request cancellation on unmount.
- `CosmicContactSection` composes the form, envelope and Earth destination.
  `useContactTransmission` owns request/flight state, geometry measurement, observer cleanup, and
  successful reset. `CosmicContactForm` retains field validation and entered values on failure.
- `App` uses `useSystemReducedMotion` for section motion props. It calls Motion's
  `useReducedMotion() ?? false` and subscribes to the OS media query with `useSyncExternalStore`:
  the installed Motion version snapshots rather than updates its hook result on live changes.
  Shared reveals, cursor, scroll beam, backgrounds and intro use the same OS-only helper; CSS
  safeguards use `prefers-reduced-motion: reduce`. The subscription is cleaned up on unmount.
  There is no manual toggle, storage access, user preference hook or document preference
  attribute. OS reduced motion keeps the mesh on static CSS atmosphere and the starfield on one
  fully layered static Canvas frame. Mobile and data-saving modes do not disable the universe.
  The cursor, scroll beam, intro and continuous CSS flourishes are also disabled when effects
  are reduced by the system.
- `scheduleAfterIdle` uses `requestIdleCallback` with a bounded timeout and a timer fallback.
  Outside the cinematic, initial starfield animation and WebGL setup wait until idle;
  Stellar Fold starts the same renderers immediately and resumes them without reacquisition.
  Backend health warm-up and the configured assistant are also
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
  Live reduced-motion changes update the existing animation loop without rebuilding the renderer
  or reloading the texture. Three.js remains entirely outside the initial resource graph.
- `LazyMotion` loads its animation features asynchronously from `src/lib/motion-features.ts`.
  Hero copy is immediately visible on mobile, data-saving and reduced-motion configurations;
  desktop entrance motion and the engineering constellation remain in place.
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
defaults to `https://joefolio-backend.onrender.com` in production. Development requests use
`/backend`, forwarded by Vite to the configured target; deployed builds do not depend on this proxy.

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
posts `/api/chat`. Empty configuration hides the launcher without importing the interface.
Response/citation validation,
AbortSignal cancellation and assistant-specific errors are unchanged.

See [contact configuration](./contact-email.md) and [assistant contract](./ai-assistant-api.md).
Vite environment configuration is public; credentials belong only on the backend. Render must
allow the actual production origin; frontend code cannot grant CORS permission. Local Vite uses
a development-only server proxy instead of widening production CORS.

## CSS responsibilities

`main.tsx` imports global styles followed by utilities at the original stylesheet import position.
`global.css` imports the tokens first. Tokens, element resets, focus and reduced-motion defaults,
and shared section/button/form utilities are separate. The token layer owns palette, semantic
status colours, spacing, control dimensions, radii, borders, panel shadow and interaction timing.
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

`CosmicScrollProgress` adds a two-pixel primary/secondary progress beam driven by Motion `useScroll`
and `useSpring`, with no scroll-driven React state. It is omitted when effects are reduced.

`CosmicMagnifyingCursor` is a decorative overlay enabled only for fine hover-capable pointers
without reduced effects. It keeps the native cursor and focus rings, has `pointer-events: none`
and `aria-hidden`, and uses Motion values/springs rather than pointer-driven React state.
The lens and small radial spotlight do not sample or enlarge arbitrary underlying pixels.
Actual magnification applies to targeted elements: project cards 1.035, project visuals 1.10,
ordinary links/buttons outside Cosmic Pulse 1.04. Cosmic Pulse actions and skill planets are
excluded from cursor magnification; their own focus/press and selected-state styling is retained.

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

- Vite still reports the approximately 534kB deferred Earth chunk, mostly Three.js rendering and
  core code. Asynchronous Motion features reduce the entry module, but feature loading still
  contributes to startup work. Continue to profile runtime tasks before changing the
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
