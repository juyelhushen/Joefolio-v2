import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import PortfolioAssistant from './PortfolioAssistant';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function openAssistant(apiBaseUrl = '') {
  render(<PortfolioAssistant apiBaseUrl={apiBaseUrl} />);
  const launcher = screen.getByRole('button', { name: 'Open portfolio assistant' });
  fireEvent.click(launcher);
  return { launcher, panel: screen.getByRole('region', { name: 'Portfolio assistant' }) };
}

it('stays unavailable and does not call fetch without a configured URL', () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const { panel } = openAssistant();

  expect(panel.textContent).toContain('A backend service must be configured');
  expect(
    screen.getByRole('textbox', { name: 'Ask about Juyel’s portfolio' }).hasAttribute('disabled'),
  ).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
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
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        conversationId: 'conversation-1',
        answer: 'The assistant documents PDF retrieval.',
        citations: [
          {
            title: 'Knowledge Assistant repository',
            url: 'https://github.com/juyelhushen/enterprise-knowledge-assistant',
          },
        ],
      }),
      { status: 200 },
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
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
  const [requestUrl, requestOptions] = fetchMock.mock.calls[0];
  expect(requestUrl instanceof URL ? requestUrl.href : requestUrl).toBe(
    'https://assistant.example.test/api/chat',
  );
  expect(requestOptions?.method).toBe('POST');
  expect(requestOptions?.body).toBe(JSON.stringify({ message: 'Which projects use RAG?' }));
});

it('renders response text without interpreting HTML', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          conversationId: 'conversation-1',
          answer: '<img src=x onerror=alert(1)>',
        }),
        { status: 200 },
      ),
    ),
  );
  openAssistant('https://assistant.example.test');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  expect(document.querySelector('.assistant-message-assistant img')).toBeNull();
});

it('reports network and HTTP failures without showing an assistant answer', async () => {
  const fetchMock = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('offline'));
  vi.stubGlobal('fetch', fetchMock);
  openAssistant('https://assistant.example.test');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect((await screen.findByRole('alert')).textContent).toContain('Could not reach the assistant');
  expect(document.querySelector('.assistant-message-assistant')).toBeNull();

  cleanup();
  fetchMock.mockResolvedValueOnce(new Response('failure', { status: 503 }));
  openAssistant('https://assistant.example.test');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Another question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect((await screen.findByRole('alert')).textContent).toContain('error (503)');
});

it('prevents duplicate submissions while the request is pending', async () => {
  let resolveRequest: ((response: Response) => void) | undefined;
  const fetchMock = vi.fn<typeof fetch>(
    () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  openAssistant('https://assistant.example.test');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(screen.getByRole('status').textContent).toContain('Waiting');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(true);

  resolveRequest?.(
    new Response(JSON.stringify({ conversationId: 'conversation-1', answer: 'A real response.' }), {
      status: 200,
    }),
  );
  await waitFor(() => expect(screen.getByText('A real response.')).toBeTruthy());
});

it('aborts a pending request when the widget unmounts', () => {
  let requestSignal: AbortSignal | null | undefined;
  const fetchMock = vi.fn<typeof fetch>((_input, init) => {
    requestSignal = init?.signal;
    return new Promise(() => {});
  });
  vi.stubGlobal('fetch', fetchMock);
  const view = render(<PortfolioAssistant apiBaseUrl="https://assistant.example.test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open portfolio assistant' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(requestSignal?.aborted).toBe(true);
});
