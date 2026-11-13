import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

beforeEach(() => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: media === '(max-width: 1100px)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

it('opens a modal exploration list, locks scrolling and restores focus on Escape', () => {
  const { getByRole, queryByRole } = render(<Navbar activeSection="skills" onNavigate={vi.fn()} />);
  const toggle = getByRole('button', { name: 'Open menu' });
  const overflow = document.body.style.overflow;
  const gutter = document.documentElement.style.scrollbarGutter;
  fireEvent.click(toggle);
  const menu = getByRole('dialog', { name: 'Choose your orbit.' });
  expect(menu.hasAttribute('inert')).toBe(false);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(document.body.style.overflow).toBe('hidden');
  expect(document.activeElement).toBe(within(menu).getByRole('link', { name: 'Skills' }));
  expect(
    within(menu)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href')),
  ).toEqual(['#about', '#experience', '#skills', '#projects', '#ai-lab', '#contact', '#contact']);
  fireEvent.keyDown(menu, { key: 'Escape' });
  expect(menu.hasAttribute('inert')).toBe(true);
  expect(queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(document.body.style.overflow).toBe(overflow);
  expect(document.documentElement.style.scrollbarGutter).toBe(gutter);
});

it('closes on a destination, close control and backdrop without treating inner padding as backdrop', () => {
  const onNavigate = vi.fn();
  const { getByRole, queryByRole } = render(
    <Navbar activeSection="home" onNavigate={onNavigate} />,
  );
  const toggle = getByRole('button', { name: 'Open menu' });
  fireEvent.click(toggle);
  fireEvent.click(within(getByRole('dialog')).getByRole('link', { name: 'Projects' }));
  expect(onNavigate).toHaveBeenCalledWith('projects');
  expect(queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(toggle);
  fireEvent.click(toggle);
  fireEvent.click(getByRole('button', { name: 'Close menu' }));
  expect(queryByRole('dialog')).toBeNull();
  fireEvent.click(toggle);
  const menu = getByRole('dialog');
  vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 10, 300, 600));
  fireEvent.click(menu, { clientX: 20, clientY: 20 });
  expect(menu.hasAttribute('open')).toBe(true);
  fireEvent.click(menu, { clientX: 0, clientY: 0 });
  expect(queryByRole('dialog')).toBeNull();
});

it('hands search a visible opener after closing and unlocking the mobile dialog', () => {
  let opener: Element | null = null;
  const onSearch = vi.fn(() => {
    opener = document.activeElement;
  });
  const onSearchIntent = vi.fn();
  const { getByRole, queryByRole } = render(
    <Navbar
      activeSection="home"
      onNavigate={vi.fn()}
      onSearch={onSearch}
      onSearchIntent={onSearchIntent}
    />,
  );
  const toggle = getByRole('button', { name: 'Open menu' });
  fireEvent.click(toggle);
  const search = within(getByRole('dialog')).getByRole('button', {
    name: 'Search portfolio from menu',
  });
  fireEvent.focus(search);
  expect(onSearchIntent).toHaveBeenCalled();
  fireEvent.click(search);
  expect(onSearch).toHaveBeenCalledOnce();
  expect(opener).toBe(toggle);
  expect(queryByRole('dialog')).toBeNull();
  expect(document.body.style.overflow).not.toBe('hidden');
  fireEvent.click(toggle);
  fireEvent.keyDown(getByRole('dialog'), { key: 'k', ctrlKey: true });
  expect(onSearch).toHaveBeenCalledTimes(2);
  expect(opener).toBe(toggle);
  expect(queryByRole('dialog')).toBeNull();
});

it('closes at the desktop breakpoint and releases the scroll lock on unmount', () => {
  let change: (() => void) | undefined;
  const desktop = {
    matches: false,
    addEventListener: vi.fn((_event, callback: () => void) => {
      change = callback;
    }),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', () => desktop);
  const view = render(<Navbar activeSection="home" onNavigate={vi.fn()} />);
  fireEvent.click(view.getByRole('button', { name: 'Open menu' }));
  desktop.matches = true;
  act(() => change?.());
  expect(view.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(view.getByRole('link', { name: 'Juyel Hushen home' }));
  expect(desktop.removeEventListener).toHaveBeenCalled();
  fireEvent.click(view.getByRole('button', { name: 'Open menu' }));
  view.unmount();
  expect(document.body.style.overflow).not.toBe('hidden');
});

it('positions one desktop marker on the active destination and remeasures on resize', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.dataset.navId === 'skills' ? 120 : 250;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);
  const view = render(<Navbar activeSection="skills" onNavigate={vi.fn()} />);
  const nav = view.getByRole('navigation', { name: 'Main navigation' });
  expect(nav.style.getPropertyValue('--active-indicator-left')).toBe('120px');
  view.rerender(<Navbar activeSection="projects" onNavigate={vi.fn()} />);
  expect(nav.style.getPropertyValue('--active-indicator-left')).toBe('250px');
  expect(nav.style.getPropertyValue('--active-indicator-width')).toBe('80px');
  fireEvent.resize(window);
  expect(nav.style.getPropertyValue('--active-indicator-left')).toBe('250px');
  view.rerender(<Navbar activeSection="home" onNavigate={vi.fn()} />);
  expect(nav.dataset.active).toBe('false');
});
