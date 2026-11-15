import { expect, it } from 'vitest';
import { getNavigationTarget } from './navigation-target';

it.each([
  ['#experience', 'about'],
  ['#skills', 'about'],
  ['#ai-lab', 'projects'],
  ['#projects/sentinel', 'projects'],
  ['#contact', 'contact'],
])('maps %s to the current page section %s', (hash, target) => {
  expect(getNavigationTarget(hash)).toBe(target);
});

it('returns null for an unknown anchor', () => {
  expect(getNavigationTarget('#not-a-section')).toBeNull();
});
