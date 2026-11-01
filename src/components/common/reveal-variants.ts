import type { Variants } from 'motion/react';

export type ScrollRevealVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'scale-up'
  | 'blur-reveal'
  | 'stagger-container';

export const createRevealVariants = (
  variant: ScrollRevealVariant,
  duration = 0.75,
  delay = 0,
  reducedMotion = false,
): Variants => {
  const hidden = {
    opacity: variant === 'stagger-container' ? 1 : 0,
    x: variant === 'fade-left' ? -38 : variant === 'fade-right' ? 38 : 0,
    y: variant === 'fade-up' ? 40 : variant === 'fade-down' ? -40 : 0,
    scale: variant === 'stagger-container' ? 1 : 0.97,
    ...(variant === 'blur-reveal' ? { filter: 'blur(4px)' } : {}),
  };
  const visible = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    ...(variant === 'blur-reveal' ? { filter: 'blur(0px)' } : {}),
  };
  return {
    hidden: reducedMotion ? visible : hidden,
    visible: {
      ...visible,
      transition: {
        duration: reducedMotion ? 0 : duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.22, 0.68, 0.2, 1],
        ...(variant === 'stagger-container' ? { staggerChildren: reducedMotion ? 0 : 0.11 } : {}),
      },
    },
  };
};
