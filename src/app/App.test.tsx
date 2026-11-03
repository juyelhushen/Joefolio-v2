import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import App from './App';
import { wakeBackend } from '../lib/api/backend-health';
import { PUBLIC_EMAIL } from '../lib/profile';

vi.mock('../lib/api/backend-health', () => ({
  wakeBackend: vi.fn().mockResolvedValue('UP'),
}));

beforeAll(async () => {
  await Promise.all([
    import('../features/skills/components/SkillsSection'),
    import('../features/experience/components/ExperienceSection'),
    import('../features/projects/components/ProjectsSection'),
    import('../features/ai-lab/components/AiLabSection'),
    import('../features/contact/components/CosmicContactSection'),
    import('../components/layout/Footer/CosmicFooter'),
    import('../features/assistant/components/PortfolioAssistant'),
  ]);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  Reflect.deleteProperty(window, '__PORTFOLIO_STARTUP__');
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  Reflect.deleteProperty(navigator, 'connection');
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly scrollMargin = '0px';
  readonly thresholds: number[] = [];

  private timeoutId: number | undefined;
  private disconnected = false;

  constructor(private readonly callback: IntersectionObserverCallback) {}
  disconnect() {
    this.disconnected = true;
    if (this.timeoutId !== undefined) window.clearTimeout(this.timeoutId);
  }
  observe(target: Element) {
    this.timeoutId = window.setTimeout(() => {
      if (!this.disconnected)
        this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
    }, 0);
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

function renderApp() {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
  return render(<App />);
}

it('passes the unavailable startup status to the contact section', async () => {
  const idleCallbacks: (() => void)[] = [];
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((callback: () => void) => {
      idleCallbacks.push(callback);
      return idleCallbacks.length;
    }),
  );
  vi.stubGlobal('cancelIdleCallback', vi.fn());
  vi.mocked(wakeBackend).mockResolvedValueOnce('UNAVAILABLE');
  window.history.replaceState(null, '', '#contact');
  renderApp();
  act(() => idleCallbacks.forEach((callback) => callback()));
  expect(await screen.findByText(/The form may take a moment or be offline/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Launch message' }).hasAttribute('disabled')).toBe(
    false,
  );
  expect(
    screen.getByRole('button', { name: 'Launch message' }).classList.contains('button-primary'),
  ).toBe(true);
  for (const field of within(screen.getByRole('form', { name: 'Send a message' })).getAllByRole(
    'textbox',
  )) {
    expect(field.classList.contains('form-control')).toBe(true);
  }
});

it('introduces dependable software with one concise identity and two hero actions', () => {
  renderApp();

  const hero = screen.getByRole('region', {
    name: 'I turn complex ideas into reliable software.',
  });

  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'I turn complex ideas into reliable software.',
    }),
  ).toBeTruthy();
  expect(hero.textContent).toContain('Building dependable backend systems');
  expect(hero.textContent).toContain('practical AI solutions');
  expect(hero.querySelector('.hero-actions')?.querySelectorAll('a')).toHaveLength(2);
  expect(within(hero).queryByRole('list')).toBeNull();
  expect(
    within(hero)
      .getByRole('link', { name: 'Explore my work' })
      .classList.contains('button-primary'),
  ).toBe(true);
  expect(
    within(hero).getByRole('link', { name: 'Get in touch' }).classList.contains('button-secondary'),
  ).toBe(true);
  expect(screen.getByRole('link', { name: 'Explore my work' }).getAttribute('href')).toBe(
    '#projects',
  );
  expect(within(hero).getByRole('link', { name: 'Get in touch' }).getAttribute('href')).toBe(
    '#contact',
  );
});

it('does not advertise an unconfigured assistant after idle initialization', async () => {
  vi.stubEnv('VITE_AI_ASSISTANT_API_URL', '');
  const callbacks: (() => void)[] = [];
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => callbacks.push(callback));
  vi.stubGlobal('cancelIdleCallback', vi.fn());
  renderApp();
  await act(async () => callbacks.forEach((callback) => callback()));
  expect(screen.queryByRole('button', { name: 'Open portfolio assistant' })).toBeNull();
});

