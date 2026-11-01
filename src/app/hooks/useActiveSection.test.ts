import { cleanup, renderHook, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useActiveSection } from './useActiveSection';

it('keeps Projects active for case-study hashes on load and history changes', () => {
  history.replaceState(null, '', '#projects/sentinel');
  const { result } = renderHook(() => useActiveSection());
  expect(result.current.activeSection).toBe('projects');
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    history.replaceState(null, '', '#projects/cut2short');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(result.current.activeSection).toBe('projects');
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('cancels pending history measurements when a newer measurement arrives and on unmount', () => {
  let nextFrame = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => ++nextFrame),
  );
  const cancelFrame = vi.fn();
  vi.stubGlobal('cancelAnimationFrame', cancelFrame);
  const { unmount } = renderHook(() => useActiveSection());

  window.dispatchEvent(new PopStateEvent('popstate'));
  window.dispatchEvent(new PopStateEvent('popstate'));
  expect(cancelFrame).toHaveBeenCalledWith(2);
  unmount();
  expect(cancelFrame).toHaveBeenCalledWith(1);
  expect(cancelFrame).toHaveBeenCalledWith(3);
  expect(cancelFrame).toHaveBeenCalledTimes(3);
});
