import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PUBLIC_EMAIL } from '../../lib/profile';
import EmailContact from './EmailContact';

afterEach(() => {
  cleanup();
  window.getSelection()?.removeAllRanges();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('renders the shared mailto destination without a copy button by default', () => {
  render(<EmailContact />);
  expect(screen.getByRole('link', { name: PUBLIC_EMAIL }).getAttribute('href')).toBe(
    `mailto:${PUBLIC_EMAIL}`,
  );
  expect(screen.queryByRole('button')).toBeNull();
});

it('copies the address, announces success politely and resets the label after two seconds', async () => {
  vi.useFakeTimers();
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  render(<EmailContact allowCopy />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy email' })));
  expect(writeText).toHaveBeenCalledWith(PUBLIC_EMAIL);
  expect(screen.getByRole('button', { name: 'Email copied' })).toBeTruthy();
  expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
  expect(screen.getByRole('status').textContent).toBe('Email copied');
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByRole('button', { name: 'Copy email' })).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe('');
});

it.each(['denied', 'unsupported'])(
  'selects the address for manual copying when %s',
  async (mode) => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    vi.stubGlobal('navigator', mode === 'denied' ? { clipboard: { writeText } } : {});
    render(<EmailContact allowCopy />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy email' })));
    expect(screen.getByRole('status').textContent).toBe('Copy failed, select the address instead');
    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeTruthy();
    expect(window.getSelection()?.toString()).toBe(PUBLIC_EMAIL);
    expect(document.activeElement).toBe(screen.getByRole('link', { name: PUBLIC_EMAIL }));
    expect(screen.getByText(/press Ctrl\+C.*Command\+C/)).toBeTruthy();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: 'Copy email' })).toBeTruthy();
    expect(screen.getByText(/press Ctrl\+C.*Command\+C/)).toBeTruthy();
  },
);

it('cleans up the reset timer when unmounted', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  const view = render(<EmailContact allowCopy />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy email' })));
  expect(vi.getTimerCount()).toBe(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('ignores duplicate pending copies and does not schedule feedback after unmount', async () => {
  vi.useFakeTimers();
  let finishCopy: (() => void) | undefined;
  const writeText = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finishCopy = resolve;
      }),
  );
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const view = render(<EmailContact allowCopy />);
  const button = screen.getByRole('button', { name: 'Copy email' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(writeText).toHaveBeenCalledTimes(1);
  view.unmount();
  await act(async () => finishCopy?.());
  expect(vi.getTimerCount()).toBe(0);
});