it('labels the sole mail link Gmail beside GitHub without displaying the address or manual controls', async () => {
  window.history.replaceState(null, '', '#footer');
  renderApp();
  const email = await screen.findByRole('link', { name: 'Gmail' });
  expect(screen.queryByText(PUBLIC_EMAIL)).toBeNull();
  expect(screen.queryByRole('link', { name: PUBLIC_EMAIL })).toBeNull();
  expect(document.querySelectorAll('a[href^="mailto:"]')).toHaveLength(1);
  expect(email.getAttribute('href')).toBe(`mailto:${PUBLIC_EMAIL}`);
  expect(email.previousElementSibling?.textContent).toBe('GitHub');
  expect(email.closest('footer')).toBeTruthy();
  expect(email.classList.contains('button-secondary')).toBe(true);
  expect(document.querySelector('[data-effects-reduced]')).toBeNull();
  expect(screen.queryByRole('button', { name: /Reduce effects|Copy email/i })).toBeNull();
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

  expect(screen.getByRole('link', { name: 'Explore my work' }).getAttribute('href')).toBe(
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

it('releases startup on shell commit without waiting for idle services or lazy sections', () => {
  const ready = vi.fn(() => {
    expect(document.getElementById('home-title')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy();
  });
  window.__PORTFOLIO_STARTUP__ = { ready, fail: vi.fn() };
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelIdleCallback', vi.fn());
  vi.mocked(wakeBackend).mockClear();

  renderApp();

  expect(ready).toHaveBeenCalledOnce();
  expect(wakeBackend).not.toHaveBeenCalled();
  expect(document.getElementById('projects')?.getAttribute('aria-busy')).toBe('true');
  expect(document.querySelector('.hero-copy')?.getAttribute('style') ?? '').not.toContain(
    'opacity: 0',
  );
  expect(document.querySelector('[data-intro-active]')).toBeNull();
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

  const contactCta = within(screen.getByRole('banner')).getByRole('link', { name: 'Get in Touch' });
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
  fireEvent.scroll(window);
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

it('renders concise project cards with links to their repositories', async () => {
  renderApp();

  const projectSection = within(await screen.findByRole('region', { name: 'Selected Work.' }));
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

it('grounds the AI Lab in documented projects and their verified repositories', async () => {
  renderApp();

  const aiLab = within(await screen.findByRole('region', { name: /Engineering with/ }));
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

it('preserves section order and renders the Career Odyssey alongside Skills and Projects', async () => {
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
    await screen.findByRole('heading', { level: 2, name: /Career, chapter by chapter/ }),
  ).toBeTruthy();
  expect(screen.getByRole('heading', { level: 3, name: 'Software Engineer II' })).toBeTruthy();
  expect(await screen.findByRole('button', { name: 'Select Spring Boot skill' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Select LangGraph skill' })).toBeTruthy();
  expect(
    within(await screen.findByRole('region', { name: 'Selected Work.' })).getAllByRole('article'),
  ).toHaveLength(5);
  expect(screen.getByRole('heading', { level: 2, name: 'Selected Work.' })).toBeTruthy();
});

it('retains working contact destinations with secure external-link attributes', async () => {
  renderApp();

  const contact = within(await screen.findByRole('region', { name: /Send a Message into Orbit/ }));
  const linkedin = contact.getByRole('link', { name: 'LinkedIn' });
  const github = contact.getByRole('link', { name: 'GitHub' });

  expect(linkedin.getAttribute('href')).toBe('https://linkedin.com/in/juyel-hushen-770674170');
  expect(github.getAttribute('href')).toBe('https://github.com/juyelhushen');
  expect(linkedin.getAttribute('rel')).toBe('noopener noreferrer');
  expect(github.getAttribute('rel')).toBe('noopener noreferrer');
});
