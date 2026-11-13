/**
 * VirtualCamera.ts
 *
 * Core parallax mathematics and virtual camera state management.
 * Coordinates parallax motion across all background depth layers.
 *
 * The virtual camera moves forward through space as the user scrolls.
 * Each layer responds differently based on its parallax factor:
 * - parallax_factor = 0.02 (far stars): moves slowly, creates depth
 * - parallax_factor = 0.6 (mid stars): moves faster, feels closer
 */

export interface CameraState {
  /** Scroll progress: 0 (top) to 1 (bottom) */
  scrollProgress: number;
  /** Camera Z position in virtual space (0 = near, 50000 = far) */
  cameraZ: number;
  /** Subtle mouse parallax offset on desktop: -1 to 1 */
  parallaxOffsetX: number;
  parallaxOffsetY: number;
  /** Reduced motion preference */
  reducedMotion: boolean;
}

export interface LayerTransform {
  /** Horizontal pixel offset due to parallax */
  offsetX: number;
  /** Vertical pixel offset due to parallax */
  offsetY: number;
  /** Opacity multiplier (for fade effects) */
  opacity: number;
  /** Scale multiplier (for depth-based sizing) */
  scale: number;
}

/**
 * Configuration for a depth layer in the universe
 */
export interface DepthLayer {
  name: string;
  /** Parallax factor: 0 (far, barely moves) to 1 (very close, moves a lot) */
  parallaxFactor: number;
  /** Depth z-index for CSS stacking */
  zIndex: number;
}

// Define all 10 depth layers with their parallax characteristics
// Note: z-indices are in REVERSE order: far space (layer 10) has highest zIndex
// This creates depth perception where far elements appear behind near elements
export const DEPTH_LAYERS: Record<string, DepthLayer> = {
  // Layer 10: Far space (CSS-based subtle stars) — lowest visual priority (behind everything)
  FAR_SPACE: {
    name: 'Far Space / Distant Stars',
    parallaxFactor: 0.02,
    zIndex: 100,
  },
  // Layer 9: Galactic atmosphere and nebula (WebGL procedural shader)
  GALACTIC_ATMOSPHERE: {
    name: 'Galactic Atmosphere / Nebula',
    parallaxFactor: 0.1,
    zIndex: 200,
  },
  // Layer 8: Mid-space star clusters (Canvas 2D particles)
  MID_SPACE_STARS: {
    name: 'Mid-Space Star Clusters',
    parallaxFactor: 0.6,
    zIndex: 300,
  },
  // Layer 7: Particle field / twinkling dust (Canvas 2D)
  PARTICLE_FIELD: {
    name: 'Particle Field / Twinkling Dust',
    parallaxFactor: 0.5,
    zIndex: 250,
  },
  // Layer 6: Atmospheric lighting / volumetric mist (CSS)
  ATMOSPHERIC_LIGHTING: {
    name: 'Atmospheric Lighting / Volumetric Mist',
    parallaxFactor: 0.15,
    zIndex: 150,
  },
  // Layer 5: Section constellations (SVG overlays, per-section)
  SECTION_CONSTELLATIONS: {
    name: 'Section Constellations',
    parallaxFactor: 0.3,
    zIndex: 350,
  },
};

/**
 * Calculate camera state from scroll progress and mouse position.
 * This is the core function that drives all parallax calculations.
 */
export function calculateCameraState(
  scrollProgress: number,
  mouseX: number = 0.5,
  mouseY: number = 0.5,
  reducedMotion: boolean = false,
): CameraState {
  // Clamp scroll progress to [0, 1]
  const clampedScrollProgress = Math.max(0, Math.min(1, scrollProgress));

  // Camera Z position: 0 (near) to 50000 (far)
  // This represents the camera's forward movement through space
  const cameraZ = clampedScrollProgress * 50000;

  // Desktop mouse parallax: subtle wobble based on cursor position
  // mouseX and mouseY are normalized to [0, 1] (0 = left/top, 1 = right/bottom)
  // Convert to [-1, 1] range, then scale for subtle effect
  let parallaxOffsetX = 0;
  let parallaxOffsetY = 0;

  if (!reducedMotion) {
    // ±2% horizontal, ±1% vertical wobble range
    parallaxOffsetX = (mouseX * 2 - 1) * 0.02;
    parallaxOffsetY = (mouseY * 2 - 1) * 0.01;
  }

  return {
    scrollProgress: clampedScrollProgress,
    cameraZ,
    parallaxOffsetX,
    parallaxOffsetY,
    reducedMotion,
  };
}

/**
 * Calculate the visual transform for a layer given camera state.
 * This accounts for parallax depth, mouse interaction, and reduced motion.
 */
