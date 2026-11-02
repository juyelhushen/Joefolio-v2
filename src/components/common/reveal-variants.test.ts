import { expect, it } from 'vitest';
import { createRevealVariants, type ScrollRevealVariant } from './reveal-variants';

it.each([
  ['fade-up', 'y', 40],
  ['rise', 'y', 40],
  ['fade-down', 'y', -40],
  ['fade-left', 'x', -38],
  ['fade-right', 'x', 38],
  ['scale-up', 'scale', 0.97],
  ['blur-reveal', 'filter', 'blur(4px)'],
] as const)('configures %s without changing layout geometry', (variant, property, value) => {
  expect(createRevealVariants(variant).hidden).toMatchObject({
    opacity: variant === 'rise' ? 1 : 0,
    [property]: value,
  });
  expect(createRevealVariants(variant).visible).toMatchObject({ opacity: 1, x: 0, y: 0, scale: 1 });
});

it('uses a 110ms stagger with configurable timing', () => {
  expect(createRevealVariants('stagger-container', 0.7, 0.1).visible).toMatchObject({
    transition: { duration: 0.7, delay: 0.1, staggerChildren: 0.11 },
  });
});

it('keeps the hero heading visible while applying its transform entrance', () => {
  expect(createRevealVariants('rise').hidden).toMatchObject({ opacity: 1, y: 40 });
});

it.each([
  'fade-up',
  'rise',
  'fade-down',
  'fade-left',
  'fade-right',
  'scale-up',
  'blur-reveal',
  'stagger-container',
] satisfies ScrollRevealVariant[])('shows %s immediately for reduced motion', (variant) => {
  const variants = createRevealVariants(variant, 0.55, 0.1, true);
  expect(variants.hidden).toMatchObject({ opacity: 1, x: 0, y: 0, scale: 1 });
  expect(variants.visible).toMatchObject({ transition: { duration: 0, delay: 0 } });
});
