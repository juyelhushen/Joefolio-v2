import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { wakeBackend, type BackendHealthStatus } from '../../lib/api/backend-health';
import { useBackendHealth } from './useBackendHealth';

vi.mock('../../lib/api/backend-health', () => ({
  wakeBackend: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockIdleCallback() {
  let runIdleCallback: (() => void) | undefined;
  const cancelIdleCallback = vi.fn();
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((callback: () => void) => {
      runIdleCallback = callback;
      return 1;
    }),
  );
  vi.stubGlobal('cancelIdleCallback', cancelIdleCallback);
  return { runIdleCallback: () => runIdleCallback?.(), cancelIdleCallback };
}

it.each(['UP', 'UNAVAILABLE'] as const)(
  'tracks CHECKING then %s without a UI dependency',
  async (status) => {
    const idle = mockIdleCallback();
    let finish: ((status: BackendHealthStatus) => void) | undefined;
    vi.mocked(wakeBackend).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result, rerender } = renderHook(() => useBackendHealth());
    expect(result.current).toBe('CHECKING');
    rerender();
    expect(wakeBackend).not.toHaveBeenCalled();
    act(() => idle.runIdleCallback());
    expect(wakeBackend).toHaveBeenCalledTimes(1);
    finish?.(status);
    await waitFor(() => expect(result.current).toBe(status));
  },
);

it('does not update an unmounted consumer after the deferred warm-up settles', async () => {
  const idle = mockIdleCallback();
  let finish: ((status: BackendHealthStatus) => void) | undefined;
  vi.mocked(wakeBackend).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result, unmount } = renderHook(() => useBackendHealth());
  act(() => idle.runIdleCallback());
  expect(wakeBackend).toHaveBeenCalledTimes(1);
  unmount();
  finish?.('UP');
  await Promise.resolve();
  expect(result.current).toBe('CHECKING');
});
