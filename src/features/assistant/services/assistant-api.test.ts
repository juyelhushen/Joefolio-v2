import { afterEach, expect, it, vi } from 'vitest';
import { sendAssistantMessage } from './assistant-api';

const assistantBase = 'https://assistant.example.test/service/';
const validResponse = {
  conversationId: 'conversation-1',
  answer: 'An answer grounded in the portfolio.',
  citations: [{ title: 'Project', url: 'https://example.test/project' }],
  suggestedQuestions: ['What did you build?'],
};

afterEach(() => vi.unstubAllGlobals());

function respondWith(data: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

it('uses the assistant host and preserves request and response contracts', async () => {
  const fetchMock = respondWith(validResponse);
  expect(await sendAssistantMessage(assistantBase, '  Hello  ', 'conversation-1')).toEqual(
    validResponse,
  );
  expect(fetchMock.mock.calls[0][0]).toBe('https://assistant.example.test/service/api/chat');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    message: 'Hello',
    conversationId: 'conversation-1',
  });
});

it('validates input and configuration before making a request', async () => {
  const fetchMock = respondWith(validResponse);
  await expect(sendAssistantMessage('', 'Hello')).rejects.toMatchObject({ code: 'configuration' });
  await expect(sendAssistantMessage(assistantBase, ' ')).rejects.toMatchObject({
    code: 'validation',
  });
  await expect(
    sendAssistantMessage('https://user:password@example.test', 'Hello'),
  ).rejects.toMatchObject({ code: 'configuration' });
  expect(fetchMock).not.toHaveBeenCalled();
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

it('preserves safe HTTP and network errors', async () => {
  respondWith({}, 503);
  await expect(sendAssistantMessage(assistantBase, 'Hello')).rejects.toMatchObject({
    code: 'http',
    status: 503,
  });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('private network detail')));
  await expect(sendAssistantMessage(assistantBase, 'Hello')).rejects.toMatchObject({
    code: 'network',
  });
});

it('propagates cancellation through the shared client', async () => {
  const controller = new AbortController();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    ),
  );
  const request = sendAssistantMessage(assistantBase, 'Hello', undefined, controller.signal);
  const assertion = expect(request).rejects.toMatchObject({ code: 'aborted' });
  controller.abort();
  await assertion;
});
