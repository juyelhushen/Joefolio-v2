import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ScrollReveal, { ScrollRevealItem } from './ScrollReveal';
import { useReducedMotion } from 'motion/react';

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('shows reduced-motion content immediately with no observer', () => {
  vi.mocked(useReducedMotion).mockReturnValueOnce(true);
  const observer = vi.fn();
  vi.stubGlobal('IntersectionObserver', observer);
  const { container } = render(<ScrollReveal variant="blur-reveal">Static content</ScrollReveal>);
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('true');
  expect(observer).not.toHaveBeenCalled();
});

it('uses one observer for a stagger container and all its items', () => {
  const observe = vi.fn();
  const disconnect = vi.fn();
  const constructor = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor() {
        constructor();
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  const { container, unmount } = render(
    <ScrollReveal variant="stagger-container">
      <ScrollRevealItem>One</ScrollRevealItem>
      <ScrollRevealItem variant="scale-up">Two</ScrollRevealItem>
    </ScrollReveal>,
  );
  expect(constructor).toHaveBeenCalledTimes(1);
  expect(observe).toHaveBeenCalledTimes(1);
  expect(container.querySelectorAll('[data-stagger-item]')).toHaveLength(2);
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

it('keeps offscreen content hidden even after a long idle period', () => {
  vi.useFakeTimers();
  const disconnect = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect = disconnect;
    },
  );
  const { container } = render(<ScrollReveal>Never trapped</ScrollReveal>);
  act(() => vi.advanceTimersByTime(30_000));
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('false');
  expect(disconnect).not.toHaveBeenCalled();
});

it('repeats only when explicitly configured and cleans up its observer', () => {
  let callback: IntersectionObserverCallback | undefined;
  const disconnect = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(onIntersection: IntersectionObserverCallback) {
        callback = onIntersection;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const { container, unmount } = render(
    <ScrollReveal once={false} variant="fade-right">
      Repeat
    </ScrollReveal>,
  );
  const report = (isIntersecting: boolean) =>
    act(() =>
      callback?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver),
    );
  report(true);
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('true');
  expect(disconnect).not.toHaveBeenCalled();
  report(false);
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('false');
  report(true);
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('true');
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

it('logs initialization failure and makes content visible without a working observer', () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor() {
        throw new Error('Observer failed');
      }
    },
  );
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(<ScrollReveal>Safe fallback</ScrollReveal>);
  act(() => vi.advanceTimersByTime(0));
  expect(container.firstElementChild?.getAttribute('data-revealed')).toBe('true');
  expect(warning).toHaveBeenCalled();
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
