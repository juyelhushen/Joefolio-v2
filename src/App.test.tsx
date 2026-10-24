import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

  const projectSection = within(screen.getByRole('region', { name: /Selected work/ }));
  expect(projectSection.getByRole('heading', { level: 3, name: 'Sentinel' })).toBeTruthy();
  expect(projectSection.getByRole('heading', { level: 3, name: 'Cut2Short' })).toBeTruthy();
  expect(
    projectSection.getByRole('heading', { level: 3, name: 'Enterprise Knowledge Assistant' }),
  ).toBeTruthy();
  expect(projectSection.queryByRole('heading', { level: 3, name: 'Finmart' })).toBeNull();

  const projectLinks = projectSection
    .getAllByRole('link')
    .filter((link) => link.classList.contains('project-link'));

  expect(projectLinks.map((link) => link.getAttribute('href'))).toEqual([
    'https://github.com/juyelhushen/sentinel',
    'https://github.com/juyelhushen/Cut2Short-backend',
    'https://github.com/juyelhushen/cut2short-front',
    'https://github.com/juyelhushen/enterprise-knowledge-assistant',
  ]);
  expect(projectSection.getByRole('link', { name: 'Sentinel: Repository' })).toBeTruthy();
  expect(
    projectSection.getByRole('link', { name: 'Enterprise Knowledge Assistant: Repository' }),
  ).toBeTruthy();
  expect(projectLinks.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(
    true,
  );
});

it('grounds the AI Lab in documented projects and their verified repositories', () => {
  renderApp();

  const aiLab = within(screen.getByRole('region', { name: /Engineering with/ }));
  expect(aiLab.getByRole('heading', { level: 3, name: 'Sentinel' })).toBeTruthy();
  expect(
    aiLab.getByText(/Repair and verification are documented as an internal constrained workflow/),
  ).toBeTruthy();
  expect(
    aiLab.getByText(/PDF ingestion, chunking, and embeddings feed a LangGraph retrieval/),
  ).toBeTruthy();
  const repoLink = aiLab
    .getAllByRole('link', { name: 'Repository' })
    .find(
      (link) =>
        link.getAttribute('href') ===
        'https://github.com/juyelhushen/enterprise-knowledge-assistant',
    );
  expect(repoLink).toBeTruthy();
});

it('links to the skills section and renders the unconfirmed employment state', () => {
  renderApp();

  expect(screen.getByRole('link', { name: 'Skills' }).getAttribute('href')).toBe('#skills');
  expect(document.querySelectorAll('#skills')).toHaveLength(1);
  expect(
    screen.getByRole('heading', { level: 3, name: 'Professional history is being updated' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Select Spring Boot skill' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Select LangGraph skill' })).toBeTruthy();
});

it('retains working contact destinations with secure external-link attributes', () => {
  renderApp();

  const contact = within(screen.getByRole('region', { name: /Have a good problem/ }));
  const linkedin = contact.getByRole('link', { name: /Connect on LinkedIn/ });
  const github = contact.getByRole('link', { name: /Explore GitHub/ });

  expect(linkedin.getAttribute('href')).toBe('https://linkedin.com/in/juyel-hushen-770674170');
  expect(github.getAttribute('href')).toBe('https://github.com/juyelhushen');
  expect(linkedin.getAttribute('rel')).toBe('noopener noreferrer');
  expect(github.getAttribute('rel')).toBe('noopener noreferrer');
});
