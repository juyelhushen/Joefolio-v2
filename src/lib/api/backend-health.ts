import { apiClient } from './client';

export type BackendHealthStatus = 'UP' | 'UNAVAILABLE';

// Retain the settled result too: a page visit initiates only one warm-up, not polling.
let warmUpPromise: Promise<BackendHealthStatus> | undefined;

const checkBackendHealth = async (): Promise<BackendHealthStatus> => {
  try {
    const response = await apiClient.get<unknown>('/actuator/health', {
      timeout: 90_000,
      headers: { 'Cache-Control': 'no-cache, no-store' },
      withCredentials: false,
    });
    if (
      response.status === 200 &&
      typeof response.data === 'object' &&
      response.data !== null &&
      'status' in response.data &&
      response.data.status === 'UP'
    ) {
      return 'UP';
    }
  } catch {
    // Warm-up is best-effort; never surface transport or server internals to visitors.
    if (import.meta.env.DEV) console.warn('Backend warm-up could not reach a healthy service.');
    return 'UNAVAILABLE';
  }

  if (import.meta.env.DEV) console.warn('Backend warm-up received an unhealthy response.');
  return 'UNAVAILABLE';
};

export const wakeBackend = (): Promise<BackendHealthStatus> => {
  warmUpPromise ??= checkBackendHealth();
  return warmUpPromise;
};
