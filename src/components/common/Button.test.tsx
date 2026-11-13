import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Button from './Button';

afterEach(cleanup);

it('blocks repeat activation while loading and only confirms caller-reported success', () => {
  const action = vi.fn();
  const { rerender } = render(
    <Button state="loading" loadingLabel="Saving changes" onClick={action}>
      Save
    </Button>,
  );
  const pending = screen.getByRole('button', { name: 'Saving changes' });
  fireEvent.click(pending);
  expect(action).not.toHaveBeenCalled();
  expect(pending.getAttribute('aria-busy')).toBe('true');

  rerender(<Button onClick={action}>Save</Button>);
  expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(action).toHaveBeenCalledTimes(1);

  rerender(
    <Button state="success" successLabel="Changes saved">
      Save
    </Button>,
  );
  expect(screen.getByRole('button', { name: 'Changes saved' }).getAttribute('aria-busy')).not.toBe(
    'true',
  );
});

it('keeps icon-only controls labelled and externally disabled after loading ends', () => {
  const { rerender } = render(
    <Button iconOnly aria-label="Send message" state="loading" loadingLabel="Sending message">
      <svg aria-hidden="true" />
    </Button>,
  );
  const button = screen.getByRole('button', { name: 'Send message' });
  expect(button.hasAttribute('disabled')).toBe(true);
  rerender(
    <Button iconOnly aria-label="Send message" disabled>
      <svg aria-hidden="true" />
    </Button>,
  );
  expect(button.hasAttribute('disabled')).toBe(true);
  expect(button.getAttribute('aria-busy')).not.toBe('true');
});
