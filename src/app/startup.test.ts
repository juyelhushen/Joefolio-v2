import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const script = html.match(/<script id="startup-controller">([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error('Missing initial startup controller');

function start(reducedMotion = false) {
  vi.useFakeTimers();
  const motion = {
    matches: reducedMotion,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => motion),
  );
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.body.append(document.importNode(parsed.getElementById('startup-signal')!, true));
  const signal = document.getElementById('startup-signal')!;
  const execute = new Function('window', 'document', script!);
  execute(window, document);
  return { signal, controller: window.__PORTFOLIO_STARTUP__! };
}

afterEach(() => {
  window.__PORTFOLIO_STARTUP__?.ready();
  vi.runAllTimers();
  document.getElementById('startup-signal')?.remove();
  Reflect.deleteProperty(window, '__PORTFOLIO_STARTUP__');
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([300, 1500])('holds the visible loader for 2000ms when ready at %ims', (readyAt) => {
  const { signal, controller } = start();
  expect(signal.hidden).toBe(false);
  vi.advanceTimersByTime(readyAt);
  controller.ready();
  expect(signal.classList.contains('is-leaving')).toBe(false);
  vi.advanceTimersByTime(1999 - readyAt);
  expect(signal.classList.contains('is-leaving')).toBe(false);
  vi.advanceTimersByTime(1);
  expect(signal.classList.contains('is-leaving')).toBe(true);
  expect(signal.getAttribute('aria-hidden')).toBe('true');
  vi.advanceTimersByTime(180);
  expect(signal.isConnected).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('waits for critical readiness when it arrives after the minimum duration', () => {
  const { signal, controller } = start();
  vi.advanceTimersByTime(3500);
  expect(signal.classList.contains('is-leaving')).toBe(false);
  controller.ready();
  expect(signal.classList.contains('is-leaving')).toBe(true);
});

it('skips the exit sequence for reduced motion, with no minimum display time', () => {
  const { signal, controller } = start(true);
  vi.advanceTimersByTime(300);
  expect(signal.hidden).toBe(true);
  controller.ready();
  expect(signal.isConnected).toBe(false);
});

it('makes repeated StrictMode readiness notifications harmless', () => {
  const { controller } = start();
  controller.ready();
  const timers = vi.getTimerCount();
  expect(() => controller.ready()).not.toThrow();
  expect(vi.getTimerCount()).toBe(timers);
});

it('shows a readable reload fallback for an entry module failure', () => {
  const { signal } = start();
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const entry = document.createElement('script');
  entry.type = 'module';
  document.body.append(entry);
  entry.dispatchEvent(new Event('error'));
  expect(signal.hidden).toBe(false);
  expect(signal.getAttribute('role')).toBe('alert');
  expect(signal.textContent).toContain('The portfolio could not start');
  expect(signal.querySelector<HTMLAnchorElement>('.signal-reload')?.hidden).toBe(false);
  expect(error).toHaveBeenCalled();
  entry.remove();
});

it('does not mistake an optional asset error for an entry failure', () => {
  const { signal, controller } = start();
  const image = document.createElement('img');
  document.body.append(image);
  image.dispatchEvent(new Event('error'));
  expect(signal.dataset.failed).toBeUndefined();
  controller.ready();
  vi.advanceTimersByTime(2180);
  expect(signal.isConnected).toBe(false);
  image.remove();
});

it('bypasses an active hold when reduced motion is enabled and clears its timer', () => {
  const { signal, controller } = start();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  controller.ready();
  expect(vi.getTimerCount()).toBe(1);
  Object.assign(motion, { matches: true });
  const listener = vi.mocked(motion.addEventListener).mock.calls[0][1] as () => void;
  listener();
  expect(signal.isConnected).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('clears the removal fallback when the exit transition completes', () => {
  const { signal, controller } = start();
  controller.ready();
  vi.advanceTimersByTime(2000);
  signal.dispatchEvent(new Event('transitionend'));
  expect(signal.isConnected).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('removes global failure listeners after readiness', () => {
  const { controller } = start();
  const remove = vi.spyOn(window, 'removeEventListener');
  controller.ready();
  expect(remove).toHaveBeenCalledWith('error', expect.any(Function), true);
  expect(remove).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
});
