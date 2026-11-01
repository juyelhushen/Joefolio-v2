import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { wakeBackend, type BackendHealthStatus } from '../../lib/api/backend-health';
import { useBackendHealth } from './useBackendHealth';

vi.mock('../../lib/api/backend-health', () => ({
  wakeBackend: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

it.each(['UP', 'UNAVAILABLE'] as const)(
  'tracks CHECKING then %s without a UI dependency',
  async (status) => {
    let finish: ((status: BackendHealthStatus) => void) | undefined;
    vi.mocked(wakeBackend).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result, rerender } = renderHook(() => useBackendHealth());
    expect(result.current).toBe('CHECKING');
    rerender();
    expect(wakeBackend).toHaveBeenCalledTimes(1);
    finish?.(status);
    await waitFor(() => expect(result.current).toBe(status));
  },
);

it('leaves a shared warm-up running after a consumer unmounts', async () => {
  let finish: ((status: BackendHealthStatus) => void) | undefined;
  vi.mocked(wakeBackend).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result, unmount } = renderHook(() => useBackendHealth());
  unmount();
  finish?.('UP');
  await Promise.resolve();
  expect(result.current).toBe('CHECKING');
});
