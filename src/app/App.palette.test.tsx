import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';

const palette = vi.hoisted(() => ({ loaded: vi.fn() }));
vi.mock('../features/command-palette/components/CommandPalette', () => {
  palette.loaded();
  return {
    default: ({ onClose }: { onClose: () => void }) => (
      <div role="dialog" aria-label="Test search">
        <button onClick={onClose}>Close test search</button>
      </div>
    ),
  };
});
vi.mock('./hooks/useBackendHealth', () => ({ useBackendHealth: () => 'UP' }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  history.replaceState(null, '', '/');
});

it('lazy-loads Search on intent, ignores editable shortcuts, and opens from click or Ctrl/Cmd+K', async () => {
  render(<App />);
  expect(palette.loaded).not.toHaveBeenCalled();

  const field = screen.getByLabelText(/^Name/);
  field.focus();
  fireEvent.keyDown(field, { key: 'k', ctrlKey: true });
  expect(palette.loaded).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();

  const search = screen.getByRole('button', { name: 'Search' });
  fireEvent.mouseEnter(search);
  await waitFor(() => expect(palette.loaded).toHaveBeenCalledOnce());
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(search);
  expect(await screen.findByRole('dialog', { name: 'Test search' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close test search' }));
  expect(screen.queryByRole('dialog')).toBeNull();

  fireEvent.keyDown(document, { key: 'K', metaKey: true });
  expect(await screen.findByRole('dialog', { name: 'Test search' })).toBeTruthy();
});
