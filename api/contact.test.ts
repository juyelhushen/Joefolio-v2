import { expect, it, vi } from 'vitest';
import type { IncomingMessage } from 'node:http';
import type { ContactRequest, ContactResponse } from './contact';
import { createContactHandler } from './contact';

const allowedOrigin = 'http://localhost:5173';
const validMessage = {
  name: 'Casey Developer',
  email: 'casey@example.com',
  subject: 'A thoughtful opportunity',
  message: 'I would like to talk about a project.',
  website: '',
};
const validEnvironment = {
  RESEND_API_KEY: 'test-key',
  CONTACT_TO_EMAIL: 'inbox@example.test',
  CONTACT_FROM_EMAIL: 'Portfolio <contact@example.test>',
  CONTACT_ALLOWED_ORIGINS: allowedOrigin,
};

function request(
  body: unknown = validMessage,
  overrides: Partial<ContactRequest> = {},
): ContactRequest {
  return {
    method: 'POST',
    headers: {
      origin: allowedOrigin,
      'content-type': 'application/json',
      'x-forwarded-for': '198.51.100.10',
    },
    body,
    socket: { remoteAddress: '198.51.100.10' } as IncomingMessage['socket'],
    ...overrides,
  } as ContactRequest;
}

function response() {
  const result = {
    statusCode: 0,
    body: undefined as object | undefined,
    headers: {} as Record<string, string | number | readonly string[]>,
    setHeader(name: string, value: string | number | readonly string[]) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: object) {
      this.body = body;
      return this;
    },
  };
  return { value: result, response: result as unknown as ContactResponse };
}

function createTestHandler(
  options: {
    environment?: Record<string, string | undefined>;
    sendEmail?: Parameters<typeof createContactHandler>[0]['sendEmail'];
    now?: () => number;
    rateLimitStore?: Map<string, { count: number; expiresAt: number }>;
  } = {},
) {
  const sendEmail = options.sendEmail ?? (async () => ({ accepted: true }));
  return createContactHandler({
    getEnvironment: () => options.environment ?? validEnvironment,
    sendEmail,
    now: options.now,
    rateLimitStore: options.rateLimitStore,
  });
}

async function invoke(
  handler: ReturnType<typeof createTestHandler>,
  input: ContactRequest = request(),
) {
  const mock = response();
  await handler(input, mock.response);
  return mock.value;
}

it('sends valid messages using the configured sender and visitor reply-to', async () => {
  const deliveries: Array<Parameters<Parameters<typeof createContactHandler>[0]['sendEmail']>[1]> =
    [];
  const handler = createTestHandler({
    sendEmail: async (apiKey, email) => {
      expect(apiKey).toBe('test-key');
      deliveries.push(email);
      return { accepted: true };
    },
  });
  const result = await invoke(handler);

  expect(result.statusCode).toBe(200);
  expect(result.body).toEqual({ accepted: true });
  expect(deliveries).toHaveLength(1);
  expect(deliveries[0]).toEqual({
    from: 'Portfolio <contact@example.test>',
    to: 'inbox@example.test',
    replyTo: 'casey@example.com',
    subject: 'Portfolio contact: A thoughtful opportunity',
    text: expect.stringContaining('I would like to talk about a project.'),
  });
  expect(deliveries[0].text).toContain('Name: Casey Developer');
  expect(result.headers['access-control-allow-origin']).toBe(allowedOrigin);
});

it('returns unavailable when any required server configuration is missing', async () => {
  const sendEmail = vi.fn(async () => ({ accepted: true }));
  const handler = createTestHandler({
    environment: { ...validEnvironment, RESEND_API_KEY: '' },
    sendEmail,
  });

  const result = await invoke(handler);
  expect(result.statusCode).toBe(503);
  expect(result.body).toEqual({ error: 'The email service is unavailable.' });
  expect(sendEmail).not.toHaveBeenCalled();
});

it('rejects non-POST, invalid, oversized, and disallowed-origin requests', async () => {
  const sendEmail = vi.fn(async () => ({ accepted: true }));
  const handler = createTestHandler({ sendEmail });

  expect((await invoke(handler, request(validMessage, { method: 'GET' }))).statusCode).toBe(405);
  expect(
    (await invoke(handler, request({ ...validMessage, email: 'not-an-email' }))).statusCode,
  ).toBe(400);
  expect(
    (
      await invoke(
        handler,
        request(validMessage, {
          headers: {
            origin: allowedOrigin,
            'content-type': 'application/json',
            'content-length': '20000',
          },
        }),
      )
    ).statusCode,
  ).toBe(413);
  expect(
    (
      await invoke(
        handler,
        request(validMessage, {
          headers: {
            origin: 'https://untrusted.example',
            'content-type': 'application/json',
          },
        }),
      )
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await invoke(
        handler,
        request(validMessage, {
          headers: { origin: allowedOrigin, 'content-type': 'text/plain' },
        }),
      )
    ).statusCode,
  ).toBe(415);
  expect(sendEmail).not.toHaveBeenCalled();
});

it('rejects honeypot submissions without sending an email', async () => {
  const sendEmail = vi.fn(async () => ({ accepted: true }));
  const handler = createTestHandler({ sendEmail });

  const result = await invoke(handler, request({ ...validMessage, website: 'spam' }));
  expect(result.statusCode).toBe(400);
  expect(sendEmail).not.toHaveBeenCalled();
});

it('applies bounded per-address throttling and expires the window', async () => {
  let now = 1000;
  const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();
  const sendEmail = vi.fn(async () => ({ accepted: true }));
  const handler = createTestHandler({ sendEmail, now: () => now, rateLimitStore });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    expect((await invoke(handler)).statusCode).toBe(200);
  }
  expect((await invoke(handler)).statusCode).toBe(429);
  now += 10 * 60 * 1000 + 1;
  expect((await invoke(handler)).statusCode).toBe(200);
  expect(sendEmail).toHaveBeenCalledTimes(6);
});

it('returns a safe provider error and never presents failed delivery as accepted', async () => {
  const handler = createTestHandler({
    sendEmail: async () => ({
      accepted: false,
      error: new Error('private provider detail'),
    }),
  });

  const result = await invoke(handler);
  expect(result.statusCode).toBe(502);
  expect(result.body).toEqual({
    error: 'The message could not be sent. Please try again.',
  });
});
