import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ScrollReveal from './ScrollReveal';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('keeps content in the DOM and reveals it once the observer reports entry', () => {
  let observerCallback: IntersectionObserverCallback | undefined;
  class TestIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly scrollMargin = '0px';
    readonly thresholds: number[] = [];

    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
    }

    disconnect() {}
    observe() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);

  const { container, getByText } = render(
    <ScrollReveal>
      <h2>Readable section content</h2>
    </ScrollReveal>,
  );

  expect(getByText('Readable section content')).toBeTruthy();
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('false');
  act(() => {
    observerCallback?.(
      [{ isIntersecting: true, target: container.firstElementChild } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('true');
});

it('shows content immediately when IntersectionObserver is unavailable', () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  const { container, getByText } = render(
    <ScrollReveal>
      <p>Content without an observer</p>
    </ScrollReveal>,
  );

  expect(getByText('Content without an observer')).toBeTruthy();
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('true');
});