export function calculateLayerTransform(
  layer: DepthLayer,
  cameraState: CameraState,
  viewportWidth: number,
  viewportHeight: number,
): LayerTransform {
  // Base parallax offset: deeper layers (higher parallax factor) move more
  // Scale: 0.0001 converts camera Z (0–50000) to pixel offsets (0–5px typical)
  const baseOffsetX = cameraState.reducedMotion
    ? 0
    : cameraState.cameraZ * layer.parallaxFactor * 0.0001;
  const baseOffsetY = cameraState.reducedMotion
    ? 0
    : cameraState.cameraZ * layer.parallaxFactor * 0.00005;

  // Add mouse parallax wobble (only to mid/near layers)
  // Far layers (factor < 0.2) are not affected by mouse movement
  let mouseWobbleX = 0;
  let mouseWobbleY = 0;
  if (layer.parallaxFactor > 0.2 && !cameraState.reducedMotion) {
    // Mouse wobble is proportional to parallax factor
    // Closer layers (higher factor) are affected more
    mouseWobbleX = cameraState.parallaxOffsetX * viewportWidth * layer.parallaxFactor;
    mouseWobbleY = cameraState.parallaxOffsetY * viewportHeight * layer.parallaxFactor * 0.5;
  }

  // Combined offset (scroll parallax + mouse wobble)
  const offsetX = baseOffsetX + mouseWobbleX;
  const offsetY = baseOffsetY + mouseWobbleY;

  // Opacity fade: far layers fade to 0.3, mid layers to 0.8, near layers to 1.0
  // This creates a slight depth-haze effect
  const opacityFromDepth = 0.3 + layer.parallaxFactor * 0.7; // [0.3, 1.0]

  // Optional scale effect: very subtle perspective scaling
  // Far layers appear slightly smaller, near layers slightly larger
  const scaleFromDepth = 1 + (layer.parallaxFactor - 0.5) * 0.02; // [0.99, 1.01]

  return {
    offsetX,
    offsetY,
    opacity: opacityFromDepth,
    scale: scaleFromDepth,
  };
}

/**
 * Apply a camera transform to a canvas context.
 * Useful for rendering with parallax on Canvas 2D.
 */
export function applyCameraTransformToCanvas(
  ctx: CanvasRenderingContext2D,
  transform: LayerTransform,
): void {
  ctx.save();
  ctx.translate(transform.offsetX, transform.offsetY);
  ctx.scale(transform.scale, transform.scale);
  ctx.globalAlpha *= transform.opacity;
}

/**
 * Get CSS transform string for a layer element.
 * Apply this to an HTML element to position it with parallax.
 */
export function getCSSTransform(transform: LayerTransform): string {
  return `translate3d(${transform.offsetX.toFixed(2)}px, ${transform.offsetY.toFixed(2)}px, 0) scale(${transform.scale.toFixed(4)})`;
}

/**
 * Get CSS filter string for opacity adjustment.
 */
export function getCSSOpacity(transform: LayerTransform): number {
  return transform.opacity;
}

/**
 * Determine rendering profile based on device capabilities.
 * Returns quality hints for optimization decisions.
 */
export interface RenderingProfile {
  quality: 'low' | 'medium' | 'high';
  particleScale: number; // Multiplier for particle counts
  frameRateTarget: number; // Target FPS
  enableWebGL: boolean; // Whether to use WebGL vs CSS fallback
  enableMouseParallax: boolean; // Whether desktop mouse tracking is active
  starCount: number;
  nearParticleCount: number;
  meteorInterval: readonly [number, number];
  maxMeteors: number;
}

export const UNIVERSE_PROFILES = {
  desktop: { starCount: 620, nearParticleCount: 12, meteorInterval: [2, 4], maxMeteors: 3 },
  tablet: { starCount: 400, nearParticleCount: 8, meteorInterval: [3, 5], maxMeteors: 2 },
  mobile: { starCount: 230, nearParticleCount: 6, meteorInterval: [4, 6], maxMeteors: 2 },
} as const;

export function calculateRenderingProfile(
  viewport: { width: number; height: number },
  _devicePixelRatio: number,
  reducedMotion: boolean,
): RenderingProfile {
  const isMobile = viewport.width < 768;
  const isTablet = viewport.width >= 768 && viewport.width < 1024;
  const particles = UNIVERSE_PROFILES[isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'];

  if (reducedMotion) {
    return {
      quality: 'low',
      ...particles,
      particleScale: 1,
      frameRateTarget: 0,
      enableWebGL: false,
      enableMouseParallax: false,
    };
  }

  if (isMobile) {
    // Mobile: lightweight rendering
    return {
      quality: 'medium',
      ...particles,
      particleScale: 1,
      frameRateTarget: 30,
      enableWebGL: true, // Try WebGL but fallback to CSS
      enableMouseParallax: false, // No touch parallax
    };
  }

  if (isTablet) {
    // Tablet: balanced rendering
    return {
      quality: 'high',
      ...particles,
      particleScale: 1,
      frameRateTarget: 30,
      enableWebGL: true,
      enableMouseParallax: false, // Optional: could enable for large tablets
    };
  }

  // Desktop: full quality
  return {
    quality: 'high',
    ...particles,
    particleScale: 1.0,
    frameRateTarget: 60,
    enableWebGL: true,
    enableMouseParallax: true,
  };
}
