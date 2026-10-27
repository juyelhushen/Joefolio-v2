import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  window.sessionStorage.removeItem('joefolio-universe-intro-seen');
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

it('positions Juyel through backend, full-stack, and practical AI engineering', () => {
  renderApp();

  const hero = screen.getByRole('region', { name: /Backend systems.*Practical AI/ });
  expect(
    screen.getByRole('heading', { level: 1, name: /Backend systems.*Practical AI/ }),
  ).toBeTruthy();
  expect(hero.textContent).toContain('full-stack applications');
  expect(hero.textContent).toContain('document retrieval and agent workflows');
  expect(within(hero).getByText('Java · Spring Boot')).toBeTruthy();
  expect(within(hero).getByText('React · TypeScript')).toBeTruthy();
  expect(within(hero).getByText('LangGraph · RAG')).toBeTruthy();
  expect(screen.getByRole('link', { name: /Explore Projects/ }).getAttribute('href')).toBe(
    '#projects',
  );
  expect(screen.getByRole('link', { name: /Let’s connect/ }).getAttribute('href')).toBe('#contact');
});

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

it('shows the intro once per tab session and completes on its master timeline', () => {
  renderApp();

  const intro = screen.getByTestId('universe-intro');
  expect(intro.getAttribute('aria-hidden')).toBe('true');
  expect(document.querySelector('.site-shell')?.getAttribute('data-intro-active')).toBe('true');

  fireEvent.animationEnd(intro, { animationName: 'universe-intro-timeline' });
  expect(screen.queryByTestId('universe-intro')).toBeNull();
  expect(window.sessionStorage.getItem('joefolio-universe-intro-seen')).toBe('true');

  cleanup();
  renderApp();
  expect(screen.queryByTestId('universe-intro')).toBeNull();
});

it('skips the intro when reduced motion is enabled', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

  renderApp();
  expect(screen.queryByTestId('universe-intro')).toBeNull();
});

it('allows the intro to be replayed in development with the intro query parameter', () => {
  window.history.replaceState(null, '', '/?intro=1');
  window.sessionStorage.setItem('joefolio-universe-intro-seen', 'true');

  renderApp();
  expect(screen.getByTestId('universe-intro')).toBeTruthy();
});

it('tracks the active section while scrolling down and back up', () => {
  renderApp();
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

  const sectionTops: Record<string, number> = {
    home: 88,
    about: 900,
    experience: 1800,
    skills: 2700,
    projects: 3600,
    'ai-lab': 4500,
    contact: 5400,
  };
  for (const id of Object.keys(sectionTops)) {
    vi.spyOn(document.getElementById(id)!, 'getBoundingClientRect').mockImplementation(() => {
      const top = sectionTops[id];
      return {
        top,
        bottom: top + 800,
        left: 0,
        right: 1200,
        width: 1200,
        height: 800,
        x: 0,
        y: top,
        toJSON: () => ({}),
      };
    });
  }

  const currentLink = () =>
    document.querySelector('#main-navigation a[aria-current="location"]')?.getAttribute('href');
  expect(currentLink()).toBe('#home');

  sectionTops.about = 100;
  sectionTops.experience = 1000;
  fireEvent.scroll(window);
  expect(currentLink()).toBe('#about');

  sectionTops.about = -900;
  sectionTops.experience = 100;
  sectionTops.skills = 1000;
  fireEvent.scroll(window);
  expect(currentLink()).toBe('#experience');

  sectionTops.about = 100;
  sectionTops.experience = 1000;
  sectionTops.skills = 2000;
  fireEvent.scroll(window);
  expect(currentLink()).toBe('#about');
});

it('keeps each navigation target present and exposes one animated active indicator', () => {
  renderApp();

  const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
  const links = [...navigation.querySelectorAll<HTMLAnchorElement>('a[data-nav-id]')];
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '#home',
    '#about',
    '#experience',
    '#skills',
    '#projects',
    '#ai-lab',
    '#contact',
  ]);
  for (const link of links) {
    expect(document.getElementById(link.dataset.navId ?? '')).toBeTruthy();
  }
  expect(navigation.querySelectorAll('.main-nav-indicator')).toHaveLength(1);
  expect(navigation.querySelector('[aria-current="location"]')?.getAttribute('href')).toBe('#home');
});

it('keeps the animated JH brand link and prominent Get in Touch destination', () => {
  renderApp();

  const brand = document.querySelector<HTMLAnchorElement>('.site-header .brand');
  expect(brand).toBeTruthy();
  if (!brand) throw new Error('The navbar brand link was not rendered.');
  const decoration = brand.querySelector('.brand-orbit');
  expect(brand.getAttribute('href')).toBe('#home');
  expect(brand.textContent).toContain('JUYEL HUSHEN');
  expect(decoration?.getAttribute('aria-hidden')).toBe('true');
  expect(decoration?.querySelector('a, button')).toBeNull();

  const contactCta = screen.getByRole('link', { name: 'Get in Touch' });
  expect(contactCta.getAttribute('href')).toBe('#contact');
  fireEvent.click(contactCta);
  expect(
    document.querySelector('#main-navigation [aria-current="location"]')?.getAttribute('href'),
  ).toBe('#contact');
});

it('immediately activates the clicked destination, closes the mobile menu, and restores focus', async () => {
  renderApp();

  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
  fireEvent.click(within(navigation).getByRole('link', { name: 'Projects' }));

  expect(screen.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe(
    'false',
  );
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open menu' })),
  );
  expect(navigation.querySelector('[aria-current="location"]')?.getAttribute('href')).toBe(
    '#projects',
  );
});

