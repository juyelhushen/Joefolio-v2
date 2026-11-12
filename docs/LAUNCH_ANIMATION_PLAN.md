# Cinematic Earth-to-Universe Landing Animation — Architecture & Implementation Plan

## Current State Assessment

### Existing Loader Infrastructure
- **Location:** `index.html` (inline startup-controller script)
- **Current Behaviour:** "JH Monogram" + "Signal map" animation
- **Duration:** Minimum 2000ms (enforced by `window.__PORTFOLIO_STARTUP__.ready()` mechanism)
- **Lifecycle:** 
  - Shows signal on page load
  - Waits for React app to call `.ready()`
  - Holds for 2000ms minimum total duration
  - Fades out (160ms transition)
  - Removes from DOM
- **Reduced-Motion:** Hides signal immediately, skips fade animation
- **Fallback Handling:** Shows "Could not start" message on critical errors

### Issues with Current Approach for Earth Loader
1. **Three.js Bundle Impact:** EarthGlobe component pulls in Three.js (~500KB+)
2. **HTML Inline:** Current loader is purely HTML/CSS/inline JS
3. **Need:** Lightweight Earth visualization without heavy dependencies

## Solution Architecture

### Design Decision: Canvas-based Earth + Starfield
- **Why:** No additional dependencies, leverages existing Canvas infrastructure
- **Approach:** 
  1. Create a lightweight Earth visualization using Canvas 2D or WebGL (existing Starfield already uses it)
  2. Render Earth as a sphere with atmospheric glow
  3. Use the existing Starfield component to render stars during transition
  4. All in the existing startup HTML/JS, no React component during loading

### Scene Breakdown

#### Scene 1: Earth (0–500ms)
- Full-screen canvas
- Earth positioned lower in viewport
- Blue atmospheric glow
- ~20-30 distant stars
- JH monogram overlay
- Static camera (observer on Earth)

#### Scene 2: Lift-off (500–1300ms)
- Camera begins translating away from Earth
- Earth moves down, recedes
- Atmospheric glow intensifies then fades
- Starfield gradually becomes more visible
- Optional subtle launch trail/particles

#### Scene 3: Breaking into Space (1300–1900ms)
- Smooth transition from atmospheric blue to deep space
- Earth becomes smaller, moves to lower-left
- More stars visible across viewport
- Particles pass viewer for depth perception
- No abrupt scene change

#### Scene 4: Entering Joefolio Universe (1900–2300ms)
- Earth fades to distant speck or disappears
- Full starfield visible
- Subtle nebula/gradient appears
- Smooth fade-out to show real portfolio background
- Hero section appears

### Technical Implementation Strategy

#### Component Structure
```
index.html
  ├─ startup-signal (existing HTML shell, hide it)
  ├─ launch-animation (new full-screen container)
  │  ├─ Canvas element (Earth + atmosphere + stars)
  │  └─ SVG overlay (optional: monogram, trail)
  └─ startup-controller (enhanced JS)
     ├─ Lifecycle management (2000ms minimum)
     ├─ Canvas rendering loop
     ├─ Animation state machine
     └─ Cleanup & handoff to React
```

#### Canvas Rendering Approach
- **Resolution:** Optimize for device pixel ratio (cap at 1.5x)
- **Frame Rate:** 60 FPS during animation (requestAnimationFrame)
- **Fallback:** Show existing signal animation if canvas unavailable
- **Cleanup:** Cancel RAF, remove canvas on animation complete

#### Earth Geometry
- **Approach:** Render sphere using parametric equations (no geometry library)
- **Visual:** 
  - Base sphere in blue tones
  - Gradient shading for depth
  - Subtle cloud/landmass texture overlay (optional, SVG or gradient)
  - Atmospheric halo using blur + layered circles
- **Size:** Responsive (larger on desktop, portrait on mobile)

#### Stars & Depth
- **Layering:** 
  - Far stars (very small, fade in slowly)
  - Mid-depth stars (medium, visible from start)
  - Near particles (pass near camera, depth blur effect)
- **Count:** ~50-150 stars depending on device
- **Parallax:** Stars at different depths move at different rates during lift-off

