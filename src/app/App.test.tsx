import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';
import { PUBLIC_EMAIL } from '../lib/profile';

vi.mock('./hooks/useBackendHealth', () => ({ useBackendHealth: () => 'UP' }));

afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('moves the single social row when the responsive layout changes', () => {
  vi.stubGlobal('matchMedia', undefined);
  vi.stubGlobal('innerWidth', 390);
  render(<App />);
  expect(
    screen.getByRole('navigation', { name: 'Social profiles' }).closest('footer'),
  ).toBeTruthy();
  vi.stubGlobal('innerWidth', 1280);
  fireEvent(window, new Event('resize'));
  expect(
    screen.getByRole('navigation', { name: 'Social profiles' }).closest('.site-header'),
  ).toBeTruthy();
  expect(document.querySelectorAll('a[href^="mailto:"]')).toHaveLength(1);
});

it('renders the narrow-column identity, required sections and skip link', () => {
  render(<App />);

  expect(screen.getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe(
    '#main-content',
  );
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1, name: 'Juyel Hushen' })).toBeTruthy();
  expect(screen.getByText('Software Engineer building reliable backend systems.')).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: 'Toolbox' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: 'Work' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: 'Get in touch' })).toBeTruthy();
});

it.each([390, 1280])('renders one email link at viewport width %s', (width) => {
  vi.stubGlobal('matchMedia', undefined);
  vi.stubGlobal('innerWidth', width);
  render(<App />);

  const mailLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]');
  expect(mailLinks).toHaveLength(1);
  expect(mailLinks[0].getAttribute('href')).toBe(`mailto:${PUBLIC_EMAIL}`);
  expect(mailLinks[0].getAttribute('aria-label')).toBe('Email');
  expect(Boolean(mailLinks[0].closest('footer'))).toBe(width <= 980);
  expect(Boolean(mailLinks[0].closest('.site-header'))).toBe(width > 980);
  expect(document.body.textContent).not.toContain(PUBLIC_EMAIL);
  const links = within(screen.getByRole('navigation', { name: 'Social profiles' }))
    .getAllByRole('link')
    .map((link) => link.getAttribute('aria-label'));
  expect(links).toEqual(['GitHub', 'Email', 'LinkedIn', 'LeetCode']);
  expect(screen.queryByRole('button', { name: /Reduce effects/i })).toBeNull();
  vi.unstubAllGlobals();
});

it('shows only verified project list entries with AI tags and opens a case study', async () => {
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
  render(<App />);

  const work = screen.getByRole('region', { name: 'Work' });
  expect(within(work).getAllByRole('listitem')).toHaveLength(5);
  expect(within(work).getAllByText('#ai')).toHaveLength(2);
  const caseStudyLink = within(work).getAllByRole('link', { name: 'Case study' })[0];
  fireEvent.click(caseStudyLink);
  expect(await screen.findByRole('dialog', { name: 'Sentinel' })).toBeTruthy();
  await waitFor(() => expect(location.hash).toBe('#projects/sentinel'));
});
