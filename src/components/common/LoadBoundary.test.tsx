import { lazy, Suspense } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import LoadBoundary from './LoadBoundary';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('isolates a rejected lazy import, logs it and retains the surrounding shell', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const onError = vi.fn();
  const Broken = lazy(() => Promise.reject(new Error('Chunk unavailable')));
  render(
    <main>
      <h1>Portfolio</h1>
      <LoadBoundary
        label="Projects"
        onError={onError}
        fallback={<p role="alert">Reload Projects</p>}
      >
        <Suspense fallback={<p>Loading Projects</p>}>
          <Broken />
        </Suspense>
      </LoadBoundary>
    </main>,
  );
  expect((await screen.findByRole('alert')).textContent).toBe('Reload Projects');
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Portfolio');
  expect(onError).toHaveBeenCalledOnce();
  expect(log).toHaveBeenCalledWith(
    'Could not load Projects.',
    expect.any(Error),
    expect.any(String),
  );
});
