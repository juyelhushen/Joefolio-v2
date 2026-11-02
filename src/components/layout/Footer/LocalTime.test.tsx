import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LocalTime from './LocalTime';

let intersect: (visible: boolean) => void;
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
  });
  vi.setSystemTime(new Date('2026-11-02T07:00:00Z'));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersect = (visible) => callback([{ isIntersecting: visible }]);
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('reserves an empty first-paint slot and schedules nothing offscreen', () => {
  const { container } = render(<LocalTime />);
  expect(container.querySelector('.footer-local-time')).toBeTruthy();
  expect(container.querySelector('time')).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

it('uses Bengaluru time and updates once per minute only while visible', () => {
  const { container, unmount } = render(<LocalTime />);
  act(() => intersect(true));
  act(() => vi.advanceTimersByTime(0));
  const time = container.querySelector('time');
  expect(time?.textContent).toBe('Bengaluru · 12:30');
  expect(time?.getAttribute('datetime')).toBe('2026-11-02T07:00:00.000Z');
  expect(vi.getTimerCount()).toBe(1);
  act(() => vi.advanceTimersByTime(59_999));
  expect(time?.textContent).toBe('Bengaluru · 12:30');
  act(() => vi.advanceTimersByTime(1));
  expect(time?.textContent).toBe('Bengaluru · 12:31');
  act(() => intersect(false));
  expect(vi.getTimerCount()).toBe(0);
  act(() => vi.advanceTimersByTime(120_000));
  expect(time?.textContent).toBe('Bengaluru · 12:31');
  act(() => intersect(true));
  act(() => vi.advanceTimersByTime(0));
  expect(time?.textContent).toBe('Bengaluru · 12:33');
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('clears timers while the tab is hidden and refreshes on return', () => {
  const { container } = render(<LocalTime />);
  act(() => intersect(true));
  act(() => vi.advanceTimersByTime(0));
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(vi.getTimerCount()).toBe(0);
  act(() => vi.advanceTimersByTime(60_000));
  hidden.mockReturnValue(false);
  fireEvent(document, new Event('visibilitychange'));
  act(() => vi.advanceTimersByTime(0));
  expect(container.querySelector('time')?.textContent).toBe('Bengaluru · 12:31');
});
