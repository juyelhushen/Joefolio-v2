const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultBaseUrl =
  import.meta.env.MODE === 'development'
    ? '/backend'
    : (configuredBaseUrl || 'https://joefolio-backend.onrender.com').replace(/\/+$/, '');

export class HttpError extends Error {
  constructor(
    readonly code: 'http' | 'network' | 'timeout' | 'aborted',
    readonly status?: number,
    readonly data?: unknown,
  ) {
    super(`HTTP request failed: ${code}`);
    this.name = 'HttpError';
  }
}

type RequestOptions = {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<{ status: number; data: T }> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeout ?? 30_000);

  try {
    const response = await fetch(
      `${(options.baseURL ?? defaultBaseUrl).replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`,
      {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'same-origin',
        signal: controller.signal,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
    const text = await response.text();
    let data: unknown = text;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Match the existing client's handling of non-JSON responses.
      }
    }
    if (!response.ok) throw new HttpError('http', response.status, data);
    return { status: response.status, data: data as T };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (timedOut) throw new HttpError('timeout');
    if (options.signal?.aborted) throw new HttpError('aborted');
    throw new HttpError('network');
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
};
