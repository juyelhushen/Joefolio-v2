import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import EffectsPreferenceToggle from '../components/common/EffectsPreferenceToggle';
import { setReducedEffects, useEffectsPreference } from './useEffectsPreference';

function PreferenceOutput() {
  const { reducedEffects } = useEffectsPreference();
  return <output>{String(reducedEffects)}</output>;
}

afterEach(() => {
  cleanup();
  setReducedEffects(false);
  localStorage.removeItem('joefolio-reduce-effects');
  Reflect.deleteProperty(navigator, 'connection');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function resetExplicitPreference() {
  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'joefolio-reduce-effects',
        oldValue: 'false',
        newValue: null,
      }),
    );
  });
}

it('defaults to reduced effects when the operating system requests it', () => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: media.includes('prefers-reduced-motion'),
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  render(<PreferenceOutput />);
  resetExplicitPreference();

  expect(screen.getByText('true')).toBeTruthy();
});

it('defaults to reduced effects when the connection requests data saving', () => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: {
      saveData: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
  render(<PreferenceOutput />);
  resetExplicitPreference();

  expect(screen.getByText('true')).toBeTruthy();
});

it('persists and synchronizes the explicit choice across toggle consumers', () => {
  render(
    <>
      <EffectsPreferenceToggle />
      <PreferenceOutput />
    </>,
  );
  const toggle = screen.getByRole('button', { name: 'Reduce effects' });
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByText('false')).toBeTruthy();

  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByText('true')).toBeTruthy();
  expect(localStorage.getItem('joefolio-reduce-effects')).toBe('true');
  expect(document.documentElement.dataset.effectsReduced).toBe('true');
});

it('uses an explicit choice even when the OS requests reduced motion', () => {
  const originalMatchMedia = window.matchMedia;
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: media.includes('prefers-reduced-motion'),
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  act(() => setReducedEffects(false));
  render(<PreferenceOutput />);

  expect(screen.getByText('false')).toBeTruthy();
  expect(document.documentElement.dataset.effectsReduced).toBe('false');
  vi.stubGlobal('matchMedia', originalMatchMedia);
});
