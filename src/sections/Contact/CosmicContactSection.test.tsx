import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../lib/api/client';
import CosmicContactSection from './CosmicContactSection';

vi.mock('../../components/EarthGlobe', () => ({
  default: () => <div data-testid="earth-webgl-scene" />,
}));

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  cleanup();
  apiClient.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
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

function installNetworkFailureAdapter() {
  apiClient.defaults.adapter = (async () => {
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK);
  }) satisfies AxiosAdapter;
}

function fillForm() {
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Casey Developer' } });
  fireEvent.change(screen.getByLabelText(/^Email/), {
    target: { value: 'casey@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/^Subject/), {
    target: { value: 'A thoughtful opportunity' },
  });
  fireEvent.change(screen.getByLabelText(/^Message/), {
    target: { value: 'I would like to talk about a project.' },
  });
}

it('validates required fields and native email syntax accessibly before sending', () => {
  const requests = installResponseAdapter(202, { message: 'Your message has been sent.' });
  render(<CosmicContactSection reduceMotion />);

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(screen.getAllByRole('alert')[0].textContent).toBe('This field is required.');
  expect(document.activeElement).toBe(screen.getByLabelText(/^Name/));
  expect(requests).toHaveLength(0);

  fillForm();
  fireEvent.change(screen.getByLabelText(/^Email/), {
    target: { value: 'not-an-email' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByLabelText(/^Email/));
  expect(requests).toHaveLength(0);
});

it('maps the UI message to the backend body and resets only after HTTP 202 acceptance', async () => {
  const requests = installResponseAdapter(202, { message: 'Your message has been sent.' });
  render(<CosmicContactSection reduceMotion />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(await screen.findByText(/Message launched successfully/)).toBeTruthy();
  expect(requests).toEqual([
    {
      url: '/api/v1/contact',
      data: {
        name: 'Casey Developer',
        email: 'casey@example.com',
        subject: 'A thoughtful opportunity',
        body: 'I would like to talk about a project.',
        website: '',
      },
    },
  ]);
  expect(document.querySelector('.contact-envelope-flight')).toBeNull();
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('');
});

it('does not treat a non-202 response as an accepted message', async () => {
  installResponseAdapter(200, { message: 'A response body alone is not acceptance.' });
  render(<CosmicContactSection reduceMotion />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(await screen.findByText(/returned an unexpected response/)).toBeTruthy();
  expect(screen.queryByText(/Message launched successfully/)).toBeNull();
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('Casey Developer');
  expect(document.querySelector('.contact-envelope-flight')).toBeNull();
});

it('shows a useful backend rate-limit message and keeps values after HTTP 429', async () => {
  installResponseAdapter(429, {
    detail: 'Too many contact requests. Please wait ten minutes before retrying.',
    status: 429,
    title: 'Too Many Requests',
  });
  render(<CosmicContactSection reduceMotion />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(
    await screen.findByText(
      /Too many contact requests\. Please wait ten minutes before retrying\./,
    ),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retry message' })).toBeTruthy();
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('Casey Developer');
  expect(document.querySelector('.contact-envelope-flight')).toBeNull();
});

it('uses safe validation and unavailable-service errors for HTTP 400 and 503', async () => {
  installResponseAdapter(400, { detail: 'The subject is required.', status: 400 });
  render(<CosmicContactSection reduceMotion />);
  fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(await screen.findByText(/The subject is required\./)).toBeTruthy();
  expect(document.querySelector('.contact-envelope-flight')).toBeNull();

  cleanup();
  apiClient.defaults.adapter = originalAdapter;
  installResponseAdapter(503, {
    detail: 'Internal stack trace: private provider secret',
    status: 503,
  });
  render(<CosmicContactSection reduceMotion />);
  fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(await screen.findByText(/The contact service is temporarily unavailable/)).toBeTruthy();
  expect(screen.queryByText(/private provider secret/)).toBeNull();
  expect(document.querySelector('.contact-envelope-flight')).toBeNull();
});

it('preserves entered values and offers retry after a network failure', async () => {
  installNetworkFailureAdapter();
  render(<CosmicContactSection reduceMotion={false} />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retry message' })).toBeTruthy();
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('Casey Developer');
  expect((screen.getByLabelText(/^Message/) as HTMLTextAreaElement).value).toContain(
    'talk about a project',
  );
  expect(document.querySelector('.contact-envelope-flight')).toBeNull();
  expect(screen.queryByText(/Message launched successfully/)).toBeNull();
});

it('blocks duplicate sends while the Axios request is pending', async () => {
  let resolveResponse: (() => void) | undefined;
  let requestCount = 0;
  apiClient.defaults.adapter = ((config) =>
    new Promise<AxiosResponse<unknown>>((resolve) => {
      requestCount += 1;
      resolveResponse = () =>
        resolve({
          data: { message: 'Your message has been sent.' },
          status: 202,
          statusText: 'Accepted',
          headers: new AxiosHeaders(),
          config,
        });
    })) satisfies AxiosAdapter;
  render(<CosmicContactSection reduceMotion />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  const pendingButton = screen.getByRole('button', { name: 'Sending…' });
  expect(pendingButton.hasAttribute('disabled')).toBe(true);
  expect(document.querySelector('.contact-button-envelope.is-sealed')).toBeTruthy();
  fireEvent.click(pendingButton);
  expect(requestCount).toBe(1);
  expect(resolveResponse).toBeTypeOf('function');
  resolveResponse?.();
  await waitFor(() => expect(screen.getByText(/Message launched successfully/)).toBeTruthy());
});

it('keeps character limits, accessible labels, and the honeypot out of keyboard navigation', () => {
  render(<CosmicContactSection reduceMotion />);

  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).maxLength).toBe(80);
  expect((screen.getByLabelText(/^Email/) as HTMLInputElement).maxLength).toBe(254);
  expect((screen.getByLabelText(/^Subject/) as HTMLInputElement).maxLength).toBe(120);
  expect((screen.getByLabelText(/^Message/) as HTMLTextAreaElement).maxLength).toBe(4000);
  const honeypot = document.getElementById('contact-website');
  expect(honeypot?.getAttribute('tabindex')).toBe('-1');
  expect(honeypot?.parentElement?.getAttribute('aria-hidden')).toBe('true');
});

it('starts envelope flight only after acceptance and resets after the animation', async () => {
  installResponseAdapter(202, { message: 'Your message has been sent.' });
  const { container } = render(<CosmicContactSection reduceMotion={false} />);
  fillForm();

  const rect = {
    top: 0,
    bottom: 100,
    left: 0,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
  for (const element of [
    container.querySelector('.contact-layout'),
    screen.getByRole('button', { name: 'Launch message' }),
    container.querySelector('.contact-earth-target'),
  ]) {
    if (element) vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
  }

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(await screen.findByText(/The contact service accepted your message/)).toBeTruthy();
  expect(document.querySelector('.contact-envelope-flight')).toBeTruthy();
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('Casey Developer');
  expect(
    await screen.findByText(/Message launched successfully/, {}, { timeout: 5000 }),
  ).toBeTruthy();
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('');
});

it('defers the Earth texture and scene until the Earth is near the viewport', async () => {
  const observers = new Map<Element, IntersectionObserverCallback>();
  class TestIntersectionObserver {
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      observers.set(target, this.callback);
    }
    disconnect() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    readonly root = null;
    readonly rootMargin = '0px';
    readonly scrollMargin = '0px';
    readonly thresholds = [0];
  }
  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);

  const { container } = render(<CosmicContactSection reduceMotion />);
  expect(screen.getByRole('img', { name: 'Rotating Earth, the message destination' })).toBeTruthy();
  const target = container.querySelector('.contact-earth-target');
  const fallback = target?.querySelector<HTMLElement>('.earth-fallback');
  expect(fallback).toBeTruthy();
  expect(fallback?.style.getPropertyValue('--earth-texture')).toBe('');
  expect(screen.queryByTestId('earth-webgl-scene')).toBeNull();

  observers.get(target as Element)?.(
    [
      {
        target: target as Element,
        isIntersecting: true,
      } as IntersectionObserverEntry,
    ],
    {} as IntersectionObserver,
  );

  await waitFor(() => {
    expect(fallback?.getAttribute('style')).toContain('earth-blue-marble.jpg');
    expect(screen.getByTestId('earth-webgl-scene')).toBeTruthy();
  });
});
