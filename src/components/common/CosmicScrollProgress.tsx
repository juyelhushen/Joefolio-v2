import { useScroll, useSpring } from 'motion/react';
import { useSystemReducedMotion } from '../../hooks/useSystemReducedMotion';
import { m } from 'motion/react';
import './CosmicScrollProgress.css';

export default function CosmicScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 30 });
  const reducedEffects = useSystemReducedMotion();
  if (reducedEffects) return null;
  return (
    <m.div className="cosmic-scroll-progress" aria-hidden="true" style={{ scaleX: progress }} />
  );
}
