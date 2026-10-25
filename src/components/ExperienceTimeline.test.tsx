import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ExperienceTimeline from './ExperienceTimeline';
import { experience } from '../data/experience';

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

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('renders the four career chapters in reverse chronological order', () => {
  render(<ExperienceTimeline reduceMotion={false} />);

  const timeline = screen.getByRole('list', { name: 'Career milestones' });
  const entries = within(timeline).getAllByRole('listitem');
  expect(entries).toHaveLength(4);
  expect(entries.map((entry) => entry.textContent)).toEqual([
    expect.stringContaining('Apexon'),
    expect.stringContaining('C-DAC'),
    expect.stringContaining('Nayamsoft'),
    expect.stringContaining('Test Yantra'),
  ]);
  expect(
    within(timeline).getByRole('heading', { level: 3, name: 'Java Developer Intern' }),
  ).toBeTruthy();
  expect(
    within(timeline).getByRole('heading', { level: 3, name: 'Software Engineer' }),
  ).toBeTruthy();
  expect(
    within(timeline).getByRole('heading', { level: 3, name: 'Project Engineer' }),
  ).toBeTruthy();
  expect(
    within(timeline).getByRole('heading', { level: 3, name: 'Software Engineer II' }),
  ).toBeTruthy();
  expect(experience.map((entry) => entry.employer)).toEqual([
    'Apexon',
    'C-DAC',
    'Nayamsoft',
    'Test Yantra',
  ]);
  expect(experience.map(({ chapter }) => chapter)).toEqual([4, 3, 2, 1]);
  expect(
    within(timeline)
      .getAllByText(/^CHAPTER \//)
      .map((chapter) => chapter.textContent),
  ).toEqual(['CHAPTER / 4', 'CHAPTER / 3', 'CHAPTER / 2', 'CHAPTER / 1']);
});

it('omits the unresolved Test Yantra dates and shows the other supplied periods', () => {
  render(<ExperienceTimeline reduceMotion={false} />);

  const testYantra = experience.at(-1);
  expect(testYantra?.employer).toBe('Test Yantra');
  expect(testYantra?.dates).toBeUndefined();
  expect(screen.queryByText(/October 2021|March 2020/)).toBeNull();
  expect(screen.getByText('April 2022 – June 2024')).toBeTruthy();
  expect(screen.getByText('September 2024 – December 2025')).toBeTruthy();
  expect(screen.getByText('December 2025 – Present')).toBeTruthy();
});

it('marks the first Apexon entry as the current role and initially selected milestone', () => {
  render(<ExperienceTimeline reduceMotion={false} />);

  const apexonEntry = document.querySelector('.experience-entry.is-current');
  expect(apexonEntry?.textContent).toContain('Apexon');
  expect(document.querySelector('.experience-entry')?.textContent).toContain('Apexon');
  expect(apexonEntry).toBe(document.querySelector('.experience-entry'));
  expect(apexonEntry?.classList).toContain('is-current');
  expect(apexonEntry?.querySelector('.experience-current')?.textContent).toBe('CURRENT ROLE');
  expect(
    screen
      .getByRole('button', { name: 'Highlight Apexon: Software Engineer II' })
      .getAttribute('aria-pressed'),
  ).toBe('true');
});

it('sends the SVG signal from the current-role end of the route toward earlier roles', () => {
  render(<ExperienceTimeline reduceMotion={false} />);

  for (const route of document.querySelectorAll('.career-route')) {
    const path = route.querySelector('.career-route-line');
    const signalPath = route.querySelector('animateMotion');
    expect(path?.getAttribute('d')).toMatch(/^M (500|27) 0/);
    expect(path?.getAttribute('d')).toMatch(/(500|27) 1000$/);
    expect(signalPath?.getAttribute('path')).toBe(path?.getAttribute('d'));
  }
});

it('supports keyboard selection and exposes the selected milestone state', () => {
  render(<ExperienceTimeline reduceMotion={false} />);

  const nayamsoft = screen.getByRole('button', {
    name: 'Highlight Nayamsoft: Software Engineer',
  });
  nayamsoft.focus();
  expect(document.activeElement).toBe(nayamsoft);
  expect(nayamsoft.getAttribute('aria-pressed')).toBe('false');
  fireEvent.keyDown(nayamsoft, { key: 'Enter' });
  fireEvent.click(nayamsoft);
  expect(nayamsoft.getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector('.experience-entry.is-selected')?.textContent).toContain(
    'Nayamsoft',
  );
});

it('disables continuous route movement under reduced motion while keeping roles visible', () => {
  render(<ExperienceTimeline reduceMotion />);

  expect(document.querySelector('.career-odyssey')?.getAttribute('data-reduced-motion')).toBe(
    'true',
  );
  expect(document.querySelectorAll('.career-route[data-motion="reduced"]')).toHaveLength(2);
  expect(document.querySelector('.career-route-signal')).toBeNull();
  expect(document.querySelector('.career-route-desktop .career-route-line')).toBeTruthy();
  expect(screen.getByRole('heading', { level: 3, name: 'Software Engineer II' })).toBeTruthy();
  expect(screen.getAllByRole('button', { name: /Highlight/ })).toHaveLength(4);
});
