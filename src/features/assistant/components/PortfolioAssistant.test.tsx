import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import PortfolioAssistant from './PortfolioAssistant';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Widget({ apiBaseUrl = '' }: { apiBaseUrl?: string }) {
  const [opener, setOpener] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <button type="button" onClick={(event) => setOpener(event.currentTarget)}>
        Open assistant
      </button>
      {opener && (
        <PortfolioAssistant
          apiBaseUrl={apiBaseUrl}
          opener={opener}
          onClose={() => setOpener(null)}
        />
      )}
    </>
  );
}

it('opens an unavailable panel, closes with Escape, and restores focus', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<Widget />);
  const opener = screen.getByRole('button', { name: 'Open assistant' });
  fireEvent.click(opener);
  expect(screen.getByRole('region', { name: 'Portfolio assistant' }).textContent).toContain(
    'A backend service must be configured',
  );
  expect(screen.getByRole('textbox').hasAttribute('disabled')).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() =>
    expect(screen.queryByRole('region', { name: 'Portfolio assistant' })).toBeNull(),
  );
  expect(document.activeElement).toBe(opener);
});

it('sends a message and renders a safe citation without interpreting HTML', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        conversationId: 'conversation-1',
        answer: '<img src=x onerror=alert(1)>',
        citations: [{ title: 'Project', url: 'https://example.test/project' }],
      }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  render(<Widget apiBaseUrl="https://assistant.example.test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open assistant' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Question  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  expect(document.querySelector('.assistant-message-assistant img')).toBeNull();
  expect(screen.getByRole('link', { name: 'Project' }).getAttribute('rel')).toBe(
    'noopener noreferrer',
  );
  expect(fetchMock.mock.calls[0][0]).toBe('https://assistant.example.test/api/chat');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ message: 'Question' });
});

it('shows HTTP and network errors without inventing an answer', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
  const view = render(<Widget apiBaseUrl="https://assistant.example.test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open assistant' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Could not reach');
  view.unmount();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('failure', { status: 503 })));
  render(<Widget apiBaseUrl="https://assistant.example.test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open assistant' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect((await screen.findByRole('alert')).textContent).toContain('error (503)');
});

it('prevents duplicate submissions and aborts when closed', async () => {
  let requestSignal: AbortSignal | undefined;
  const fetchMock = vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        requestSignal = init.signal ?? undefined;
        requestSignal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  render(<Widget apiBaseUrl="https://assistant.example.test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open assistant' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Close portfolio assistant' }));
  expect(requestSignal?.aborted).toBe(true);
});
