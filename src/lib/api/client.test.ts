import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.resetModules();
});

it.each([
  ['development', 'https://other.example', '/backend/api/v1/contact'],
  ['production', ' https://api.example/// ', 'https://api.example/api/v1/contact'],
  ['production', '', 'https://joefolio-backend.onrender.com/api/v1/contact'],
])('uses the correct base URL in %s', async (mode, base, expected) => {
  vi.stubEnv('MODE', mode);
  vi.stubEnv('VITE_API_BASE_URL', base);
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"message":"ok"}', { status: 202 }));
  vi.stubGlobal('fetch', fetchMock);
  const { apiClient } = await import('./client');
  await expect(apiClient.post('/api/v1/contact', { name: 'Casey' })).resolves.toEqual({
    status: 202,
    data: { message: 'ok' },
  });
  expect(fetchMock).toHaveBeenCalledWith(
    expected,
    expect.objectContaining({
      method: 'POST',
      credentials: 'same-origin',
      body: '{"name":"Casey"}',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    }),
  );
});

it('preserves HTTP response data and distinguishes timeout, cancellation and network failure', async () => {
  const { apiClient } = await import('./client');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('{"detail":"Invalid"}', { status: 400 })),
  );
  await expect(apiClient.get('/error')).rejects.toMatchObject({
    code: 'http',
    status: 400,
    data: { detail: 'Invalid' },
  });

  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
  await expect(apiClient.get('/error')).rejects.toMatchObject({ code: 'network' });

  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          ),
        ),
    ),
  );
  const timeout = apiClient.get('/slow', { timeout: 50 });
  const timeoutResult = expect(timeout).rejects.toMatchObject({ code: 'timeout' });
  await vi.advanceTimersByTimeAsync(50);
  await timeoutResult;

  const controller = new AbortController();
  const cancelled = apiClient.get('/cancel', { signal: controller.signal });
  const cancelledResult = expect(cancelled).rejects.toMatchObject({ code: 'aborted' });
  controller.abort();
  await cancelledResult;
});

it('honours a signal that was already aborted before the request', async () => {
  const controller = new AbortController();
  controller.abort();
  vi.stubGlobal(
    'fetch',
    vi.fn((_url: string, init: RequestInit) => {
      expect(init.signal?.aborted).toBe(true);
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }),
  );
  const { apiClient } = await import('./client');
  await expect(apiClient.get('/cancel', { signal: controller.signal })).rejects.toMatchObject({
    code: 'aborted',
  });
});

it('uses an assistant host override and handles text and empty responses', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response('plain text'))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  const { apiClient } = await import('./client');
  await expect(
    apiClient.get('/api/chat', { baseURL: 'https://assistant.example/service/' }),
  ).resolves.toMatchObject({ data: 'plain text' });
  expect(fetchMock.mock.calls[0][0]).toBe('https://assistant.example/service/api/chat');
  await expect(apiClient.get('/empty')).resolves.toMatchObject({ status: 204, data: '' });
});
