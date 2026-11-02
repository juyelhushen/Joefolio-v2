import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import EventPipelinePlayground from './EventPipelinePlayground';

let intersect: (visible: boolean) => void;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
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

function show() {
  const view = render(<EventPipelinePlayground />);
  act(() => intersect(true));
  return view;
}
function ticks(count: number) {
  for (let index = 0; index < count; index++) act(() => vi.advanceTimersByTime(650));
}
function counter(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

it('provides keyboard controls, updates counters and debounces accessible announcements', () => {
  const { container } = show();
  expect(
    screen.getByRole('button', { name: 'Redrain dead letters' }).hasAttribute('disabled'),
  ).toBe(true);
  const send = screen.getByRole('button', { name: 'Send event' });
  send.focus();
  expect(document.activeElement).toBe(send);
  fireEvent.click(send);
  expect(counter('Accepted')).toBe('1');
  const live = container.querySelector('[aria-live="polite"]');
  expect(live?.textContent).toBe('');
  act(() => vi.advanceTimersByTime(250));
  expect(live?.textContent).toContain('Event 1 accepted');
  ticks(3);
  act(() => vi.advanceTimersByTime(250));
  expect(counter('Delivered')).toBe('1');
  expect(live?.textContent).toBe('Event 1 delivered');
});

it('shows retries, dead-letter announcements and redrain delivery', () => {
  const { container } = show();
  const failure = screen.getByRole('switch', { name: /Simulate delivery failure/ });
  fireEvent.click(failure);
  expect(failure.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Send event' }));
  ticks(3);
  expect(counter('Retrying')).toBe('1');
  expect(screen.getByText(/attempt 1\/3 · backoff/)).toBeTruthy();
  ticks(9);
  act(() => vi.advanceTimersByTime(250));
  expect(counter('In dead-letter')).toBe('1');
  expect(container.querySelector('[aria-live]')?.textContent).toBe(
    'Event 1 moved to dead-letter after 3 attempts',
  );
  const redrain = screen.getByRole('button', { name: 'Redrain dead letters' });
  expect(redrain.hasAttribute('disabled')).toBe(false);
  fireEvent.click(failure);
  fireEvent.click(redrain);
  ticks(2);
  expect(counter('In dead-letter')).toBe('0');
  expect(counter('Delivered')).toBe('1');
});

it('reports Queue full without accepting extra events', () => {
  show();
  for (let index = 0; index < 13; index++)
    fireEvent.click(screen.getByRole('button', { name: 'Send event' }));
  expect(counter('Accepted')).toBe('12');
  expect(screen.getByText('Queue full', { selector: '.pipeline-note' })).toBeTruthy();
});

it('schedules nothing offscreen, cancels timers on leaving and resumes pending events', () => {
  const view = render(<EventPipelinePlayground />);
  expect(vi.getTimerCount()).toBe(0);
  act(() => intersect(true));
  fireEvent.click(screen.getByRole('button', { name: 'Send event' }));
  expect(vi.getTimerCount()).toBe(2);
  act(() => intersect(false));
  expect(vi.getTimerCount()).toBe(0);
  expect(screen.getByRole('button', { name: 'Send event' }).hasAttribute('disabled')).toBe(true);
  ticks(5);
  expect(counter('Delivered')).toBe('0');
  act(() => intersect(true));
  ticks(3);
  expect(counter('Delivered')).toBe('1');
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('cleans up every timer on unmount and never schedules another one', () => {
  const { unmount } = show();
  fireEvent.click(screen.getByRole('button', { name: 'Send event' }));
  expect(vi.getTimerCount()).toBe(2);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  const schedule = vi.spyOn(window, 'setTimeout');
  vi.runAllTimers();
  expect(schedule).not.toHaveBeenCalled();
});

it('pauses timers when the tab is hidden', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Send event' }));
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps processing without travel animations on mobile', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((media: string) => ({
      matches: media === '(max-width: 740px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const { container } = show();
  expect(container.querySelector('[data-static="true"]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Send event' }));
  ticks(3);
  expect(counter('Delivered')).toBe('1');
});

it('keeps the simulation usable with reduced effects or without an observer', () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  const { container, rerender } = render(<EventPipelinePlayground reduceMotion />);
  expect(container.querySelector('[data-static="true"]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Send event' }));
  ticks(3);
  expect(counter('Delivered')).toBe('1');
  rerender(<EventPipelinePlayground reduceMotion={false} />);
  expect(container.querySelector('[data-static="true"]')).toBeTruthy();
});
