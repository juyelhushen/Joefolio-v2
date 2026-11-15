import { afterEach, expect, it, vi } from 'vitest';
import { sendContactMessage } from './contact-api';

const message = {
  name: 'Casey Developer',
  email: 'casey@example.com',
  subject: 'A thoughtful opportunity',
  message: 'I would like to talk about a project.',
  website: '',
};

afterEach(() => vi.unstubAllGlobals());

it('posts the mapped payload and preserves the honeypot', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response('{"message":"Accepted."}', { status: 202 }));
  vi.stubGlobal('fetch', fetchMock);
  await sendContactMessage({ ...message, website: 'honeypot-value' });
  expect(fetchMock.mock.calls[0][0]).toBe('https://joefolio-backend.onrender.com/api/v1/contact');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    name: message.name,
    email: message.email,
    subject: message.subject,
    body: message.message,
    website: 'honeypot-value',
  });
});

it.each([null, {}, { message: '' }, { message: '   ' }, { message: 42 }])(
  'rejects HTTP 202 when the response message is invalid',
  async (data) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 202 })),
    );
    await expect(sendContactMessage(message)).rejects.toThrow('unexpected response');
  },
);
