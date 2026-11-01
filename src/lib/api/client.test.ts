import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(['development', 'production'])(
  'uses the configured Render URL in %s mode',
  async (mode) => {
    vi.stubEnv('MODE', mode);
    vi.stubEnv('VITE_API_BASE_URL', ' https://joefolio-backend.onrender.com/// ');
    vi.resetModules();

    const { apiClient } = await import('./client');
    expect(apiClient.defaults.baseURL).toBe('https://joefolio-backend.onrender.com');
    expect(apiClient.defaults.timeout).toBe(30_000);
    expect(apiClient.defaults.headers.Accept).toBe('application/json');
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    expect(apiClient.defaults.withCredentials).toBe(false);
  },
);

it.each([undefined, '', '   '])('defaults to Render when the URL is %s', async (baseUrl) => {
  vi.stubEnv('VITE_API_BASE_URL', baseUrl);
  vi.resetModules();

  const { apiClient } = await import('./client');
  expect(apiClient.defaults.baseURL).toBe('https://joefolio-backend.onrender.com');
});

it('allows a per-request host override without changing the shared defaults', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://joefolio-backend.onrender.com');
  vi.resetModules();
  const { apiClient } = await import('./client');

  expect(apiClient.getUri({ baseURL: 'https://assistant.example.test', url: '/api/chat' })).toBe(
    'https://assistant.example.test/api/chat',
  );
  expect(apiClient.defaults.baseURL).toBe('https://joefolio-backend.onrender.com');
});
