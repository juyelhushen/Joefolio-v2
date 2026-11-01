import { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const installAdapter = async (status: number, data: unknown) => {
  const { apiClient } = await import('./client');
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    const response = { config, headers: new AxiosHeaders(), status, statusText: '', data };
    if (!config.validateStatus?.(status)) {
      throw new AxiosError(
        'Private backend details',
        AxiosError.ERR_BAD_RESPONSE,
        config,
        undefined,
        response,
      );
    }
    return response;
  });
  apiClient.defaults.adapter = adapter;
  return { apiClient, adapter };
};

it('uses the shared configured client with a cold-start timeout and uncached health request', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://joefolio-backend.onrender.com///');
  const { apiClient, adapter } = await installAdapter(200, { status: 'UP' });
  const { wakeBackend } = await import('./backend-health');

  const first = wakeBackend();
  expect(wakeBackend()).toBe(first);
  await expect(first).resolves.toBe('UP');
  await expect(wakeBackend()).resolves.toBe('UP');
  expect(adapter).toHaveBeenCalledTimes(1);
  const config = adapter.mock.calls[0][0];
  expect(config.url).toBe('/actuator/health');
  expect(config.method).toBe('get');
  expect(apiClient.getUri(config)).toBe('https://joefolio-backend.onrender.com/actuator/health');
  expect(config.timeout).toBe(90_000);
  expect(config.headers.get('Cache-Control')).toBe('no-cache, no-store');
  expect(config.withCredentials).toBe(false);
  expect(apiClient.defaults.timeout).toBe(30_000);
});

it.each([null, {}, 'UP', { status: 'DOWN' }, { status: 42 }, { status: 'up' }])(
  'returns UNAVAILABLE for malformed or unhealthy HTTP 200 data: %j',
  async (data) => {
    await installAdapter(200, data);
    const { wakeBackend } = await import('./backend-health');
    await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
  },
);

it.each([202, 204, 503])('does not accept HTTP %i as healthy', async (status) => {
  await installAdapter(status, { status: 'UP', detail: 'Private server details' });
  const { wakeBackend } = await import('./backend-health');
  await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
});

it.each([AxiosError.ERR_NETWORK, AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])(
  'handles transport failure %s safely without retrying',
  async (code) => {
    const { apiClient } = await import('./client');
    const adapter = vi.fn<AxiosAdapter>(async () => {
      throw new AxiosError('Private transport details', code);
    });
    apiClient.defaults.adapter = adapter;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { wakeBackend } = await import('./backend-health');
    await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
    await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith('Backend warm-up could not reach a healthy service.');
  },
);

it('does not log failures or server details in production', async () => {
  vi.stubEnv('DEV', false);
  await installAdapter(503, { detail: 'Private stack trace' });
  const warning = vi.spyOn(console, 'warn');
  const { wakeBackend } = await import('./backend-health');
  await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
  expect(warning).not.toHaveBeenCalled();
});
