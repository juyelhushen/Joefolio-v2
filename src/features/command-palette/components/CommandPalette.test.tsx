import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CommandPalette from './CommandPalette';
import { projects } from '../../projects/data/projects';
import { PROFILE_LINKS, RESUME_FILENAME, RESUME_PATH } from '../../../lib/profile';

beforeEach(() => {
  vi.stubGlobal('__HAS_RESUME__', false);
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});
afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-palette-opener]').forEach((element) => element.remove());
  history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

function show() {
  const opener = document.createElement('button');
  opener.dataset.paletteOpener = '';
  document.body.append(opener);
  opener.focus();
  const onClose = vi.fn();
  const onNavigate = vi.fn();
  const view = render(
    <CommandPalette
      opener={opener}
      onClose={onClose}
      onNavigate={onNavigate}
      reduceMotion={false}
    />,
  );
  return { ...view, opener, onClose, onNavigate };
}

it('focuses the combobox, locks scroll and restores opener focus and scroll on unmount', () => {
  const original = document.body.style.overflow;
  const view = show();
  const input = screen.getByRole('combobox');
  expect(document.activeElement).toBe(input);
  expect(input.getAttribute('aria-expanded')).toBe('true');
  expect(input.getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(view.onClose).toHaveBeenCalledOnce();
  view.unmount();
  expect(document.activeElement).toBe(view.opener);
  expect(document.body.style.overflow).toBe(original);
  view.opener.remove();
});

it('supports arrows, Home, End and Enter without moving focus out of the input', () => {
  const view = show();
  const input = screen.getByRole('combobox');
  const options = screen.getAllByRole('option');
  fireEvent.keyDown(input, { key: 'End' });
  expect(input.getAttribute('aria-activedescendant')).toBe(options.at(-1)?.id);
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input.getAttribute('aria-activedescendant')).toBe(options.at(-1)?.id);
  fireEvent.keyDown(input, { key: 'Home' });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(view.onNavigate).toHaveBeenCalledWith('about');
  expect(location.hash).toBe('#about');
  expect(document.activeElement).toBe(input);
});

it('filters, announces counts and handles No matches without a stale active descendant', () => {
  show();
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'sentinel' } });
  expect(screen.getAllByRole('option')).toHaveLength(1);
  expect(screen.getByRole('status').textContent).toBe('1 result');
  fireEvent.change(input, { target: { value: 'no-such-result' } });
  expect(screen.getByText('No matches')).toBeTruthy();
  expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  fireEvent.keyDown(input, { key: 'End' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(screen.queryAllByRole('option')).toHaveLength(0);
  fireEvent.change(input, { target: { value: '' } });
  expect(screen.getByRole('status').textContent).toMatch(/results/);
});

it('opens a project through the existing case-study hash and navigation handler', () => {
  const { onNavigate, onClose } = show();
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: projects[0].name } });
  const changed = vi.fn();
  window.addEventListener('hashchange', changed);
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(location.hash).toBe(`#projects/${projects[0].id}`);
  expect(onNavigate).toHaveBeenCalledWith('projects');
  expect(onClose).toHaveBeenCalledOnce();
  expect(changed).toHaveBeenCalled();
  window.removeEventListener('hashchange', changed);
});

it('uses safe external links and omits the resume action when the build flag is false', () => {
  show();
  expect(screen.queryByRole('option', { name: 'Download résumé' })).toBeNull();
  for (const href of Object.values(PROFILE_LINKS)) {
    const link = document.querySelector(`a[href="${href}"]`);
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  }
});

it('includes the real resume download only when the build flag is true', () => {
  vi.stubGlobal('__HAS_RESUME__', true);
  show();
  const resume = screen.getByRole('option', { name: 'Download résumé' });
  expect(resume.getAttribute('href')).toBe(RESUME_PATH);
  expect(resume.getAttribute('download')).toBe(RESUME_FILENAME);
});

it('has no copy-email or manual effects commands', () => {
  show();
  expect(screen.queryByRole('option', { name: /Copy email/i })).toBeNull();
  expect(screen.queryByRole('option', { name: /Reduce effects/i })).toBeNull();
  for (const value of ['copy email', 'reduce effects']) {
    fireEvent.change(screen.getByRole('combobox'), { target: { value } });
    expect(screen.getByText('No matches')).toBeTruthy();
  }
});

it('closes on backdrop/native cancel but not panel content, and supports system reduced motion', () => {
  const { onClose, rerender } = show();
  fireEvent.click(screen.getByRole('heading', { name: 'Search portfolio' }));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('dialog'));
  expect(onClose).toHaveBeenCalledOnce();
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(onClose).toHaveBeenCalledTimes(2);
  rerender(<CommandPalette opener={null} onClose={onClose} onNavigate={vi.fn()} reduceMotion />);
  expect(screen.getByRole('dialog').getAttribute('data-reduced')).toBe('true');
});
