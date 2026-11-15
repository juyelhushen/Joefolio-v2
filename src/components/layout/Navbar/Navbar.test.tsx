import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('shows only About, Work and Contact in the minimal desktop navigation', () => {
  render(<Navbar activeSection="about" onNavigate={vi.fn()} />);
  const links = within(screen.getByRole('navigation', { name: 'Main navigation' }))
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('href')]);
  expect(links).toEqual([
    ['About', '#about'],
    ['Work', '#projects'],
    ['Contact', '#contact'],
  ]);
  expect(screen.getByRole('link', { name: 'Juyel Hushen' }).getAttribute('href')).toBe('#home');
});

it('opens a disclosure menu with backdrop, Escape return-focus and no scroll lock', () => {
  render(<Navbar activeSection="home" onNavigate={vi.fn()} />);
  const toggle = screen.getByRole('button', { name: 'Open menu' });
  const initialOverflow = document.body.style.overflow;
  fireEvent.click(toggle);

  const mobileMenu = document.getElementById('mobile-menu');
  expect(mobileMenu).toBeTruthy();
  expect(document.activeElement).toBe(
    within(mobileMenu as HTMLElement).getByRole('link', { name: 'About' }),
  );
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(document.body.style.overflow).toBe(initialOverflow);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('button', { name: 'Close menu' })).toBeNull();
  expect(document.activeElement).toBe(toggle);
});

it('closes on backdrop or navigation and returns focus to the disclosure toggle', () => {
  const onNavigate = vi.fn();
  render(<Navbar activeSection="home" onNavigate={onNavigate} />);
  const toggle = screen.getByRole('button', { name: 'Open menu' });
  fireEvent.click(toggle);
  fireEvent.click(
    within(document.getElementById('mobile-menu') as HTMLElement).getByRole('link', {
      name: 'Work',
    }),
  );
  expect(onNavigate).toHaveBeenCalledWith('projects');
  expect(document.activeElement).toBe(toggle);

  fireEvent.click(toggle);
  fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  expect(document.activeElement).toBe(toggle);
});

it('keeps the Search shortcut and intent prefetch available in the header', () => {
  const onSearch = vi.fn();
  const onSearchIntent = vi.fn();
  render(
    <Navbar
      activeSection="home"
      onNavigate={vi.fn()}
      onSearch={onSearch}
      onSearchIntent={onSearchIntent}
    />,
  );
  const search = screen.getByRole('button', { name: 'Search' });
  fireEvent.focus(search);
  expect(onSearchIntent).toHaveBeenCalledOnce();
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  expect(onSearch).toHaveBeenCalledOnce();
});
