import { expect, it } from 'vitest';
import { normalizeApiError } from './api-error';

function axiosResponseError(status: number, data: unknown) {
  return {
    isAxiosError: true,
    code: 'ERR_BAD_RESPONSE',
    response: { status, data },
  };
}

it('reads Spring ProblemDetail and regular API response messages', () => {
  expect(
    normalizeApiError(
      axiosResponseError(400, {
        detail: 'The subject is required.',
        status: 400,
        title: 'Bad Request',
      }),
    ).message,
  ).toBe('The subject is required.');

  expect(normalizeApiError(axiosResponseError(400, { message: 'Invalid email.' })).message).toBe(
    'Invalid email.',
  );
  expect(normalizeApiError(axiosResponseError(400, { error: 'Bad request.' })).message).toBe(
    'Bad request.',
  );
});

it('uses useful safe messages for common HTTP statuses', () => {
  expect(normalizeApiError(axiosResponseError(401, {})).message).toContain('authorize');
  expect(normalizeApiError(axiosResponseError(403, {})).message).toContain('cannot accept');
  expect(normalizeApiError(axiosResponseError(404, {})).message).toContain('not be found');
  expect(
    normalizeApiError(axiosResponseError(429, { message: 'Please wait ten minutes.' })).message,
  ).toBe('Please wait ten minutes.');
  expect(normalizeApiError(axiosResponseError(500, {})).message).toContain('encountered an error');
  expect(normalizeApiError(axiosResponseError(502, {})).message).toContain(
    'temporarily unavailable',
  );
  expect(normalizeApiError(axiosResponseError(503, {})).message).toContain(
    'temporarily unavailable',
  );
});

it('does not expose server internals or provider details', () => {
  const message = normalizeApiError(
    axiosResponseError(503, {
      detail: 'Internal exception from org.springframework with provider secret.',
    }),
  ).message;
  expect(message).toContain('temporarily unavailable');
  expect(message).not.toContain('provider secret');
});

it('normalizes network, timeout, and unexpected errors', () => {
  expect(normalizeApiError({ isAxiosError: true, code: 'ERR_NETWORK' }).message).toContain(
    'Could not reach',
  );
  expect(normalizeApiError({ isAxiosError: true, code: 'ECONNABORTED' }).message).toContain(
    'too long',
  );
  expect(normalizeApiError(new Error('private details')).message).toContain(
    'contact service is unavailable',
  );
});
