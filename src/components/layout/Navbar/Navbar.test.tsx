import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('does not measure a desktop underline when the mobile indicator is hidden', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get');
  const { getByRole } = render(<Navbar activeSection="home" onNavigate={vi.fn()} />);
  fireEvent.click(getByRole('button', { name: 'Open menu' }));
  expect(width).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(getByRole('link', { name: 'Home' }));
});

it('opens as a disclosure and closes on Escape without locking page scroll', () => {
  const { getByRole } = render(<Navbar activeSection="home" onNavigate={vi.fn()} />);
  const toggle = getByRole('button', { name: 'Open menu' });
  const overflowBefore = document.body.style.overflow;

  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(getByRole('navigation', { name: 'Main navigation' }).className).toContain('is-open');
  expect(document.querySelector('.menu-backdrop')).toBeTruthy();
  expect(document.activeElement).toBe(getByRole('link', { name: 'Home' }));

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(toggle);
  expect(document.body.style.overflow).toBe(overflowBefore);
});

it('closes on backdrop activation and when focus leaves the menu', () => {
  const { getByRole, container } = render(<Navbar activeSection="home" onNavigate={vi.fn()} />);
  const toggle = getByRole('button', { name: 'Open menu' });
  fireEvent.click(toggle);
  fireEvent.click(container.querySelector('.menu-backdrop') as HTMLButtonElement);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(toggle);

  fireEvent.click(toggle);
  const navigation = getByRole('navigation', { name: 'Main navigation' });
  fireEvent.blur(navigation, { relatedTarget: document.body });
  expect(getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(toggle);
});

it('closes after selecting a section and invokes the navigation callback', () => {
  const onNavigate = vi.fn();
  const { getByRole } = render(<Navbar activeSection="home" onNavigate={onNavigate} />);
  const toggle = getByRole('button', { name: 'Open menu' });
  fireEvent.click(toggle);
  fireEvent.click(getByRole('link', { name: 'Projects' }));

  expect(onNavigate).toHaveBeenCalledWith('projects');
  expect(getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe('false');
});

it('prefetches search on focus and provides a mobile menu entry with focus restored to its toggle', () => {
  const onSearch = vi.fn();
  const onSearchIntent = vi.fn();
  const { getByRole } = render(
    <Navbar
      activeSection="home"
      onNavigate={vi.fn()}
      onSearch={onSearch}
      onSearchIntent={onSearchIntent}
    />,
  );
  const headerSearch = getByRole('button', { name: 'Search portfolio' });
  fireEvent.focus(headerSearch);
  expect(onSearchIntent).toHaveBeenCalledOnce();
  fireEvent.click(headerSearch);
  expect(onSearch).toHaveBeenCalledOnce();
  const toggle = getByRole('button', { name: 'Open menu' });
  fireEvent.click(toggle);
  expect(document.querySelector('.mobile-effects-toggle')).toBeNull();
  expect(document.querySelector('button[role="switch"]')).toBeNull();
  fireEvent.click(document.querySelector('.mobile-search') as HTMLButtonElement);
  expect(onSearch).toHaveBeenCalledTimes(2);
  expect(document.activeElement).toBe(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});
