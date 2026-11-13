import { useEffect, useRef } from 'react';
import './Starfield.css';
import { useSystemReducedMotion } from '../../../hooks/useSystemReducedMotion';
import { scheduleAfterIdle } from '../../../lib/scheduleAfterIdle';
import { useEnvironment } from '../EnvironmentContext';
import { calculateRenderingProfile } from '../VirtualCamera';
import { ParticleUniverse, createSkyTextures } from './universe-particles';

export { advanceStars } from './universe-particles';
export type { Star } from './universe-particles';

type StarfieldProps = { paused?: boolean };

export default function Starfield({ paused = false }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useSystemReducedMotion();
  const { cameraRef } = useEnvironment();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      canvas.dataset.static = 'true';
      console.warn('Cosmic particle Canvas is unavailable; using the static sky.');
      window.dispatchEvent(new Event('stellar-fold-failed'));
      return;
    }
    let textures: ReturnType<typeof createSkyTextures>;
    try {
      textures = createSkyTextures();
    } catch (error) {
      canvas.dataset.static = 'true';
      console.warn('Cosmic particle textures failed; using the static sky.', error);
      window.dispatchEvent(new Event('stellar-fold-failed'));
      return;
    }
    delete canvas.dataset.static;
    let width = 0;
    let height = 0;
    let universe: ParticleUniverse;
    let profileWidth = 0;
    let raf = 0;
    let lastFrameAt = 0;
    let lastDrawAt = 0;
    let lastPaintAt = 0;
    let running = false;
    let slowFrames = 0;
    let thinningSteps = 0;
    let frameTarget = 60;
    let cancelIdle: (() => void) | undefined;
    let disposed = false;
    const isStatic = () => paused || reducedMotion;
    const holding = () =>
      Boolean(window.__STELLAR_FOLD__?.active && window.__STELLAR_FOLD__.elapsed >= 3200);
    const draw = (seconds: number) => {
      const fold = window.__STELLAR_FOLD__;
      if (!isStatic() && !fold?.active) universe.advance(seconds, cameraRef.current);
      universe.draw(
        ctx,
        textures.glow,
        textures.tail,
        textures.structures,
        isStatic(),
        fold?.active ? fold.elapsed : 3200,
      );
      if (fold?.active && fold.elapsed >= 3200 && !(fold.settled & 2)) {
        fold.settled |= 2;
        window.dispatchEvent(new Event('stellar-fold-settled'));
      }
      const events = String(universe.meteorEvents);
      if (canvas.dataset.events !== events) {
        canvas.dataset.events = events;
      }
      let active = 0;
      for (const meteor of universe.meteors) if (meteor.active) active++;
      const trails = String(active);
      if (canvas.dataset.trails !== trails) canvas.dataset.trails = trails;
    };
    const resize = () => {
      const nextWidth = document.documentElement.clientWidth || window.innerWidth;
      const nextHeight = window.innerHeight;
      const mobile = window.innerWidth < 768;
      const breakpoint = mobile ? 0 : window.innerWidth < 1024 ? 1 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.5);
      canvas.width = Math.max(1, Math.round(nextWidth * dpr));
      canvas.height = Math.max(1, Math.round(nextHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = nextWidth;
      height = nextHeight;
      if (!universe || profileWidth !== breakpoint) {
        const profile = calculateRenderingProfile({ width: window.innerWidth, height }, dpr, false);
        universe = new ParticleUniverse(width, height, profile);
        frameTarget = profile.frameRateTarget;
        profileWidth = breakpoint;
        canvas.dataset.stars = String(profile.starCount);
        canvas.dataset.profile = mobile ? 'mobile' : breakpoint === 1 ? 'tablet' : 'desktop';
      } else {
        universe.resize(width, height);
      }
      draw(0);
    };
    const tick = (now: number) => {
      if (disposed || document.hidden || isStatic()) {
        running = false;
        return;
      }
      const delta = now - lastFrameAt;
      lastFrameAt = now;
      const interval = 1000 / frameTarget;
      if (delta > interval * 1.7) {
        if (++slowFrames >= 16) {
          universe.reduceDensity();
          if (++thinningSteps >= 3 && frameTarget > 30) frameTarget = 30;
          slowFrames = 0;
        }
      } else slowFrames = Math.max(0, slowFrames - 1);
      const elapsed = now - lastDrawAt;
      if (elapsed >= interval - 0.5) {
        lastDrawAt += Math.max(1, Math.floor((elapsed + 0.5) / interval)) * interval;
        draw(Math.min((now - lastPaintAt) / 1000, 0.08));
        lastPaintAt = now;
        if (holding()) {
          running = false;
          return;
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    const start = () => {
      if (disposed) return;
      cancelIdle?.();
      cancelIdle = undefined;
      window.cancelAnimationFrame(raf);
      lastFrameAt = lastDrawAt = lastPaintAt = performance.now();
      running = !isStatic() && !document.hidden && !holding();
      if (running) raf = window.requestAnimationFrame(tick);
    };
    const scheduleStart = () => {
      if (disposed || running || cancelIdle || isStatic() || document.hidden) return;
      if (window.__STELLAR_FOLD__?.active) {
        start();
        return;
      }
      cancelIdle = scheduleAfterIdle(start, { timeout: 1200, fallbackDelay: 100 });
    };
    const onVisibilityChange = () => {
      window.cancelAnimationFrame(raf);
      running = false;
      cancelIdle?.();
      cancelIdle = undefined;
      if (!document.hidden) start();
    };
    resize();
    scheduleStart();
    window.addEventListener('resize', resize);
    window.addEventListener('cosmic-intro-complete', scheduleStart);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      disposed = true;
      cancelIdle?.();
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('cosmic-intro-complete', scheduleStart);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [cameraRef, paused, reducedMotion]);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
