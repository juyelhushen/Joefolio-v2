import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
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

it('immediately activates the clicked destination and closes the mobile menu', () => {
  renderApp();

  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
  fireEvent.click(within(navigation).getByRole('link', { name: 'Projects' }));

  expect(screen.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe(
    'false',
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
  expect(mesh?.getAttribute('data-mode')).toBe('fallback');
  expect(meshCanvas).toBeTruthy();
  expect(starfield).toBeTruthy();
  expect(grain).toBeTruthy();
  expect(document.querySelector('#main-content')).toBeTruthy();
});

it('renders documented projects with links to their repositories', () => {
  renderApp();

  const projectSection = within(screen.getByRole('region', { name: /Project Universe/ }));
  expect(projectSection.getByRole('heading', { level: 3, name: 'Sentinel' })).toBeTruthy();
  expect(projectSection.getByRole('button', { name: /Cut2Short/ })).toBeTruthy();
  expect(
    projectSection.getByRole('button', { name: /Enterprise Knowledge Assistant/ }),
  ).toBeTruthy();
  expect(projectSection.getByRole('button', { name: /Library Management System/ })).toBeTruthy();
  expect(projectSection.getByRole('button', { name: /YouTube Clone/ })).toBeTruthy();

  const expectedLinks = [
    'https://github.com/juyelhushen/sentinel',
    'https://github.com/juyelhushen/Cut2Short-backend',
    'https://github.com/juyelhushen/cut2short-front',
    'https://github.com/juyelhushen/enterprise-knowledge-assistant',
    'https://github.com/juyelhushen/library.management',
    'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/controller/BooksController.java',
    'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/controller/OrderController.java',
    'https://github.com/juyelhushen/youtube-clone',
    'https://github.com/juyelhushen/youtube-clone/blob/master/backend/src/main/java/com/youtubeclone/service/S3Service.java',
    'https://github.com/juyelhushen/youtube-clone/blob/master/frontend/ui/package.json',
  ];
  const observedLinks = new Set<string>();

  for (const projectName of [
    'Sentinel',
    'Cut2Short',
    'Enterprise Knowledge Assistant',
    'Library Management System',
    'YouTube Clone',
  ]) {
    fireEvent.click(projectSection.getByRole('button', { name: new RegExp(projectName) }));
    const projectLinks = projectSection
      .queryAllByRole('link')
      .filter((link) => link.classList.contains('project-link'));
    for (const projectLink of projectLinks) {
      observedLinks.add(projectLink.getAttribute('href') ?? '');
      expect(projectLink.getAttribute('rel')).toBe('noopener noreferrer');
    }
  }

  expect([...observedLinks]).toEqual(expectedLinks);
  fireEvent.click(projectSection.getByRole('button', { name: /Sentinel/ }));
  expect(projectSection.getByRole('link', { name: 'Sentinel: Repository' })).toBeTruthy();
  expect(projectSection.queryByRole('link', { name: /Library Management System:/ })).toBeNull();
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
  expect(screen.getByRole('link', { name: /SCROLL TO EXPLORE/ }).getAttribute('href')).toBe(
    '#skills',
  );
  expect(
    screen.getByRole('heading', { level: 2, name: /Every chapter built something/ }),
  ).toBeTruthy();
  expect(screen.getByRole('heading', { level: 3, name: 'Software Engineer II' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Select Spring Boot skill' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Select LangGraph skill' })).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Project archive' })).toBeTruthy();
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
