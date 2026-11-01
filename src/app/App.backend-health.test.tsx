import { StrictMode } from 'react';
import { AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '../lib/api/client';
import App from './App';
import { useBackendHealth } from './hooks/useBackendHealth';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  cleanup();
  apiClient.defaults.adapter = originalAdapter;
  window.sessionStorage.removeItem('joefolio-universe-intro-seen');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const HealthConsumer = () => <output aria-label="Test backend status">{useBackendHealth()}</output>;

it('warms on application opening without blocking rendering or duplicating across StrictMode, consumers and remounts', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  let resolveResponse: ((response: AxiosResponse<unknown>) => void) | undefined;
  const adapter = vi.fn<AxiosAdapter>(
    () =>
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
  );
  apiClient.defaults.adapter = adapter;
  const view = render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await waitFor(() => expect(adapter).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  expect(adapter.mock.calls[0][0].url).toBe('/actuator/health');

  view.rerender(
    <StrictMode>
      <App />
      <HealthConsumer />
    </StrictMode>,
  );
  expect(screen.getByLabelText('Test backend status').textContent).toBe('CHECKING');
  expect(adapter).toHaveBeenCalledTimes(1);
  expect(resolveResponse).toBeDefined();
  resolveResponse?.({
    config: adapter.mock.calls[0][0],
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    data: { status: 'UP' },
  });
  await waitFor(() => expect(screen.getByLabelText('Test backend status').textContent).toBe('UP'));
  view.unmount();
  render(
    <StrictMode>
      <App />
      <HealthConsumer />
    </StrictMode>,
  );
  await waitFor(() => expect(screen.getByLabelText('Test backend status').textContent).toBe('UP'));
  expect(adapter).toHaveBeenCalledTimes(1);
});
