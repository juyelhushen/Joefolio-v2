import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ThemeControls from './ThemeControls';

afterEach(() => {
  cleanup();
  document.documentElement.dataset.theme = 'dark';
  document.documentElement.dataset.accent = 'cyan';
  vi.restoreAllMocks();
});

it('toggles and persists the theme through the accessible pressed button', () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem');
  render(<ThemeControls />);

  const toggle = screen.getByRole('button', { name: 'Switch to light theme' });
  fireEvent.click(toggle);
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(
    screen.getByRole('button', { name: 'Switch to dark theme' }).getAttribute('aria-pressed'),
  ).toBe('true');
  expect(setItem).toHaveBeenCalledWith('portfolio-theme', 'light');
});

it('applies and persists a selected accent from the radio group', () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem');
  render(<ThemeControls />);
  fireEvent.click(screen.getByRole('button', { name: 'Choose accent colour' }));
  const radioGroup = screen.getByRole('radiogroup', { name: 'Accent colour' });
  expect(within(radioGroup).getAllByRole('radio')).toHaveLength(5);
  fireEvent.click(within(radioGroup).getByRole('radio', { name: 'Violet' }));

  expect(document.documentElement.dataset.accent).toBe('violet');
  expect(setItem).toHaveBeenCalledWith('portfolio-accent', 'violet');
  expect(screen.queryByRole('radiogroup')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Choose accent colour' }));
});

it('supports arrow-key navigation in the accent radio group', () => {
  render(<ThemeControls />);
  fireEvent.click(screen.getByRole('button', { name: 'Choose accent colour' }));
  const radioGroup = screen.getByRole('radiogroup', { name: 'Accent colour' });

  fireEvent.keyDown(radioGroup, { key: 'ArrowRight' });

  expect(document.documentElement.dataset.accent).toBe('violet');
  expect(
    within(radioGroup).getByRole('radio', { name: 'Violet' }).getAttribute('aria-checked'),
  ).toBe('true');
  expect(document.activeElement).toBe(within(radioGroup).getByRole('radio', { name: 'Violet' }));
});

it('keeps theme changes usable if local storage throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage unavailable');
  });
  render(<ThemeControls />);
  fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
  expect(document.documentElement.dataset.theme).toBe('light');
});
