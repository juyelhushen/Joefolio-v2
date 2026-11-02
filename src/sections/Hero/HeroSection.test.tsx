import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { HERO_PROOF_LINE, RESUME_FILENAME, RESUME_PATH } from '../../lib/profile';
import HeroSection from './HeroSection';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('renders the verified proof between the intro and actions', () => {
  render(<HeroSection reduceMotion headingRef={null} />);
  const proof = screen.getByText(HERO_PROOF_LINE);
  expect(proof.previousElementSibling?.className).toBe('hero-intro');
  expect(proof.nextElementSibling?.className).toBe('hero-actions');
  expect(proof.querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
});

it.each([false, true])('gates the PDF download on build-time availability: %s', (available) => {
  vi.stubGlobal('__HAS_RESUME__', available);
  render(<HeroSection reduceMotion headingRef={null} />);
  const download = screen.queryByRole('link', { name: 'Download résumé (PDF)' });
  if (available) {
    expect(download?.getAttribute('href')).toBe(RESUME_PATH);
    expect(download?.getAttribute('download')).toBe(RESUME_FILENAME);
  } else {
    expect(download).toBeNull();
  }
  expect(screen.getByRole('link', { name: /Explore Projects/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: /Let’s connect/ })).toBeTruthy();
});
