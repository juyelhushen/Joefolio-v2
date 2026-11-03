import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Starfield, { advanceStars, type Star } from './Starfield';

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, 'connection');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createStar(x: number, velocityX: number, velocityY = 0): Star {
  return {
    x,
    y: 100,
    radius: 1,
    alpha: 0.5,
    phase: 0,
    twinkleSpeed: 1,
    depth: 0.5,
    velocityX,
    velocityY,
  };
}

function mockCanvasContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
}

function mockAnimationFrames() {
  const callbacks: FrameRequestCallback[] = [];
  let id = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      callbacks.push(callback);
      id += 1;
      return id;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  return callbacks;
}

function mockIdleCallbacks() {
  const callbacks: (() => void)[] = [];
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((callback: () => void) => {
      callbacks.push(callback);
      return callbacks.length;
    }),
  );
  vi.stubGlobal('cancelIdleCallback', vi.fn());
  return callbacks;
}

function mockMotionPreference(reduced: boolean, mobile = false) {
  let currentPreference = reduced;
  const changeListeners: { media: string; listener: EventListener }[] = [];
  const removedListeners = vi.fn();
  const matchMedia = vi.fn((media: string) => ({
    matches:
      (media.includes('prefers-reduced-motion') && currentPreference) ||
      (media.includes('(max-width: 740px)') && mobile),
    media,
    addEventListener: vi.fn(
      (_type: string, listener: EventListenerOrEventListenerObject | null) => {
        if (listener && typeof listener === 'function') changeListeners.push({ media, listener });
      },
    ),
    removeEventListener: vi.fn(
      (_type: string, listener: EventListenerOrEventListenerObject | null) => {
        removedListeners(listener);
      },
    ),
  }));
  vi.stubGlobal('matchMedia', matchMedia);
  const setReducedPreference = (next: boolean) => {
    currentPreference = next;
    for (const { media, listener } of changeListeners) {
      if (media.includes('prefers-reduced-motion'))
        listener(Object.assign(new Event('change'), { matches: next }));
    }
  };
  return { matchMedia, changeListeners, removedListeners, setReducedPreference };
}

it('moves different depths at distinct time-based speeds and wraps at viewport edges', () => {
  const distant = createStar(100, -2, 0.5);
  const nearby = createStar(100, -10, -1);
  const edge = createStar(1, -10);

  advanceStars([distant, nearby, edge], 0.5, 1000, 600);

  expect(distant.x).toBe(99);
  expect(distant.y).toBe(100.25);
  expect(nearby.x).toBe(95);
  expect(nearby.y).toBe(99.5);
  expect(edge.x).toBe(1000);
});

it('does not change positions when time or viewport dimensions are invalid', () => {
  const star = createStar(100, -8);

  advanceStars([star], -1, 1000, 600);
  advanceStars([star], 1, 0, 600);

  expect(star.x).toBe(100);
});

it('schedules canvas animation when motion is enabled and cancels it on unmount', () => {
  const idleCallbacks = mockIdleCallbacks();
  const callbacks = mockAnimationFrames();
  mockMotionPreference(false);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);

  const { container, unmount } = render(<Starfield />);
  const canvas = container.querySelector('canvas');

  expect(callbacks).toHaveLength(0);
  expect(idleCallbacks).toHaveLength(1);
  act(() => idleCallbacks[0]());
  expect(callbacks.length).toBeGreaterThan(0);
  expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  expect(canvas?.className).toBe('starfield');
  unmount();
  expect(cancelAnimationFrame).toHaveBeenCalled();
});

it('draws a stable canvas without scheduling frames for reduced motion', () => {
  const idleCallbacks = mockIdleCallbacks();
  const callbacks = mockAnimationFrames();
  mockMotionPreference(true);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);

  render(<Starfield />);

  expect(callbacks).toHaveLength(0);
  expect(idleCallbacks).toHaveLength(0);
  expect(context.clearRect).toHaveBeenCalled();
});

it('draws a static starfield on mobile without scheduling animation', () => {
  const idleCallbacks = mockIdleCallbacks();
  const callbacks = mockAnimationFrames();
  mockMotionPreference(false, true);
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');

  const { container } = render(<Starfield />);

  expect(callbacks).toHaveLength(0);
  expect(idleCallbacks).toHaveLength(0);
  expect(getContext).not.toHaveBeenCalled();
  expect(container.querySelector('canvas')?.dataset.static).toBe('true');
});

it('keeps the starfield static when the connection requests data saving', () => {
  const idleCallbacks = mockIdleCallbacks();
  const callbacks = mockAnimationFrames();
  mockMotionPreference(false);
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: {
      saveData: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');

  const { container } = render(<Starfield />);

  expect(callbacks).toHaveLength(0);
  expect(idleCallbacks).toHaveLength(0);
  expect(getContext).not.toHaveBeenCalled();
  expect(container.querySelector('canvas')?.dataset.static).toBe('true');
});

it('stops animation when reduced motion is enabled at runtime and removes preference listeners', () => {
  const idleCallbacks = mockIdleCallbacks();
  const callbacks = mockAnimationFrames();
  const preference = mockMotionPreference(false);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  const { unmount } = render(<Starfield />);
  act(() => idleCallbacks[0]());

  act(() => preference.setReducedPreference(true));

  expect(callbacks).toHaveLength(1);
  expect(context.clearRect).toHaveBeenCalledTimes(2);
  unmount();
  expect(preference.removedListeners).toHaveBeenCalled();
});

it('pauses while the document is hidden and resumes when it becomes visible', () => {
  const idleCallbacks = mockIdleCallbacks();
  mockAnimationFrames();
  mockMotionPreference(false);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  const { container } = render(<Starfield />);
  act(() => idleCallbacks[0]());

  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(cancelAnimationFrame).toHaveBeenCalled();
  expect(container.querySelector('.shooting-stars')?.getAttribute('data-running')).toBe('false');

  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  expect(container.querySelector('.shooting-stars')?.getAttribute('data-running')).toBe('true');
});

it.each([
  { reduced: false, mobile: false, paused: false, running: 'true' },
  { reduced: true, mobile: false, paused: false, running: 'false' },
  { reduced: false, mobile: true, paused: false, running: 'false' },
  { reduced: false, mobile: false, paused: true, running: 'false' },
])('gates three decorative CSS shooting stars: %j', ({ reduced, mobile, paused, running }) => {
  mockIdleCallbacks();
  mockAnimationFrames();
  mockMotionPreference(reduced, mobile);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  const { container, rerender } = render(<Starfield paused={paused} />);
  const layer = container.querySelector('.shooting-stars');
  expect(layer?.getAttribute('aria-hidden')).toBe('true');
  expect(layer?.getAttribute('data-running')).toBe(running);
  expect(layer?.children).toHaveLength(3);
  expect(context.createLinearGradient).not.toHaveBeenCalled();
  rerender(<Starfield paused />);
  expect(layer?.getAttribute('data-running')).toBe('false');
});

it('resizes the backing canvas to valid dimensions and applies a capped pixel ratio', () => {
  mockIdleCallbacks();
  mockAnimationFrames();
  mockMotionPreference(false);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 });
  const { container } = render(<Starfield />);
  const canvas = container.querySelector('canvas');

  expect(canvas?.width).toBeGreaterThan(0);
  expect(canvas?.height).toBeGreaterThan(0);
  expect(context.setTransform).toHaveBeenCalledWith(1.7, 0, 0, 1.7, 0, 0);
});
