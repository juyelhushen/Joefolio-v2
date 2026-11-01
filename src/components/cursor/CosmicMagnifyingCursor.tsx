import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import './CosmicMagnifyingCursor.css';
import { createPortal } from 'react-dom';

const POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const TARGET_SELECTOR = '[data-cursor-target], a[href], button:not(:disabled)';

export default function CosmicMagnifyingCursor() {
  const [overlayHost, setOverlayHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let active = true;
    const changeHost = (event: Event) => {
      if (event instanceof CustomEvent) {
        setOverlayHost(event.detail instanceof HTMLElement ? event.detail : null);
      }
    };
    document.addEventListener('cosmic-overlay-host', changeHost);
    queueMicrotask(() => {
      if (active) setOverlayHost(document.querySelector<HTMLDialogElement>('dialog[open]'));
    });
    return () => {
      active = false;
      document.removeEventListener('cosmic-overlay-host', changeHost);
    };
  }, []);
  const [enabled, setEnabled] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia(POINTER_QUERY).matches &&
      !window.matchMedia(MOTION_QUERY).matches,
  );
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const opacity = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 420, damping: 38, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 420, damping: 38, mass: 0.5 });
  const trailX = useSpring(x, { stiffness: 150, damping: 28 });
  const trailY = useSpring(y, { stiffness: 150, damping: 28 });
  const ghostX = useSpring(x, { stiffness: 90, damping: 25 });
  const ghostY = useSpring(y, { stiffness: 90, damping: 25 });
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const pointer = window.matchMedia(POINTER_QUERY);
    const motionPreference = window.matchMedia(MOTION_QUERY);
    const update = () => setEnabled(pointer.matches && !motionPreference.matches);
    pointer.addEventListener('change', update);
    motionPreference.addEventListener('change', update);
    return () => {
      pointer.removeEventListener('change', update);
      motionPreference.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      opacity.set(0);
      return;
    }
    let target: HTMLElement | null = null;
    let anchor: { x: number; y: number } | null = null;
    let dragging = false;
    let positioned = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let pointerElement: Element | null = null;
    const clearTarget = () => {
      target?.classList.remove('is-cursor-target');
      target = null;
      anchor = null;
    };
    const hide = () => {
      opacity.set(0);
      scannerRef.current?.setAttribute('data-moving', 'false');
      if (idleTimer) clearTimeout(idleTimer);
      positioned = false;
      clearTarget();
      pointerElement = null;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || dragging || event.buttons !== 0) {
        hide();
        return;
      }
      const element = event.target instanceof Element ? event.target : null;
      if (element?.closest('input, textarea, [contenteditable="true"]')) {
        hide();
        return;
      }
      const nextTarget =
        element === pointerElement
          ? target
          : (element?.closest<HTMLElement>(TARGET_SELECTOR) ?? null);
      pointerElement = element;
      if (nextTarget !== target) {
        clearTarget();
        target = nextTarget;
        if (target) {
          // Read once at target entry, before writes; never measure on every pointer frame.
          const bounds = target.getBoundingClientRect();
          if (target.matches('a, button') && !target.matches('.skill-orbit-planet')) {
            anchor = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
          }
          target.classList.add('is-cursor-target');
        }
        const mode = target?.matches('.skill-orbit-planet')
          ? 'planet'
          : target?.dataset.cursorTarget === 'image'
            ? 'image'
            : target?.dataset.cursorTarget === 'card'
              ? 'inspect'
              : target
                ? 'interactive'
                : 'default';
        scannerRef.current?.setAttribute('data-mode', mode);
      }
      const magnetX = anchor ? Math.max(-60, Math.min(60, anchor.x - event.clientX)) * 0.12 : 0;
      const magnetY = anchor ? Math.max(-60, Math.min(60, anchor.y - event.clientY)) * 0.12 : 0;
      x.set(event.clientX + magnetX);
      y.set(event.clientY + magnetY);
      if (!positioned) {
        springX.jump(x.get());
        springY.jump(y.get());
        trailX.jump(x.get());
        trailY.jump(y.get());
        ghostX.jump(x.get());
        ghostY.jump(y.get());
        positioned = true;
      }
      opacity.set(1);
      scannerRef.current?.setAttribute('data-moving', 'true');
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => scannerRef.current?.setAttribute('data-moving', 'false'), 180);
    };
    const down = () => {
      dragging = true;
      hide();
    };
    const up = () => {
      dragging = false;
    };
    const blur = () => {
      dragging = false;
      hide();
    };
    const exit = (event: PointerEvent) => {
      if (!event.relatedTarget) hide();
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', hide);
    document.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointerup', up, { passive: true });
    document.addEventListener('pointerout', exit, { passive: true });
    document.addEventListener('pointercancel', blur, { passive: true });
    window.addEventListener('blur', blur);
    window.addEventListener('scroll', hide, { passive: true });
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', hide);
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointerout', exit);
      document.removeEventListener('pointercancel', blur);
      window.removeEventListener('blur', blur);
      window.removeEventListener('scroll', hide);
      hide();
      springX.stop();
      springY.stop();
      trailX.stop();
      trailY.stop();
      ghostX.stop();
      ghostY.stop();
    };
  }, [enabled, opacity, x, y, springX, springY, trailX, trailY, ghostX, ghostY]);

  if (!enabled) return null;
  return createPortal(
    <>
      <motion.div
        className="cosmic-cursor-ghost"
        aria-hidden="true"
        style={{ x: trailX, y: trailY, opacity, pointerEvents: 'none' }}
      />
      <motion.div
        className="cosmic-cursor-ghost cosmic-cursor-ghost-far"
        aria-hidden="true"
        style={{ x: ghostX, y: ghostY, opacity, pointerEvents: 'none' }}
      />
      <motion.div
        ref={scannerRef}
        className="cosmic-cursor"
        aria-hidden="true"
        data-mode="default"
        data-moving="false"
        style={{ x: springX, y: springY, opacity, pointerEvents: 'none' }}
      >
        <div className="cosmic-cursor-spotlight" />
        <div className="cosmic-cursor-lens">
          <svg className="scanner-orbit" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth=".8" />
            <circle
              cx="50"
              cy="50"
              r="39"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="18 9 3 12"
            />
            <circle cx="50" cy="4" r="2.5" fill="currentColor" />
            <circle cx="90" cy="73" r="1.5" fill="currentColor" />
          </svg>
          <svg className="scanner-brackets" viewBox="0 0 100 100" fill="none">
            <path
              d="M25 12H12v13M75 12h13v13M12 75v13h13M88 75v13H75"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <div className="scanner-beam" />
          <svg className="scanner-reticle" viewBox="0 0 24 24" fill="none">
            <path
              d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"
              stroke="currentColor"
            />
            <path d="M12 0v5m0 14v5M0 12h5m14 0h5" stroke="currentColor" />
          </svg>
          <span className="scanner-label scanner-inspect">INSPECT</span>
          <span className="scanner-label scanner-zoom">+ ZOOM</span>
        </div>
      </motion.div>
    </>,
    overlayHost ?? document.body,
  );
}
