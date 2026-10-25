import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { Resend } from 'resend';

export type ContactRequest = IncomingMessage & { body?: unknown };
export type ContactResponse = {
  setHeader: (name: string, value: string | number | readonly string[]) => unknown;
  status: (code: number) => ContactResponse;
  json: (body: object) => ContactResponse;
};

const MAX_BODY_BYTES = 16_384;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_KEYS = 10_000;
const PROVIDER_TIMEOUT_MS = 8_000;

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
};

type ContactEmail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
};

type Environment = Record<string, string | undefined>;

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

type ContactHandlerDependencies = {
  getEnvironment: () => Environment;
  sendEmail: (
    apiKey: string,
    email: ContactEmail,
  ) => Promise<{ accepted: boolean; error?: unknown }>;
  now?: () => number;
  rateLimitStore?: Map<string, RateLimitEntry>;
};

function respond(response: ContactResponse, status: number, body: object) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(status).json(body);
}

function header(request: ContactRequest, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function configuredOrigins(value: string | undefined): Set<string> | null {
  if (!value?.trim()) return null;

  try {
    const origins = value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => {
        const parsed = new URL(origin);
        if (
          !['http:', 'https:'].includes(parsed.protocol) ||
          parsed.origin !== origin.replace(/\/+$/, '') ||
          parsed.username ||
          parsed.password
        ) {
          throw new Error('Invalid origin');
        }
        return parsed.origin;
      });
    return origins.length > 0 ? new Set(origins) : null;
  } catch {
    return null;
  }
}

function getClientKey(request: ContactRequest): string {
  const address =
    header(request, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    request.socket.remoteAddress ||
    'unknown';
  return createHash('sha256').update(address).digest('hex');
}

function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

function isRateLimited(key: string, store: Map<string, RateLimitEntry>, now: number): boolean {
  for (const [storedKey, entry] of store) {
    if (entry.expiresAt <= now) store.delete(storedKey);
  }

  let entry = store.get(key);
  if (!entry || entry.expiresAt <= now) {
    if (store.size >= RATE_LIMIT_KEYS) {
      const oldestKey = store.keys().next().value;
      if (oldestKey) store.delete(oldestKey);
    }
    entry = { count: 0, expiresAt: now + RATE_LIMIT_WINDOW_MS };
    store.set(key, entry);
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_REQUESTS;
}

function validatePayload(value: unknown): { payload?: ContactPayload; error?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: 'Enter a valid contact message.' };
  }

  const input = value as Record<string, unknown>;
  const limits = { name: 100, email: 254, subject: 120, message: 4000, website: 200 } as const;
  for (const [field, maximum] of Object.entries(limits)) {
    const fieldValue = input[field];
    if (fieldValue === undefined && field === 'website') continue;
    if (
      typeof fieldValue !== 'string' ||
      fieldValue.length > maximum ||
      (field !== 'website' && !fieldValue.trim())
    ) {
      return { error: 'Check the contact fields and try again.' };
    }
  }

  const name = (input.name as string).trim();
  const email = (input.email as string).trim();
  const subject = (input.subject as string).trim();
  const message = (input.message as string).trim();
  const website = typeof input.website === 'string' ? input.website.trim() : '';
  if (
    hasControlCharacters(name) ||
    hasControlCharacters(subject) ||
    hasControlCharacters(email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: 'Check the contact fields and try again.' };
  }

  return { payload: { name, email, subject, message, website } };
}

export function createContactHandler({
  getEnvironment,
  sendEmail,
  now = Date.now,
  rateLimitStore = new Map(),
}: ContactHandlerDependencies) {
  return async function contactHandler(request: ContactRequest, response: ContactResponse) {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return respond(response, 405, { error: 'Method not allowed.' });
    }

    const env = getEnvironment();
    const apiKey = env.RESEND_API_KEY?.trim();
    const recipient = env.CONTACT_TO_EMAIL?.trim();
    const sender = env.CONTACT_FROM_EMAIL?.trim();
    const origins = configuredOrigins(env.CONTACT_ALLOWED_ORIGINS);
    if (!apiKey || !recipient || !sender || !origins) {
      return respond(response, 503, { error: 'The email service is unavailable.' });
    }

    const origin = header(request, 'origin');
    if (!origin || !origins.has(origin)) {
      return respond(response, 403, { error: 'This request origin is not allowed.' });
    }
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');

    const contentType =
      header(request, 'content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
    if (contentType !== 'application/json') {
      return respond(response, 415, { error: 'A JSON request body is required.' });
    }

    const declaredLength = Number(header(request, 'content-length') ?? 0);
    let bodySize: number;
    try {
      bodySize = new TextEncoder().encode(
        typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {}),
      ).byteLength;
    } catch {
      return respond(response, 400, { error: 'Enter a valid contact message.' });
    }
    if ((declaredLength > 0 && declaredLength > MAX_BODY_BYTES) || bodySize > MAX_BODY_BYTES) {
      return respond(response, 413, { error: 'The contact message is too large.' });
    }

    let body: unknown = request.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return respond(response, 400, { error: 'Enter a valid contact message.' });
      }
    }
    const validated = validatePayload(body);
    if (!validated.payload) {
      return respond(response, 400, { error: validated.error });
    }
    if (validated.payload.website) {
      return respond(response, 400, { error: 'Unable to accept this message.' });
    }

    if (isRateLimited(getClientKey(request), rateLimitStore, now())) {
      return respond(response, 429, { error: 'Please wait before sending another message.' });
    }

    try {
      const result = await sendEmail(apiKey, {
        from: sender,
        to: recipient,
        replyTo: validated.payload.email,
        subject: `Portfolio contact: ${validated.payload.subject}`,
        text: [
          `Name: ${validated.payload.name}`,
          `Email: ${validated.payload.email}`,
          `Subject: ${validated.payload.subject}`,
          '',
          validated.payload.message,
        ].join('\n'),
      });
      if (result.error || !result.accepted) {
        return respond(response, 502, {
          error: 'The message could not be sent. Please try again.',
        });
      }
      return respond(response, 200, { accepted: true });
    } catch {
      return respond(response, 502, { error: 'The message could not be sent. Please try again.' });
    }
  };
}

const handleContact = createContactHandler({
  getEnvironment: () => process.env,
  sendEmail: async (apiKey, email) => {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(email, {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    return { accepted: Boolean(data?.id), error };
  },
});

export const config = {
  api: {
    bodyParser: { sizeLimit: '16kb' },
  },
};

export default handleContact;
