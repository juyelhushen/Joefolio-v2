import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const observerAvailable = typeof IntersectionObserver !== 'undefined';
  const isVisible = visible || Boolean(reduceMotion) || !observerAvailable;

  useEffect(() => {
    if (reduceMotion || !observerAvailable) return;

    const element = elementRef.current;
    if (!element) return;

    let observer: IntersectionObserver | undefined;
    let fallbackTimer = 0;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisible(true);
            observer?.disconnect();
            window.clearTimeout(fallbackTimer);
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
      );
      observer.observe(element);
      fallbackTimer = window.setTimeout(() => setVisible(true), 2200);
    } catch (error) {
      console.warn('Scroll reveal is unavailable; showing content without animation.', error);
      observer?.disconnect();
      fallbackTimer = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, [observerAvailable, reduceMotion]);

  return (
    <motion.div
      className={className}
      ref={elementRef}
      initial={false}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={
        reduceMotion ? { duration: 0 } : { duration: 0.48, delay, ease: [0.22, 0.68, 0.2, 1] }
      }
      data-scroll-reveal=""
      data-revealed={isVisible ? 'true' : 'false'}
    >
      {children}
    </motion.div>
  );
}
