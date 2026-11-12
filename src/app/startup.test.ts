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

  // Track RAF calls properly
  const rafMap = new Map<number, unknown>();
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) => {
      const id = Math.random();
      const timeoutId = setTimeout(cb, 16);
      rafMap.set(id, timeoutId);
      return id;
    }),
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => {
      if (rafMap.has(id)) {
        clearTimeout(rafMap.get(id) as ReturnType<typeof setTimeout>);
        rafMap.delete(id);
      }
    }),
  );

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.body.append(document.importNode(parsed.getElementById('launch-animation')!, true));
  document.body.append(document.importNode(parsed.getElementById('startup-signal')!, true));

  const launchAnimation = document.getElementById('launch-animation')!;
  const signal = document.getElementById('startup-signal')!;
  const canvas = document.getElementById('launch-canvas') as HTMLCanvasElement | null;

  // Mock canvas getContext
  if (canvas) {
    (canvas.getContext as unknown as (contextId: string) => CanvasRenderingContext2D | null) = vi.fn(
      () =>
        ({
          scale: vi.fn(),
          fillRect: vi.fn(),
          createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
          })),
          createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
          })),
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 0,
          beginPath: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
  }

  const execute = new Function('window', 'document', script!);
  execute(window, document);
  return { launchAnimation, signal, controller: window.__PORTFOLIO_STARTUP__! };
}

afterEach(() => {
  window.__PORTFOLIO_STARTUP__?.ready();
  vi.runAllTimers();
  document.getElementById('launch-animation')?.remove();
  document.getElementById('startup-signal')?.remove();
  Reflect.deleteProperty(window, '__PORTFOLIO_STARTUP__');
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([300, 1500])('holds the visible loader for 2300ms when ready at %ims', (readyAt) => {
  const { launchAnimation, controller } = start();
  expect(launchAnimation.hidden).toBe(false);
  vi.advanceTimersByTime(readyAt);
  controller.ready();
  expect(launchAnimation.classList.contains('is-leaving')).toBe(false);
  vi.advanceTimersByTime(2299 - readyAt);
  expect(launchAnimation.classList.contains('is-leaving')).toBe(false);
  vi.advanceTimersByTime(1);
  expect(launchAnimation.classList.contains('is-leaving')).toBe(true);
  expect(launchAnimation.getAttribute('aria-hidden')).toBe('true');
  vi.advanceTimersByTime(180);
});

it('waits for critical readiness when it arrives after the minimum duration', () => {
  const { launchAnimation, controller } = start();
  vi.advanceTimersByTime(3500);
  expect(launchAnimation.classList.contains('is-leaving')).toBe(false);
  controller.ready();
  expect(launchAnimation.classList.contains('is-leaving')).toBe(true);
});

it('skips the exit sequence for reduced motion, with no minimum display time', () => {
  const { launchAnimation, controller } = start(true);
  vi.advanceTimersByTime(300);
  expect(launchAnimation.hidden).toBe(true);
  controller.ready();
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
  const { launchAnimation, signal, controller } = start();
  const image = document.createElement('img');
  document.body.append(image);
  image.dispatchEvent(new Event('error'));
  expect(signal.dataset.failed).toBeUndefined();
  controller.ready();
  vi.advanceTimersByTime(2300);
  launchAnimation.dispatchEvent(new Event('transitionend'));
  vi.advanceTimersByTime(200);
  expect(launchAnimation.isConnected).toBe(false);
  image.remove();
});

it('bypasses an active hold when reduced motion is enabled and clears its timer', () => {
  const { launchAnimation, signal, controller } = start();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  controller.ready();
  vi.advanceTimersByTime(16); // Let one RAF cycle complete
  // After ready() is called, release() schedules timer to hide animation at 2300ms
  // RAF animation continues in parallel, but we're checking for the release timer
  expect(vi.getTimerCount()).toBeGreaterThanOrEqual(1);
  Object.assign(motion, { matches: true });
  const listener = vi.mocked(motion.addEventListener).mock.calls[0][1] as () => void;
  listener();
  expect(launchAnimation.isConnected).toBe(false);
  expect(signal.isConnected).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('clears the removal fallback when the exit transition completes', () => {
  const { launchAnimation, controller } = start();
  controller.ready();
  vi.advanceTimersByTime(2300);
  // Animation should be complete by now
  launchAnimation.dispatchEvent(new Event('transitionend'));
  vi.runAllTimers();
  expect(vi.getTimerCount()).toBe(0);
});

it('removes global failure listeners after readiness', () => {
  const { controller } = start();
  const remove = vi.spyOn(window, 'removeEventListener');
  controller.ready();
  expect(remove).toHaveBeenCalledWith('error', expect.any(Function), true);
  expect(remove).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
});
