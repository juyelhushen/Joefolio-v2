import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const script = html.match(/<script id="startup-controller">([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error('Missing initial startup controller');

function start(reduced = false, paint = true, settle = true) {
  vi.useFakeTimers();
  const motion = {
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => motion),
  );
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) =>
      window.setTimeout(() => {
        cb(performance.now());
        const fold = window.__STELLAR_FOLD__;
        if (settle && fold?.active && fold.elapsed >= 3200) {
          fold.settled = 3;
          window.dispatchEvent(new Event('stellar-fold-settled'));
        }
      }, 16),
    ),
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => clearTimeout(id)),
  );
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.body.append(document.importNode(parsed.getElementById('launch-animation')!, true));
  document.body.append(document.importNode(parsed.getElementById('startup-signal')!, true));
  const launch = document.getElementById('launch-animation')!;
  new Function('window', 'document', script!)(window, document);
  if (paint) window.dispatchEvent(new Event('stellar-fold-painted'));
  return {
    launch,
    signal: document.getElementById('startup-signal')!,
    fold: window.__STELLAR_FOLD__!,
    controller: window.__PORTFOLIO_STARTUP__!,
    motion,
  };
}

afterEach(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  document.dispatchEvent(new Event('visibilitychange'));
  window.__PORTFOLIO_STARTUP__?.ready();
  vi.runAllTimers();
  document.getElementById('launch-animation')?.remove();
  document.getElementById('startup-signal')?.remove();
  Reflect.deleteProperty(window, '__PORTFOLIO_STARTUP__');
  Reflect.deleteProperty(window, '__STELLAR_FOLD__');
  delete document.body.dataset.cosmicIntro;
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([0, 300, 1500])('keeps the cinema visible for 3200ms when ready at %ims', (readyAt) => {
  const { launch, controller, fold } = start();
  vi.advanceTimersByTime(readyAt);
  controller.ready();
  vi.advanceTimersByTime(3200 - readyAt);
  expect(launch.isConnected).toBe(true);
  vi.advanceTimersByTime(50);
  expect(fold.elapsed).toBe(3200);
  expect(launch.isConnected).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('starts the minimum clock after an actual environment frame, not entry execution', () => {
  const { launch, controller, fold } = start(false, false);
  controller.ready();
  vi.advanceTimersByTime(1500);
  expect(fold.elapsed).toBe(0);
  window.dispatchEvent(new Event('stellar-fold-painted'));
  vi.advanceTimersByTime(3200);
  expect(launch.isConnected).toBe(true);
  vi.advanceTimersByTime(50);
  expect(launch.isConnected).toBe(false);
});

it('runs anomaly, distortion, formation and reveal at the specified boundaries', () => {
  const { launch } = start();
  vi.advanceTimersByTime(700);
  expect(launch.dataset.scene).toBe('anomaly');
  vi.advanceTimersByTime(20);
  expect(launch.dataset.scene).toBe('distortion');
  vi.advanceTimersByTime(800);
  expect(launch.dataset.scene).toBe('formation');
  vi.advanceTimersByTime(900);
  expect(launch.dataset.scene).toBe('reveal');
});

it('holds the exact endpoint without clocks or replay while the critical hero is late', () => {
  const { fold, launch, controller } = start();
  vi.advanceTimersByTime(3500);
  const frames = vi.mocked(requestAnimationFrame).mock.calls.length;
  vi.advanceTimersByTime(2000);
  expect(fold.elapsed).toBe(3200);
  expect(launch.isConnected).toBe(true);
  expect(vi.mocked(requestAnimationFrame)).toHaveBeenCalledTimes(frames);
  controller.ready();
  vi.advanceTimersByTime(34);
  expect(launch.isConnected).toBe(false);
});

it('waits for both actual final frames instead of guessing a handoff delay', () => {
  const { fold, launch, controller } = start(false, true, false);
  controller.ready();
  vi.advanceTimersByTime(4000);
  expect(launch.isConnected).toBe(true);
  fold.settled = 1;
  window.dispatchEvent(new Event('stellar-fold-settled'));
  vi.advanceTimersByTime(100);
  expect(launch.isConnected).toBe(true);
  fold.settled = 3;
  window.dispatchEvent(new Event('stellar-fold-settled'));
  vi.advanceTimersByTime(16);
  expect(launch.isConnected).toBe(false);
});

it('cannot remain stuck if a renderer stops before acknowledging its final frame', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { launch, controller } = start(false, true, false);
  controller.ready();
  vi.advanceTimersByTime(5300);
  expect(launch.isConnected).toBe(false);
  expect(console.warn).toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('excludes hidden-tab time and resumes the same scene without restarting', () => {
  const { fold, controller, launch } = start();
  controller.ready();
  vi.advanceTimersByTime(900);
  const elapsed = fold.elapsed;
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new Event('visibilitychange'));
  vi.advanceTimersByTime(12000);
  expect(fold.elapsed).toBe(elapsed);
  expect(launch.isConnected).toBe(true);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  document.dispatchEvent(new Event('visibilitychange'));
  vi.advanceTimersByTime(16);
  expect(fold.elapsed).toBe(elapsed);
  vi.advanceTimersByTime(2400);
  expect(launch.isConnected).toBe(false);
});

it('does not count invisible time or time out the renderer when initially hidden', () => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  const { fold, controller } = start(false, false);
  controller.ready();
  vi.advanceTimersByTime(12000);
  expect(fold.active).toBe(true);
  expect(fold.elapsed).toBe(0);
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});

it('skips all cinematic delay and frames for reduced motion', () => {
  const { launch, controller, fold } = start(true);
  controller.ready();
  expect(fold.active).toBe(false);
  expect(launch.isConnected).toBe(false);
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('bypasses an active cinematic immediately when reduced motion changes', () => {
  const { launch, controller, motion } = start();
  controller.ready();
  vi.advanceTimersByTime(900);
  motion.matches = true;
  const callback = motion.addEventListener.mock.calls[0][1] as () => void;
  callback();
  expect(launch.isConnected).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('makes duplicate painted and StrictMode-ready notifications harmless', () => {
  const { controller, fold } = start();
  vi.advanceTimersByTime(900);
  const elapsed = fold.elapsed;
  window.dispatchEvent(new Event('stellar-fold-painted'));
  controller.ready();
  const timers = vi.getTimerCount();
  controller.ready();
  expect(fold.elapsed).toBe(elapsed);
  expect(vi.getTimerCount()).toBe(timers);
});

it.each(['stellar-fold-failed', 'timeout'])(
  'reveals the live fallback on renderer %s',
  (failure) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { controller, launch } = start(false, false);
    controller.ready();
    if (failure === 'timeout') vi.advanceTimersByTime(8000);
    else window.dispatchEvent(new Event(failure));
    expect(launch.isConnected).toBe(false);
    expect(console.warn).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  },
);

it('shows a readable reload fallback for an entry module failure', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const { signal, launch } = start();
  const entry = document.createElement('script');
  entry.type = 'module';
  document.body.append(entry);
  entry.dispatchEvent(new Event('error'));
  expect(launch.isConnected).toBe(false);
  expect(signal.getAttribute('role')).toBe('alert');
  expect(signal.textContent).toContain('The portfolio could not start');
  expect(signal.querySelector<HTMLAnchorElement>('.signal-reload')?.hidden).toBe(false);
  entry.remove();
});

it('ignores optional asset failures and removes global failure listeners on readiness', () => {
  const { signal, controller } = start();
  const remove = vi.spyOn(window, 'removeEventListener');
  const image = document.createElement('img');
  document.body.append(image);
  image.dispatchEvent(new Event('error'));
  expect(signal.dataset.failed).toBeUndefined();
  controller.ready();
  expect(remove).toHaveBeenCalledWith('error', expect.any(Function), true);
  expect(remove).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  image.remove();
});

it('offers a reload rather than an indefinite loader if critical readiness never arrives', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const { signal, fold } = start();
  vi.advanceTimersByTime(30000);
  expect(fold.active).toBe(false);
  expect(signal.getAttribute('role')).toBe('alert');
  expect(vi.getTimerCount()).toBe(0);
});