#### Animation Timing
```
Timeline (total 2300ms):
0ms      ├─ Scene 1: Earth (0–500ms)
         │  └─ Camera static, Earth static
         ├─ Scene 2: Lift-off (500–1300ms)
         │  └─ Camera Z position: 0 → 50000
         │  └─ Earth Y position: -1000 → -5000
500ms    │  └─ Atmospheric glow peak
         ├─ Scene 3: Breaking space (1300–1900ms)
         │  └─ Stars fully visible
         │  └─ Earth shrinking
         ├─ Scene 4: Joefolio universe (1900–2300ms)
         │  └─ Fade to portfolio background
1900ms   │
         └─ Fade complete, remove loader
2300ms
```

#### Lifecycle Integration
```
0ms:     Page load
         └─ Render Earth scene immediately
         └─ Start animation loop

Ready Event:
         ├─ App calls window.__PORTFOLIO_STARTUP__.ready()
         ├─ Animation continues (do NOT stop at 0.5s or interrupt)
         ├─ Record readiness time
         ├─ At 2300ms: Stop animation
         ├─ Fade loader overlay (160ms)
         ├─ Remove from DOM

If App Takes >2300ms:
         ├─ Animation completes normally
         ├─ Show final deep-space frame
         ├─ Keep canvas visible until app is ready
         ├─ Then fade and remove together
```

### Mobile Responsiveness Strategy

#### Portrait Orientation Adjustments
- **Earth Size:** Slightly smaller to fit portrait viewport
- **Camera Position:** Adjusted Z for portrait field-of-view
- **Star Density:** Same stars, same distribution (viewport crop)
- **Text:** JH monogram scales with viewport (clamp 36-64px)

#### Breakpoints
- **1440px:** Full desktop experience (widest Earth horizon)
- **1280px:** Desktop (slightly narrower)
- **768px:** Tablet (portrait + landscape)
- **390px:** Mobile (portrait focus)
- **360px:** Small mobile (extreme aspect ratio)

### Performance Constraints

#### Bundle Size Impact
- **No new dependencies** (Canvas 2D API is built-in)
- **New code size:** ~2-3KB (HTML + JS for animation logic)
- **Total startup JS increase:** Negligible (~0.5-1%)

