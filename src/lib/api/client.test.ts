import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('uses the configured public base URL and shared JSON client defaults', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/v1/');
  vi.resetModules();

  const { apiClient } = await import('./client');
  expect(apiClient.defaults.baseURL).toBe('https://api.example.test/v1');
  expect(apiClient.defaults.timeout).toBe(30_000);
  expect(apiClient.defaults.headers.Accept).toBe('application/json');
  expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  expect(apiClient.defaults.withCredentials).toBe(false);
});

it('falls back to the deployed Spring Boot API when no base URL is configured', async () => {
  vi.stubEnv('VITE_API_BASE_URL', '');
  vi.resetModules();

  const { apiClient } = await import('./client');
  expect(apiClient.defaults.baseURL).toBe('https://joefolio-backend.onrender.com');
});
