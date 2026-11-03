import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('uses the same-origin Vite proxy in development', async () => {
  vi.stubEnv('MODE', 'development');
  vi.stubEnv('VITE_API_BASE_URL', 'https://joefolio-backend.onrender.com');
  vi.resetModules();

  const { apiClient } = await import('./client');
  expect(apiClient.defaults.baseURL).toBe('/backend');
  expect(apiClient.getUri({ url: '/api/v1/contact' })).toBe('/backend/api/v1/contact');
});

it('uses the configured Render URL in production', async () => {
  vi.stubEnv('MODE', 'production');
  vi.stubEnv('VITE_API_BASE_URL', ' https://joefolio-backend.onrender.com/// ');
  vi.resetModules();

  const { apiClient } = await import('./client');
  expect(apiClient.defaults.baseURL).toBe('https://joefolio-backend.onrender.com');
  expect(apiClient.defaults.timeout).toBe(30_000);
  expect(apiClient.defaults.headers.Accept).toBe('application/json');
  expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  expect(apiClient.defaults.withCredentials).toBe(false);
});

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
