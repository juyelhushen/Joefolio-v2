import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Starfield, { advanceStars, type Star } from './Starfield';

afterEach(() => {
  cleanup();
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

function mockMotionPreference(reduced: boolean) {
  const changeListeners: { media: string; listener: EventListener }[] = [];
  const removedListeners = vi.fn();
  const matchMedia = vi.fn((media: string) => ({
    matches: media.includes('prefers-reduced-motion') && reduced,
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
  return { matchMedia, changeListeners, removedListeners };
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
  const callbacks = mockAnimationFrames();
  mockMotionPreference(false);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);

  const { container, unmount } = render(<Starfield />);
  const canvas = container.querySelector('canvas');

  expect(callbacks.length).toBeGreaterThan(0);
  expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  expect(canvas?.className).toBe('starfield');
  unmount();
  expect(cancelAnimationFrame).toHaveBeenCalled();
});

it('draws a stable canvas without scheduling frames for reduced motion', () => {
  const callbacks = mockAnimationFrames();
  mockMotionPreference(true);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);

  render(<Starfield />);

  expect(callbacks).toHaveLength(0);
  expect(context.clearRect).toHaveBeenCalled();
});

it('stops animation when reduced motion is enabled at runtime and removes preference listeners', () => {
  const callbacks = mockAnimationFrames();
  const preference = mockMotionPreference(false);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  const { unmount } = render(<Starfield />);

  const motionListener = preference.changeListeners.find(({ media }) =>
    media.includes('prefers-reduced-motion'),
  )?.listener;
  motionListener?.(Object.assign(new Event('change'), { matches: true }) as MediaQueryListEvent);

  expect(callbacks).toHaveLength(1);
  expect(context.clearRect).toHaveBeenCalledTimes(2);
  unmount();
  expect(preference.removedListeners).toHaveBeenCalled();
});

it('pauses while the document is hidden and resumes when it becomes visible', () => {
  mockAnimationFrames();
  mockMotionPreference(false);
  const context = mockCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  render(<Starfield />);

  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new Event('visibilitychange'));
  expect(cancelAnimationFrame).toHaveBeenCalled();

  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  document.dispatchEvent(new Event('visibilitychange'));
  expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
});

it('resizes the backing canvas to valid dimensions and applies a capped pixel ratio', () => {
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
