import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Starfield from './Starfield';
import { EnvironmentProvider } from '../EnvironmentContext';

afterEach(() => {
  cleanup();
  delete document.body.dataset.cosmicIntro;
  Reflect.deleteProperty(window, '__STELLAR_FOLD__');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function setup(reduced = false, width = 1440) {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('devicePixelRatio', 3);
  let preference = reduced;
  const listeners: (() => void)[] = [];
  vi.stubGlobal(
    'matchMedia',
    vi.fn((media: string) => ({
      matches: media.includes('prefers-reduced-motion') ? preference : false,
      addEventListener: vi.fn((_event: string, callback: () => void) => {
        if (media.includes('prefers-reduced-motion')) listeners.push(callback);
      }),
      removeEventListener: vi.fn(),
    })),
  );
  const frames: FrameRequestCallback[] = [];
  const idle: (() => void)[] = [];
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => frames.push(callback)),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((callback: () => void) => idle.push(callback)),
  );
  vi.stubGlobal('cancelIdleCallback', vi.fn());
  const context = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  return {
    frames,
    idle,
    context,
    getContext,
    reduce() {
      preference = true;
      act(() => listeners.forEach((callback) => callback()));
    },
  };
}

function mount(paused = false) {
  return render(
    <EnvironmentProvider>
      <Starfield paused={paused} />
    </EnvironmentProvider>,
  );
}

it('warps the persistent sky during the intro without replacing its Canvas at handoff', () => {
  const { idle, frames, context, getContext } = setup();
  document.body.dataset.cosmicIntro = 'active';
  window.__STELLAR_FOLD__ = { active: true, elapsed: 900, painted: true, settled: 0 };
  const { container, unmount } = mount();
  expect(context.clearRect).toHaveBeenCalledTimes(1);
  expect(idle).toHaveLength(0);
  expect(frames).toHaveLength(1);
  expect(context.quadraticCurveTo).toHaveBeenCalled();
  const acquisitions = getContext.mock.calls.length;
  delete document.body.dataset.cosmicIntro;
  window.__STELLAR_FOLD__.active = false;
  act(() => window.dispatchEvent(new Event('cosmic-intro-complete')));
  act(() => window.dispatchEvent(new Event('cosmic-intro-complete')));
  expect(idle).toHaveLength(0);
  expect(frames).toHaveLength(1);
  expect(getContext).toHaveBeenCalledTimes(acquisitions);
  expect(container.querySelectorAll('canvas')).toHaveLength(1);
  expect(container.querySelector('.shooting-stars')).toBeNull();
  unmount();
  act(() => window.dispatchEvent(new Event('cosmic-intro-complete')));
  expect(idle).toHaveLength(0);
  expect(cancelAnimationFrame).toHaveBeenCalled();
});

it.each([
  [1440, '620', 1.5],
  [768, '400', 1.5],
  [390, '230', 1.15],
  [360, '230', 1.15],
])('keeps multiple moving particle layers at %ipx without a fine pointer', (width, stars, dpr) => {
  const { idle, frames, context } = setup(false, Number(width));
  const { container } = mount();
  expect(container.querySelector('canvas')?.dataset.stars).toBe(stars);
  expect(context.setTransform).toHaveBeenCalledWith(dpr, 0, 0, dpr, 0, 0);
  act(() => idle[0]());
  expect(frames).toHaveLength(1);
});

it('retains the full static sky without scheduling frames or events for reduced motion', () => {
  const { idle, frames, context } = setup(true, 390);
  const { container } = mount();
  expect(context.arc).toHaveBeenCalledTimes(230);
  expect(container.querySelector('canvas')?.dataset.events).toBe('0');
  expect(container.querySelector('canvas')?.dataset.trails).toBe('0');
  expect(idle).toHaveLength(0);
  expect(frames).toHaveLength(0);
});

it('stops active animation immediately when reduced motion changes at runtime', () => {
  const { idle, frames, reduce } = setup();
  mount();
  act(() => idle[0]());
  reduce();
  expect(frames).toHaveLength(1);
  expect(cancelAnimationFrame).toHaveBeenCalled();
});

it('pauses while hidden, then resumes one existing renderer without reacquiring contexts', () => {
  const { idle, frames, getContext } = setup();
  mount();
  act(() => idle[0]());
  const acquisitions = getContext.mock.calls.length;
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(cancelAnimationFrame).toHaveBeenCalled();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(frames).toHaveLength(2);
  expect(getContext).toHaveBeenCalledTimes(acquisitions);
});

it('selects a visible static fallback when Canvas acquisition fails', () => {
  const { getContext, idle } = setup();
  getContext.mockReturnValue(null);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = mount();
  expect(container.querySelector('canvas')?.dataset.static).toBe('true');
  expect(idle).toHaveLength(0);
  expect(console.warn).toHaveBeenCalled();
});

it('cancels pending idle work and never starts after unmount', () => {
  const { frames, idle } = setup();
  const { unmount } = mount();
  unmount();
  act(() => idle[0]());
  expect(frames).toHaveLength(0);
});
