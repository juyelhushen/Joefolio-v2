import { AxiosError, AxiosHeaders, CanceledError, type AxiosAdapter } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from './api/client';
import { sendAssistantMessage } from './assistant-api';

const originalAdapter = apiClient.defaults.adapter;
const assistantBase = 'https://assistant.example.test/service/';
const validResponse = {
  conversationId: 'conversation-1',
  answer: 'An answer grounded in the portfolio.',
  citations: [{ title: 'Project', url: 'https://example.test/project' }],
  suggestedQuestions: ['What did you build?'],
};

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

function respondWith(data: unknown, status = 200) {
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    const response = { data, status, statusText: '', headers: new AxiosHeaders(), config };
    if (status >= 400) {
      throw new AxiosError(
        'Private server detail',
        AxiosError.ERR_BAD_RESPONSE,
        config,
        undefined,
        response,
      );
    }
    return response;
  });
  apiClient.defaults.adapter = adapter;
  return adapter;
}

it('uses a per-request assistant host and preserves request and response contracts', async () => {
  const adapter = respondWith(validResponse);
  const originalBase = apiClient.defaults.baseURL;

  expect(await sendAssistantMessage(assistantBase, '  Hello  ', 'conversation-1')).toEqual(
    validResponse,
  );
  const config = adapter.mock.calls[0][0];
  expect(config.baseURL).toBe('https://assistant.example.test/service');
  expect(config.url).toBe('/api/chat');
  expect(JSON.parse(config.data)).toEqual({ message: 'Hello', conversationId: 'conversation-1' });
  expect(apiClient.getUri(config)).toBe('https://assistant.example.test/service/api/chat');
  expect(apiClient.defaults.baseURL).toBe(originalBase);
});

it('stays unavailable without its own configuration and validates input before requests', async () => {
  const adapter = respondWith(validResponse);
  await expect(sendAssistantMessage('', 'Hello')).rejects.toMatchObject({ code: 'configuration' });
  await expect(sendAssistantMessage(assistantBase, ' ')).rejects.toMatchObject({
    code: 'validation',
  });
  await expect(
    sendAssistantMessage('https://user:password@example.test', 'Hello'),
  ).rejects.toMatchObject({
    code: 'configuration',
  });
  expect(adapter).not.toHaveBeenCalled();
});

it.each([
  null,
  'not JSON',
  { answer: 'Missing conversation' },
  { ...validResponse, citations: [{ title: 'Unsafe', url: 'javascript:alert(1)' }] },
  { ...validResponse, suggestedQuestions: [''] },
])('rejects malformed responses and citations', async (payload) => {
  respondWith(payload);
  await expect(sendAssistantMessage(assistantBase, 'Hello')).rejects.toMatchObject({
    code: 'malformed-response',
  });
});

it('preserves safe HTTP and network error types and messages', async () => {
  respondWith({}, 503);
  await expect(sendAssistantMessage(assistantBase, 'Hello')).rejects.toMatchObject({
    code: 'http',
    status: 503,
    message: 'The assistant service returned an error (503). Please try again later.',
  });
  apiClient.defaults.adapter = async () => {
    throw new AxiosError('Private network detail', AxiosError.ERR_NETWORK);
  };
  await expect(sendAssistantMessage(assistantBase, 'Hello')).rejects.toMatchObject({
    code: 'network',
    message: 'Could not reach the assistant service. Please try again.',
  });
});

it('passes AbortSignal cancellation through the shared client', async () => {
  const controller = new AbortController();
  const adapter = vi.fn<AxiosAdapter>((config) => {
    expect(config.signal).toBe(controller.signal);
    return new Promise((_, reject) => {
      config.signal?.addEventListener?.('abort', () => reject(new CanceledError('cancelled')));
    });
  });
  apiClient.defaults.adapter = adapter;
  const request = sendAssistantMessage(assistantBase, 'Hello', undefined, controller.signal);
  const assertion = expect(request).rejects.toMatchObject({
    code: 'aborted',
    message: 'The request was cancelled.',
  });
  controller.abort();
  await assertion;
  expect(adapter).toHaveBeenCalledTimes(1);
});
