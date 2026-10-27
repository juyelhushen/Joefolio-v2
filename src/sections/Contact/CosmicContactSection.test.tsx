import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CosmicContactSection from './CosmicContactSection';

vi.mock('../../components/EarthGlobe', () => ({
  default: () => <div data-testid="earth-webgl-scene" />,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<CosmicContactSection reduceMotion />);

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(screen.getAllByRole('alert')[0].textContent).toBe('This field is required.');
  expect(document.activeElement).toBe(screen.getByLabelText(/^Name/));
  expect(fetchMock).not.toHaveBeenCalled();

  fillForm();
  fireEvent.change(screen.getByLabelText(/^Email/), {
    target: { value: 'not-an-email' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByLabelText(/^Email/));
  expect(fetchMock).not.toHaveBeenCalled();
});

it('sends the expected payload and reports success only after server acceptance', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ accepted: true }),
  });
  vi.stubGlobal('fetch', fetchMock);
  render(<CosmicContactSection reduceMotion />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  expect(await screen.findByText(/Message launched successfully/)).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/contact',
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Casey Developer',
        email: 'casey@example.com',
        subject: 'A thoughtful opportunity',
        message: 'I would like to talk about a project.',
        website: '',
      }),
    }),
  );
  expect(document.querySelector('.contact-envelope-flight')).toBeNull();
  expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('');
});

it('preserves entered values and offers retry after network delivery fails', async () => {
  const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'));
  vi.stubGlobal('fetch', fetchMock);
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

it('blocks duplicate sends while the server request is pending', async () => {
  let resolveRequest:
    ((response: { ok: boolean; json: () => Promise<{ accepted: boolean }> }) => void) | undefined;
  const fetchMock = vi.fn(
    () =>
      new Promise<{ ok: boolean; json: () => Promise<{ accepted: boolean }> }>((resolve) => {
        resolveRequest = resolve;
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  render(<CosmicContactSection reduceMotion />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Launch message' }));
  const pendingButton = screen.getByRole('button', { name: 'Sending…' });
  expect(pendingButton.hasAttribute('disabled')).toBe(true);
  expect(document.querySelector('.contact-button-envelope.is-sealed')).toBeTruthy();
  fireEvent.click(pendingButton);
  expect(fetchMock).toHaveBeenCalledTimes(1);

  resolveRequest?.({ ok: true, json: async () => ({ accepted: true }) });
  await waitFor(() => expect(screen.getByText(/Message launched successfully/)).toBeTruthy());
});

it('keeps character limits, accessible labels, and the honeypot out of keyboard navigation', () => {
  render(<CosmicContactSection reduceMotion />);

  expect((screen.getByLabelText(/^Subject/) as HTMLInputElement).maxLength).toBe(120);
  expect((screen.getByLabelText(/^Message/) as HTMLTextAreaElement).maxLength).toBe(4000);
  const honeypot = document.getElementById('contact-website');
  expect(honeypot?.getAttribute('tabindex')).toBe('-1');
  expect(honeypot?.parentElement?.getAttribute('aria-hidden')).toBe('true');
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
