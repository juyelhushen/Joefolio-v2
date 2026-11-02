import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { domAnimation, LazyMotion } from 'motion/react';
import type { ImpactStat } from '../data/impact';
import ImpactStrip from './ImpactStrip';

const mockedData = vi.hoisted(() => ({ stats: [] as ImpactStat[] }));

vi.mock('../data/impact', () => ({ impactStats: mockedData.stats }));

let intersectionCallback: IntersectionObserverCallback | undefined;
let disconnected = false;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly scrollMargin = '0px';
  readonly thresholds = [0.15];

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  disconnect() {
    disconnected = true;
  }
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

const stats: ImpactStat[] = [
  { id: 'projects', value: 12, prefix: '~', label: 'Projects', detail: 'Built and documented' },
  { id: 'accuracy', value: 98.6, suffix: '%', decimals: 1, label: 'Accuracy' },
  { id: 'requests', value: 1500, prefix: '+', label: 'Requests' },
];

beforeEach(() => {
  mockedData.stats.splice(0, mockedData.stats.length);
  intersectionCallback = undefined;
  disconnected = false;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function showSampleStats() {
  mockedData.stats.push(...stats);
}

function renderWithMotion() {
  return render(
    <LazyMotion features={domAnimation}>
      <ImpactStrip reduceMotion={false} />
    </LazyMotion>,
  );
}

it('renders nothing and leaves no layout when there are no verified statistics', () => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  const { container } = renderWithMotion();
  expect(container.firstChild).toBeNull();
  expect(screen.queryByText('AT A GLANCE')).toBeNull();
});

it('renders formatted tiles and accessible final values without duplicate animated announcements', () => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  showSampleStats();
  renderWithMotion();
  expect(screen.getByText('AT A GLANCE')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Projects' })).toBeTruthy();
  expect(screen.getByText('Built and documented')).toBeTruthy();
  expect(screen.getByText('~12', { selector: '.visually-hidden' })).toBeTruthy();
  expect(screen.getByText('98.6%', { selector: '.visually-hidden' })).toBeTruthy();
  expect(screen.getByText('+1,500', { selector: '.visually-hidden' })).toBeTruthy();
  expect(
    screen
      .getByText('98.6%', { selector: '.visually-hidden' })
      .nextElementSibling?.getAttribute('aria-hidden'),
  ).toBe('true');
});

it('animates from zero once when the strip enters view', async () => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  showSampleStats();
  renderWithMotion();
  expect(screen.getByText('~0', { selector: '[aria-hidden="true"]' })).toBeTruthy();
  act(() => {
    intersectionCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
  expect(disconnected).toBe(true);
  await waitFor(
    () => expect(screen.getByText('~12', { selector: '[aria-hidden="true"]' })).toBeTruthy(),
    { timeout: 2000 },
  );
});

it('shows final values immediately for reduced motion and missing IntersectionObserver', () => {
  showSampleStats();
  const reduced = render(
    <LazyMotion features={domAnimation}>
      <ImpactStrip reduceMotion />
    </LazyMotion>,
  );
  expect(screen.getByText('~12', { selector: '[aria-hidden="true"]' })).toBeTruthy();
  reduced.unmount();

  vi.stubGlobal('IntersectionObserver', undefined);
  renderWithMotion();
  expect(screen.getByText('~12', { selector: '[aria-hidden="true"]' })).toBeTruthy();
});

it('shows final values immediately if IntersectionObserver initialization throws', async () => {
  showSampleStats();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor() {
        throw new Error('Unavailable');
      }
    },
  );
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  renderWithMotion();
  await waitFor(() =>
    expect(screen.getByText('~12', { selector: '[aria-hidden="true"]' })).toBeTruthy(),
  );
  expect(warning).toHaveBeenCalledOnce();
});
