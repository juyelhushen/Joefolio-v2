import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('sends one uncached health request and retains the result', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://joefolio-backend.onrender.com///');
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"UP"}'));
  vi.stubGlobal('fetch', fetchMock);
  const { wakeBackend } = await import('./backend-health');
  const first = wakeBackend();
  expect(wakeBackend()).toBe(first);
  await expect(first).resolves.toBe('UP');
  await expect(wakeBackend()).resolves.toBe('UP');
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock).toHaveBeenCalledWith(
    'https://joefolio-backend.onrender.com/actuator/health',
    expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ 'Cache-Control': 'no-cache, no-store' }),
      credentials: 'same-origin',
    }),
  );
});

it.each([null, {}, 'UP', { status: 'DOWN' }, { status: 42 }, { status: 'up' }])(
  'returns UNAVAILABLE for unhealthy data %j',
  async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
    const { wakeBackend } = await import('./backend-health');
    await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
  },
);

it.each([202, 204, 503])('does not accept HTTP %i as healthy', async (status) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(status === 204 ? null : '{"status":"UP"}', { status })),
  );
  const { wakeBackend } = await import('./backend-health');
  await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
});

it('handles transport failure safely without retrying', async () => {
  const fetchMock = vi.fn().mockRejectedValue(new TypeError('private details'));
  vi.stubGlobal('fetch', fetchMock);
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { wakeBackend } = await import('./backend-health');
  await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
  await expect(wakeBackend()).resolves.toBe('UNAVAILABLE');
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(warning).toHaveBeenCalledWith('Backend warm-up could not reach a healthy service.');
});
