import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly scrollMargin = '0px';
  readonly thresholds: number[] = [];

  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

function renderApp() {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  return render(<App />);
}

it('opens and closes the mobile navigation menu', () => {
  renderApp();

  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  expect(screen.getByRole('navigation', { name: 'Main navigation' }).className).toContain(
    'is-open',
  );
  expect(screen.getByRole('button', { name: 'Close menu' }).getAttribute('aria-expanded')).toBe(
    'true',
  );

  expect(screen.getByRole('link', { name: /Explore Projects/ }).getAttribute('href')).toBe(
    '#projects',
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('navigation', { name: 'Main navigation' }).className).not.toContain(
    'is-open',
  );
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open menu' }));

  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  expect(screen.getByRole('navigation', { name: 'Main navigation' }).className).not.toContain(
    'is-open',
  );
});

it('renders documented projects with links to their repositories', () => {
  renderApp();

  expect(screen.getByRole('heading', { level: 3, name: 'Sentinel' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 3, name: 'Cut2Short' })).toBeTruthy();
  expect(
    screen.getByRole('heading', { level: 3, name: 'Enterprise Knowledge Assistant' }),
  ).toBeTruthy();
  expect(screen.queryByRole('heading', { level: 3, name: 'Finmart' })).toBeNull();

  const projectLinks = screen
    .getAllByRole('link')
    .filter((link) => link.classList.contains('project-link'));

  expect(projectLinks.map((link) => link.getAttribute('href'))).toEqual([
    'https://github.com/juyelhushen/sentinel',
    'https://github.com/juyelhushen/Cut2Short-backend',
    'https://github.com/juyelhushen/cut2short-front',
    'https://github.com/juyelhushen/enterprise-knowledge-assistant',
  ]);
  expect(screen.getByRole('link', { name: 'Sentinel: Repository' })).toBeTruthy();
  expect(
    screen.getByRole('link', { name: 'Enterprise Knowledge Assistant: Repository' }),
  ).toBeTruthy();
  expect(projectLinks.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(
    true,
  );
});
