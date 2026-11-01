import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import './CosmicMagnifyingCursor.css';

const POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const TARGET_SELECTOR = '[data-cursor-target], a[href], button:not(:disabled)';

export default function CosmicMagnifyingCursor() {
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const opacity = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 420, damping: 38, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 420, damping: 38, mass: 0.5 });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const pointer = window.matchMedia(POINTER_QUERY);
    const motionPreference = window.matchMedia(MOTION_QUERY);
    const update = () => setEnabled(pointer.matches && !motionPreference.matches);
    update();
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
    const clearTarget = () => {
      target?.classList.remove('is-cursor-target');
      target = null;
      anchor = null;
    };
    const hide = () => {
      opacity.set(0);
      positioned = false;
      clearTarget();
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
      const nextTarget = element?.closest<HTMLElement>(TARGET_SELECTOR) ?? null;
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
      }
      const magnetX = anchor ? Math.max(-60, Math.min(60, anchor.x - event.clientX)) * 0.12 : 0;
      const magnetY = anchor ? Math.max(-60, Math.min(60, anchor.y - event.clientY)) * 0.12 : 0;
      x.set(event.clientX + magnetX);
      y.set(event.clientY + magnetY);
      if (!positioned) {
        springX.jump(x.get());
        springY.jump(y.get());
        positioned = true;
      }
      opacity.set(1);
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
    };
  }, [enabled, opacity, x, y, springX, springY]);

  if (!enabled) return null;
  return (
    <motion.div
      className="cosmic-cursor"
      aria-hidden="true"
      style={{ x: springX, y: springY, opacity, pointerEvents: 'none' }}
    >
      <div className="cosmic-cursor-spotlight" />
      <div className="cosmic-cursor-lens">
        <span />
      </div>
    </motion.div>
  );
}
