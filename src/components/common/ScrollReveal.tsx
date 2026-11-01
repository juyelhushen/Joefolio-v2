import { useEffect, useRef, useState, type ReactNode, type ComponentProps } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { createRevealVariants, type ScrollRevealVariant } from './reveal-variants';

export type { ScrollRevealVariant } from './reveal-variants';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: ScrollRevealVariant;
  once?: boolean;
};

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  duration = 0.55,
  variant = 'fade-up',
  once = true,
}: ScrollRevealProps) {
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
            if (once) observer?.disconnect();
            window.clearTimeout(fallbackTimer);
          } else if (!once) {
            setVisible(false);
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
      );
      observer.observe(element);
      fallbackTimer = window.setTimeout(() => {
        setVisible(true);
        observer?.disconnect();
      }, 2200);
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
  }, [observerAvailable, reduceMotion, once]);

  return (
    <motion.div
      className={className}
      ref={elementRef}
      initial={false}
      animate={isVisible ? 'visible' : 'hidden'}
      variants={createRevealVariants(variant, duration, delay, Boolean(reduceMotion))}
      data-scroll-reveal=""
      data-revealed={isVisible ? 'true' : 'false'}
      data-reveal-variant={variant}
    >
      {children}
    </motion.div>
  );
}

type RevealItemProps = ComponentProps<typeof motion.div> & {
  variant?: Exclude<ScrollRevealVariant, 'stagger-container'>;
};

// Inherits the parent reveal labels; stagger children need no individual observers.
export const ScrollRevealItem = ({ variant = 'fade-up', ...props }: RevealItemProps) => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      {...props}
      variants={createRevealVariants(variant, 0.55, 0, Boolean(reducedMotion))}
      data-stagger-item=""
    />
  );
};
