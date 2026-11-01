import { AxiosError, AxiosHeaders, CanceledError, type AxiosAdapter } from 'axios';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '../lib/api/client';
import PortfolioAssistant from './PortfolioAssistant';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  cleanup();
  apiClient.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
});

function respondWith(data: unknown, status = 200) {
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    const response = { config, data, status, statusText: '', headers: new AxiosHeaders() };
    if (status >= 400) {
      throw new AxiosError(
        'Request failed',
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

function openAssistant(apiBaseUrl = '') {
  render(<PortfolioAssistant apiBaseUrl={apiBaseUrl} />);
  const launcher = screen.getByRole('button', { name: 'Open portfolio assistant' });
  fireEvent.click(launcher);
  return { launcher, panel: screen.getByRole('region', { name: 'Portfolio assistant' }) };
}

it('stays unavailable and does not call the API without a configured URL', () => {
  const adapter = respondWith({});
  const { panel } = openAssistant();

  expect(panel.textContent).toContain('A backend service must be configured');
  expect(
    screen.getByRole('textbox', { name: 'Ask about Juyel’s portfolio' }).hasAttribute('disabled'),
  ).toBe(true);
  expect(adapter).not.toHaveBeenCalled();
});

it('keeps the floating launcher label and chat icon', () => {
  render(<PortfolioAssistant apiBaseUrl="" />);

  const launcher = screen.getByRole('button', { name: 'Open portfolio assistant' });
  expect(launcher.textContent).toContain('Ask about my work');
  expect(launcher.querySelector('svg')).toBeTruthy();
});

it('opens, closes with Escape, and restores focus to the launcher', () => {
  const { launcher } = openAssistant();

  expect(screen.getByRole('region', { name: 'Portfolio assistant' })).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('region', { name: 'Portfolio assistant' })).toBeNull();
  expect(document.activeElement).toBe(launcher);

  fireEvent.click(launcher);
  fireEvent.click(
    within(screen.getByRole('region', { name: 'Portfolio assistant' })).getByRole('button', {
      name: 'Close portfolio assistant',
    }),
  );
  expect(screen.queryByRole('region', { name: 'Portfolio assistant' })).toBeNull();
});

it('sends a valid message and displays the response and safe citation link', async () => {
  const adapter = respondWith({
    conversationId: 'conversation-1',
    answer: 'The assistant documents PDF retrieval.',
    citations: [
      {
        title: 'Knowledge Assistant repository',
        url: 'https://github.com/juyelhushen/enterprise-knowledge-assistant',
      },
    ],
  });
  openAssistant('https://assistant.example.test');

  const input = screen.getByRole('textbox', { name: 'Ask about Juyel’s portfolio' });
  fireEvent.change(input, { target: { value: '  Which projects use RAG?  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(await screen.findByText('The assistant documents PDF retrieval.')).toBeTruthy();
  const citation = screen.getByRole('link', { name: 'Knowledge Assistant repository' });
  expect(citation.getAttribute('href')).toBe(
    'https://github.com/juyelhushen/enterprise-knowledge-assistant',
  );
  expect(citation.getAttribute('rel')).toBe('noopener noreferrer');
  const config = adapter.mock.calls[0][0];
  expect(apiClient.getUri(config)).toBe('https://assistant.example.test/api/chat');
  expect(config.method).toBe('post');
  expect(JSON.parse(config.data)).toEqual({ message: 'Which projects use RAG?' });
});

it('renders response text without interpreting HTML', async () => {
  respondWith({
    conversationId: 'conversation-1',
    answer: '<img src=x onerror=alert(1)>',
  });
  openAssistant('https://assistant.example.test');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  expect(document.querySelector('.assistant-message-assistant img')).toBeNull();
});

it('reports network and HTTP failures without showing an assistant answer', async () => {
  apiClient.defaults.adapter = async () => {
    throw new AxiosError('offline', AxiosError.ERR_NETWORK);
  };
  openAssistant('https://assistant.example.test');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect((await screen.findByRole('alert')).textContent).toContain('Could not reach the assistant');
  expect(document.querySelector('.assistant-message-assistant')).toBeNull();

  cleanup();
  respondWith('failure', 503);
  openAssistant('https://assistant.example.test');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Another question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect((await screen.findByRole('alert')).textContent).toContain('error (503)');
});

it('prevents duplicate submissions while the request is pending', async () => {
  let resolveRequest: (() => void) | undefined;
  const adapter = vi.fn<AxiosAdapter>(
    (config) =>
      new Promise((resolve) => {
        resolveRequest = () =>
          resolve({
            config,
            status: 200,
            statusText: '',
            headers: new AxiosHeaders(),
            data: { conversationId: 'conversation-1', answer: 'A real response.' },
          });
      }),
  );
  apiClient.defaults.adapter = adapter;
  openAssistant('https://assistant.example.test');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(screen.getByRole('status').textContent).toContain('Waiting');
  expect(adapter).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(true);

  resolveRequest?.();
  await waitFor(() => expect(screen.getByText('A real response.')).toBeTruthy());
});

it('aborts a pending request when the widget unmounts', () => {
  const adapter = vi.fn<AxiosAdapter>((config) => {
    return new Promise((_, reject) => {
      config.signal?.addEventListener?.('abort', () => reject(new CanceledError('cancelled')));
    });
  });
  apiClient.defaults.adapter = adapter;
  const view = render(<PortfolioAssistant apiBaseUrl="https://assistant.example.test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open portfolio assistant' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(adapter).toHaveBeenCalledTimes(1);
  const requestSignal = adapter.mock.calls[0][0].signal;
  view.unmount();
  expect(requestSignal?.aborted).toBe(true);
});