it('tracks direct hash navigation and browser history targets', () => {
  window.history.replaceState(null, '', '/#contact');
  renderApp();
  const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
  expect(navigation.querySelector('[aria-current="location"]')?.getAttribute('href')).toBe(
    '#contact',
  );

  window.history.replaceState(null, '', '/#skills');
  fireEvent(window, new PopStateEvent('popstate'));
  expect(navigation.querySelector('[aria-current="location"]')?.getAttribute('href')).toBe(
    '#skills',
  );
});

it('keeps the cosmic mesh, starfield, and grain as non-interactive global background layers', () => {
  renderApp();

  const mesh = document.querySelector('.cosmic-mesh-background');
  const meshCanvas = mesh?.querySelector('canvas.cosmic-mesh-canvas');
  const starfield = document.querySelector('canvas.starfield');
  const grain = document.querySelector('.space-grain');

  expect(mesh).toBeTruthy();
  expect(mesh?.getAttribute('aria-hidden')).toBe('true');
  expect(mesh?.getAttribute('data-mode')).toBe('static');
  expect(meshCanvas).toBeTruthy();
  expect(starfield).toBeTruthy();
  expect(grain).toBeTruthy();
  expect(document.querySelector('#main-content')).toBeTruthy();
});

it('renders concise project cards with links to their repositories', () => {
  renderApp();

  const projectSection = within(screen.getByRole('region', { name: 'Selected Work.' }));
  expect(projectSection.getAllByRole('article')).toHaveLength(5);

  const expectedProjects = [
    ['Sentinel', 'https://github.com/juyelhushen/sentinel'],
    ['Cut2Short', 'https://github.com/juyelhushen/Cut2Short-backend'],
    [
      'Enterprise Knowledge Assistant',
      'https://github.com/juyelhushen/enterprise-knowledge-assistant',
    ],
    ['Library Management System', 'https://github.com/juyelhushen/library.management'],
    ['YouTube Clone', 'https://github.com/juyelhushen/youtube-clone'],
  ];

  for (const [projectName, repositoryUrl] of expectedProjects) {
    const projectCard = within(projectSection.getByRole('article', { name: projectName }));
    expect(projectCard.getByRole('heading', { level: 3, name: projectName })).toBeTruthy();
    const repositoryLink = projectCard.getByRole('link', {
      name: `${projectName}: view GitHub repository`,
    });
    expect(repositoryLink.getAttribute('href')).toBe(repositoryUrl);
    expect(repositoryLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(projectCard.getAllByRole('link')).toHaveLength(1);
  }
});

it('grounds the AI Lab in documented projects and their verified repositories', () => {
  renderApp();

  const aiLab = within(screen.getByRole('region', { name: /Engineering with/ }));
  const legacyLink = aiLab.getByRole('link', { name: 'Visit Previous Portfolio' });
  expect(legacyLink.getAttribute('href')).toBe('https://juyelhushen.netlify.app/');
  expect(legacyLink.getAttribute('target')).toBe('_blank');
  expect(legacyLink.getAttribute('rel')).toBe('noopener noreferrer');
  const orbits = aiLab.getAllByTestId('legacy-orbit');
  expect(orbits).toHaveLength(3);
  for (const orbit of orbits) {
    expect(orbit.getAttribute('aria-hidden')).toBe('true');
    expect(orbit.querySelectorAll('.legacy-orbit-satellite').length).toBeGreaterThan(0);
  }
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

it('preserves section order and renders the Career Odyssey alongside Skills and Projects', () => {
  renderApp();

  const skillsLink = screen.getByRole('link', { name: 'Skills' });
  const projectsLink = screen.getByRole('link', { name: 'Projects' });
  expect(skillsLink.getAttribute('href')).toBe('#skills');
  expect(projectsLink.getAttribute('href')).toBe('#projects');
  const navigationTargets = [
    ...screen.getByRole('navigation', { name: 'Main navigation' }).querySelectorAll('a'),
  ].map((link) => link.getAttribute('href'));
  expect(navigationTargets.indexOf('#skills')).toBeLessThan(navigationTargets.indexOf('#projects'));
  expect(document.querySelectorAll('#skills')).toHaveLength(1);
  expect(
    document
      .querySelector('#skills')
      ?.compareDocumentPosition(document.querySelector('#projects')!),
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(
    screen.getByRole('heading', { level: 2, name: /Career, chapter by chapter/ }),
  ).toBeTruthy();
  expect(screen.getByRole('heading', { level: 3, name: 'Software Engineer II' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Select Spring Boot skill' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Select LangGraph skill' })).toBeTruthy();
  expect(
    within(screen.getByRole('region', { name: 'Selected Work.' })).getAllByRole('article'),
  ).toHaveLength(5);
  expect(screen.getByRole('heading', { level: 2, name: 'Selected Work.' })).toBeTruthy();
});

it('retains working contact destinations with secure external-link attributes', () => {
  renderApp();

  const contact = within(screen.getByRole('region', { name: /Send a Message into Orbit/ }));
  const linkedin = contact.getByRole('link', { name: 'LinkedIn' });
  const github = contact.getByRole('link', { name: 'GitHub' });

  expect(linkedin.getAttribute('href')).toBe('https://linkedin.com/in/juyel-hushen-770674170');
  expect(github.getAttribute('href')).toBe('https://github.com/juyelhushen');
  expect(linkedin.getAttribute('rel')).toBe('noopener noreferrer');
  expect(github.getAttribute('rel')).toBe('noopener noreferrer');
});
