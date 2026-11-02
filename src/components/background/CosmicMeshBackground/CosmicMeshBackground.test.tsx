import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CosmicMeshBackground from './CosmicMeshBackground';

vi.mock('../../../hooks/useEffectsPreference', () => ({
  useEffectsPreference: () => ({ reducedEffects: false }),
}));

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, 'connection');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockIdleCallback() {
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

it('waits for idle time before acquiring WebGL resources', () => {
  const callbacks = mockIdleCallback();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(<CosmicMeshBackground />);

  expect(container.querySelector('.cosmic-mesh-background')?.getAttribute('data-mode')).toBe(
    'static',
  );
  expect(callbacks).toHaveLength(1);
  expect(getContext).not.toHaveBeenCalled();

  act(() => callbacks[0]());

  expect(getContext).toHaveBeenCalledTimes(1);
});

it('keeps the CSS mesh on mobile without acquiring a WebGL context', () => {
  const callbacks = mockIdleCallback();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((media: string) => ({
      matches: media === '(max-width: 740px)',
      media,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const { container } = render(<CosmicMeshBackground />);

  expect(container.querySelector('.cosmic-mesh-background')?.getAttribute('data-mode')).toBe(
    'static',
  );
  expect(callbacks).toHaveLength(0);
  expect(getContext).not.toHaveBeenCalled();
});

it('keeps the CSS mesh when the connection requests data saving', () => {
  const callbacks = mockIdleCallback();
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: true },
  });
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const { container } = render(<CosmicMeshBackground />);

  expect(container.querySelector('.cosmic-mesh-background')?.getAttribute('data-mode')).toBe(
    'static',
  );
  expect(callbacks).toHaveLength(0);
  expect(getContext).not.toHaveBeenCalled();
});

it('cancels the pending WebGL initialization when unmounted', () => {
  mockIdleCallback();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const { unmount } = render(<CosmicMeshBackground />);

  unmount();
  expect(cancelIdleCallback).toHaveBeenCalledWith(1);
  expect(getContext).not.toHaveBeenCalled();
});
