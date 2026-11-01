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
  as?: 'div' | 'article';
  'aria-labelledby'?: string;
  'data-cursor-target'?: string;
  role?: ComponentProps<'div'>['role'];
  'aria-label'?: string;
  'data-reduced-motion'?: string;
  id?: string;
  'aria-live'?: ComponentProps<'div'>['aria-live'];
};

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  duration = 0.75,
  variant = 'fade-up',
  once = true,
  as = 'div',
  ...attributes
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
    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisible(true);
            if (once) observer?.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
      );
      observer.observe(element);
    } catch (error) {
      console.warn('Scroll reveal is unavailable; showing content without animation.', error);
      observer?.disconnect();
      setVisible(true);
    }

    return () => {
      observer?.disconnect();
    };
  }, [observerAvailable, reduceMotion, once]);

  const RevealElement = as === 'article' ? motion.article : motion.div;
  return (
    <RevealElement
      {...attributes}
      className={className}
      ref={elementRef}
      initial={isVisible ? false : 'hidden'}
      animate={isVisible ? 'visible' : 'hidden'}
      variants={createRevealVariants(variant, duration, delay, Boolean(reduceMotion))}
      onFocusCapture={() => setVisible(true)}
      data-scroll-reveal=""
      data-revealed={isVisible ? 'true' : 'false'}
      data-reveal-variant={variant}
    >
      {children}
    </RevealElement>
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
