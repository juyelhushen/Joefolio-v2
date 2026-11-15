import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CosmicContactSection from './CosmicContactSection';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function installResponseAdapter(status: number, data: unknown) {
  const requests: Array<{ url: string | undefined; data: unknown }> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, config: RequestInit) => {
      requests.push({
        url: new URL(url).pathname,
        data: typeof config.body === 'string' ? JSON.parse(config.body) : config.body,
      });
      return new Response(JSON.stringify(data), { status });
    }),
  );
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
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network Error')));
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
  expect(screen.getByRole('status').textContent).toContain('email link in the social links');
  expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(false);
});
