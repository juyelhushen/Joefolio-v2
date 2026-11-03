import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useSystemReducedMotion } from './useSystemReducedMotion';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('reads the OS immediately, responds to live changes and removes its subscription', () => {
  let reduced = false;
  const listeners = new Set<() => void>();
  const addEventListener = vi.fn((_type: string, listener: () => void) => listeners.add(listener));
  const removeEventListener = vi.fn((_type: string, listener: () => void) =>
    listeners.delete(listener),
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return reduced;
      },
      addEventListener,
      removeEventListener,
    })),
  );
  const readStorage = vi.spyOn(Storage.prototype, 'getItem');
  const { result, unmount } = renderHook(useSystemReducedMotion);
  expect(result.current).toBe(false);
  act(() => {
    reduced = true;
    listeners.forEach((notify) => notify());
  });
  expect(result.current).toBe(true);
  act(() => {
    reduced = false;
    listeners.forEach((notify) => notify());
  });
  expect(result.current).toBe(false);
  expect(readStorage).not.toHaveBeenCalled();
  const listenerCount = listeners.size;
  unmount();
  expect(listeners.size).toBe(listenerCount - 1);
  expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});

it('reads an initially reduced OS setting without any persisted override', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  expect(renderHook(useSystemReducedMotion).result.current).toBe(true);
});
