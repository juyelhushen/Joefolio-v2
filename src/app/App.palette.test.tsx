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
vi.mock('../components/background/Starfield/Starfield', () => ({ default: () => null }));
vi.mock('../components/background/CosmicMeshBackground/CosmicMeshBackground', () => ({
  default: () => null,
}));
vi.mock('../components/cursor/CosmicMagnifyingCursor', () => ({ default: () => null }));
vi.mock('../components/common/CosmicScrollProgress', () => ({ default: () => null }));
vi.mock('./hooks/useUniverseIntro', () => ({
  useUniverseIntro: () => ({ showUniverseIntro: false, completeUniverseIntro: vi.fn() }),
}));
vi.mock('./hooks/useBackendHealth', () => ({ useBackendHealth: () => 'UP' }));
vi.mock('../features/projects/components/ProjectsSection', () => ({
  default: () => (
    <section id="projects">
      <h2>Loaded project destination</h2>
    </section>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  history.replaceState(null, '', '/');
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

it('does not load search at startup, ignores editing shortcuts, prefetches on intent and opens on command', async () => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelIdleCallback', vi.fn());
  const { container } = render(<App />);
  expect(palette.loaded).not.toHaveBeenCalled();
  for (const tag of ['input', 'textarea', 'select', 'div']) {
    const field = document.createElement(tag);
    if (tag === 'div') Object.defineProperty(field, 'isContentEditable', { value: true });
    container.append(field);
    field.focus();
    fireEvent.keyDown(field, { key: 'k', ctrlKey: true });
    field.remove();
  }
  expect(palette.loaded).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
  const search = screen.getByRole('button', { name: 'Search portfolio' });
  fireEvent.mouseEnter(search);
  await waitFor(() => expect(palette.loaded).toHaveBeenCalledOnce());
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(search);
  expect(await screen.findByRole('dialog', { name: 'Test search' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close test search' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.keyDown(document, { key: 'K', metaKey: true });
  expect(await screen.findByRole('dialog', { name: 'Test search' })).toBeTruthy();
  expect(palette.loaded).toHaveBeenCalledOnce();
  expect(screen.queryByText('Loaded project destination')).toBeNull();
  history.pushState(null, '', '#projects/sentinel');
  fireEvent(window, new HashChangeEvent('hashchange'));
  expect(await screen.findByText('Loaded project destination')).toBeTruthy();
});
