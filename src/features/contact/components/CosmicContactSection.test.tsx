import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api/client';
import CosmicContactSection from './CosmicContactSection';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  cleanup();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

function installResponseAdapter(status: number, data: unknown) {
  const requests: Array<{ url: string | undefined; data: unknown }> = [];
  apiClient.defaults.adapter = (async (config) => {
    requests.push({
      url: config.url,
      data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    });
    const response: AxiosResponse<unknown> = {
      data,
      status,
      statusText: '',
      headers: new AxiosHeaders(),
      config,
    };
    if (config.validateStatus?.(status) ?? (status >= 200 && status < 300)) return response;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response,
    );
  }) satisfies AxiosAdapter;
  return requests;
}

function fillForm() {
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Casey Developer' } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'casey@example.com' } });
  fireEvent.change(screen.getByLabelText(/^Subject/), { target: { value: 'A project' } });
  fireEvent.change(screen.getByLabelText(/^Message/), { target: { value: 'Let us talk.' } });
}

it('shows accessible required-field validation and focuses the first invalid field', () => {
  const requests = installResponseAdapter(202, { message: 'Accepted.' });
  render(<CosmicContactSection />);

  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(screen.getAllByRole('alert')[0].textContent).toBe('This field is required.');
  expect(document.activeElement).toBe(screen.getByLabelText(/^Name/));
  expect(requests).toHaveLength(0);
});

it('submits the existing backend payload and renders the success state', async () => {
  const requests = installResponseAdapter(202, { message: 'Your message has been sent.' });
  render(<CosmicContactSection />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(
    await screen.findByText('Your message was sent. Thank you for reaching out.'),
  ).toBeTruthy();
  expect(requests).toEqual([
    {
      url: '/api/v1/contact',
      data: {
        name: 'Casey Developer',
        email: 'casey@example.com',
        subject: 'A project',
        body: 'Let us talk.',
        website: '',
      },
    },
  ]);
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('');
});

it('keeps form values and shows an explicit error when the service fails', async () => {
  apiClient.defaults.adapter = (async () => {
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK);
  }) satisfies AxiosAdapter;
  render(<CosmicContactSection />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retry message' })).toBeTruthy();
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('Casey Developer');
  expect(screen.queryByText(/juyelhushen@gmail\.com/i)).toBeNull();
});

it('announces backend availability without disabling the form', () => {
  render(<CosmicContactSection backendStatus="UNAVAILABLE" />);
  expect(screen.getByRole('status').textContent).toContain('email link in the footer');
  expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(false);
});