#### Rendering Performance
- **Target:** 60 FPS on desktop, 30-60 FPS on mobile
- **Optimizations:**
  - Use `requestAnimationFrame` for sync with browser
  - Batch canvas draws
  - Avoid expensive operations (don't calculate all star positions every frame)
  - Use simple geometric rendering (circles, gradients, basic shapes)
  - No texture loading in startup path

#### Memory Management
- **Canvas cleanup:** Remove element from DOM immediately after animation
- **Event listeners:** Remove on animation complete
- **Timers:** Clear all requestAnimationFrame handles
- **No memory leaks:** Ensure proper cleanup before React mounts

### Accessibility & Reduced Motion

#### Reduced Motion Handling
- **Bypass:** Skip animation entirely, show portfolio immediately
- **No countdown:** No minimum 2000ms hold for reduced-motion users
- **Fallback:** Show existing signal animation (smooth, non-distracting)

#### Keyboard/Screen Reader
- **ARIA:** Use `role="presentation"` on loading canvas (non-essential animation)
- **No interaction:** Loading screen is purely visual, no buttons/inputs
- **Transition:** Smooth removal, no flashing

### Asset Strategy

#### No External Assets Required
- **Earth:** Render programmatically (no image files)
- **Stars:** Generated procedurally
- **Textures:** Optional CSS gradients overlay
- **Monogram:** Existing SVG in HTML, or render text on canvas

#### Optional Enhancements (Post-MVP)
- Low-resolution Earth texture (if size allows)
- Cloud overlay SVG (very small asset)
- Subtle glow particle shader (if WebGL available)

---

## Implementation Plan

### Phase 1: Canvas Setup & Earth Rendering
1. Create `LaunchAnimation` class (plain JS, no dependencies)
2. Setup canvas element (size, DPI)
3. Implement Earth sphere rendering (sphere geometry, shading)
4. Implement atmospheric glow (layered circles, blur effect)
5. Test at 1440px desktop

### Phase 2: Starfield & Depth
1. Implement star generation (procedural positions)
2. Implement star depth layers
3. Test layering and parallax visibility
4. Test at 1440px desktop

### Phase 3: Animation State Machine
1. Implement 4-scene timeline
2. Implement camera movement (Scene 2)
3. Implement Earth position/scale changes
4. Implement star visibility transitions
5. Implement atmospheric fade (Scene 3)
6. Test full 2300ms sequence

### Phase 4: Lifecycle Integration
1. Integrate with `window.__PORTFOLIO_STARTUP__` mechanism
2. Implement 2000ms minimum hold
3. Handle ready() before, during, after animation
4. Implement fade & removal on complete
5. Test with various timing scenarios

### Phase 5: Responsiveness
1. Adapt Earth size for mobile
2. Adjust camera FOV for portrait
3. Test all breakpoints (1440, 1280, 768, 390, 360)
4. Test landscape/portrait on mobile

### Phase 6: Reduced Motion & Accessibility
1. Detect prefers-reduced-motion
2. Skip animation, show portfolio immediately
3. Verify keyboard navigation unaffected
4. Verify screen reader behavior

### Phase 7: Error Handling & Fallback
1. Handle canvas unavailable
2. Fallback to existing signal animation
3. Handle animation errors gracefully
4. Test with DevTools canvas disabled

### Phase 8: Cleanup & Optimization
1. Measure bundle size impact
2. Optimize rendering performance
3. Profile memory usage
4. Clean up event listeners and timers
5. Final code review & testing

### Phase 9: Visual Verification & Polish
1. Review at 1440px (desktop)
2. Review at 390px (mobile)
3. Check transition to hero section (no flashing)
4. Check reduced motion handling
5. Verify background matching

### Phase 10: Final Testing & Build
1. Run npm run format, lint, typecheck, test, build
2. Test slow network scenarios
3. Test tab visibility changes
4. Verify no regressions in existing functionality
5. Documentation & summary

---

## Success Criteria

✅ **Cinematic Launch Sequence**
- Earth visible at start, cinematic glow
- Smooth camera travel away from Earth
- Stars progressively appear
- Atmospheric transition is smooth
- Portfolio background revealed cleanly

✅ **2-Second Lifecycle Preserved**
- Animation runs for ~2300ms
- Holds visible for minimum 2000ms
- Doesn't interrupt or restart during wait
- Cleans up properly on complete

✅ **Responsive Across All Breakpoints**
- 1440px: Full desktop experience
- 390px: Visible Earth, stars, complete sequence
- 360px: No horizontal overflow, complete animation

✅ **Performance**
- No new dependencies
- <2-3KB additional code
- 60 FPS on desktop, 30+ FPS on mobile
- Proper cleanup (no memory leaks)

✅ **Accessibility**
- Reduced motion: Skip animation, show portfolio
- No interaction required
- No flashing or jarring transitions
- Screen reader safe (non-essential animation)

✅ **Zero Regressions**
- All existing tests passing
- No changes to portfolio functionality
- Hero section works correctly after loader
- Chatbot and other features unaffected

---

## File Modifications Summary

### New Files
- (None - all code in index.html and startup-controller)

### Modified Files
- `index.html` — Enhance startup-controller script with canvas rendering, animation state machine
- `src/styles/global.css` — Optional: Add CSS classes for launch animation container
- No changes to React components (loader is pre-React)

### Deleted Files
- None

---

## Risk Mitigation

**Risk:** Canvas drawing performance poor on mobile
**Mitigation:** Optimize vertex count, use simpler rendering, target 30 FPS on mobile

**Risk:** Canvas unavailable (unusual browser or security settings)
**Mitigation:** Fallback to existing signal animation, graceful degradation

**Risk:** Animation doesn't sync with hero section background
**Mitigation:** Use exact same colour palette and gradient, test transition visually

**Risk:** Memory leak in animation loop
**Mitigation:** Strict cleanup - cancel RAF, remove element, clear references

**Risk:** Breaks StrictMode double-rendering
**Mitigation:** Guard state and handlers against double-call (already tested in startup tests)

---

**Next Step:** Proceed to implementation Phase 1 (Canvas Setup & Earth Rendering)

