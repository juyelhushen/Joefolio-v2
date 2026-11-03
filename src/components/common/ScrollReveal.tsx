import { useEffect, useRef, useState, type ReactNode, type ComponentProps } from 'react';
import { m } from 'motion/react';
import { useSystemReducedMotion } from '../../hooks/useSystemReducedMotion';
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
  headingReveal?: boolean;
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
  headingReveal = false,
  ...attributes
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const reducedEffects = useSystemReducedMotion();
  const [visible, setVisible] = useState(false);
  const observerAvailable = typeof IntersectionObserver !== 'undefined';
  const headingStatic =
    headingReveal &&
    (reducedEffects ||
      !observerAvailable ||
      Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
      ));
  const isVisible = visible || reducedEffects || !observerAvailable || headingStatic;

  useEffect(() => {
    if (reducedEffects || !observerAvailable || headingStatic) return;

    const element = elementRef.current;
    if (!element) return;

    let observer: IntersectionObserver | undefined;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (headingReveal)
            element.dataset.headingVisible = String(entries.some((entry) => entry.isIntersecting));
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisible(true);
            if (once && !headingReveal) observer?.disconnect();
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

    const updatePause = () => {
      if (headingReveal) element.dataset.headingPaused = String(document.hidden);
    };
    if (headingReveal) {
      updatePause();
      document.addEventListener('visibilitychange', updatePause);
    }
    return () => {
      observer?.disconnect();
      if (headingReveal) document.removeEventListener('visibilitychange', updatePause);
    };
  }, [observerAvailable, reducedEffects, once, headingReveal, headingStatic]);

  const RevealElement = as === 'article' ? m.article : m.div;
  return (
    <RevealElement
      {...attributes}
      className={className}
      ref={elementRef}
      initial={isVisible ? false : 'hidden'}
      animate={isVisible ? 'visible' : 'hidden'}
      variants={createRevealVariants(variant, duration, delay, reducedEffects || headingStatic)}
      onFocusCapture={() => setVisible(true)}
      data-scroll-reveal=""
      data-revealed={isVisible ? 'true' : 'false'}
      data-reveal-variant={variant}
      data-heading-reveal={headingReveal ? 'true' : undefined}
      data-heading-static={headingStatic ? 'true' : undefined}
    >
      {children}
    </RevealElement>
  );
}

type RevealItemProps = ComponentProps<typeof m.div> & {
  variant?: Exclude<ScrollRevealVariant, 'stagger-container'>;
};

// Inherits the parent reveal labels; stagger children need no individual observers.
export const ScrollRevealItem = ({ variant = 'fade-up', ...props }: RevealItemProps) => {
  const reducedEffects = useSystemReducedMotion();
  return (
    <m.div
      {...props}
      variants={createRevealVariants(variant, 0.55, 0, reducedEffects)}
      data-stagger-item=""
    />
  );
};
