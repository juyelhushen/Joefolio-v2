import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import './CosmicScrollProgress.css';

export default function CosmicScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 30 });
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className="cosmic-scroll-progress"
      aria-hidden="true"
      style={{ scaleX: reducedMotion ? scrollYProgress : progress }}
    />
  );
}
