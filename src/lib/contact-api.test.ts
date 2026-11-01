import { AxiosHeaders, type AxiosAdapter } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from './api/client';
import { sendContactMessage } from './contact-api';

const originalAdapter = apiClient.defaults.adapter;
const message = {
  name: 'Casey Developer',
  email: 'casey@example.com',
  subject: 'A thoughtful opportunity',
  message: 'I would like to talk about a project.',
  website: '',
};

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

it('posts the exact mapped payload to Render and forwards the honeypot unchanged', async () => {
  const adapter = vi.fn<AxiosAdapter>(async (config) => ({
    config,
    headers: new AxiosHeaders(),
    status: 202,
    statusText: 'Accepted',
    data: { message: 'Your message has been sent.' },
  }));
  apiClient.defaults.adapter = adapter;

  await sendContactMessage({ ...message, website: 'honeypot-value' });
  const config = adapter.mock.calls[0][0];
  expect(config.method).toBe('post');
  expect(apiClient.getUri(config)).toBe('https://joefolio-backend.onrender.com/api/v1/contact');
  expect(JSON.parse(config.data)).toEqual({
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
    apiClient.defaults.adapter = async (config) => ({
      config,
      headers: new AxiosHeaders(),
      status: 202,
      statusText: 'Accepted',
      data,
    });

    await expect(sendContactMessage(message)).rejects.toThrow('unexpected response');
  },
);
