import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import CosmicFooter from './CosmicFooter';
import { PUBLIC_EMAIL, RESUME_FILENAME, RESUME_PATH, PROFILE_LINKS } from '../../../lib/profile';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderFooter() {
  const homeHeadingRef = createRef<HTMLHeadingElement>();
  render(
    <>
      <h1 ref={homeHeadingRef} tabIndex={-1}>
        Portfolio home
      </h1>
      <CosmicFooter homeHeadingRef={homeHeadingRef} />
    </>,
  );
}

it('renders social destinations in order and keeps the address only in the labelled email link', () => {
  renderFooter();
  const navigation = screen.getByRole('navigation', { name: 'Social profiles' });
  expect(
    within(navigation)
      .getAllByRole('link')
      .map((link) => link.textContent?.trim()),
  ).toEqual(['LinkedIn', 'GitHub', 'Email', 'LeetCode']);
  expect(screen.getByRole('link', { name: 'LinkedIn' }).getAttribute('href')).toBe(
    PROFILE_LINKS.linkedin,
  );
  expect(screen.getByRole('link', { name: 'GitHub' }).getAttribute('href')).toBe(
    PROFILE_LINKS.github,
  );
  expect(screen.getByRole('link', { name: 'LeetCode' }).getAttribute('href')).toBe(
    PROFILE_LINKS.leetcode,
  );
  const email = screen.getByRole('link', { name: 'Email' });
  expect(email.getAttribute('href')).toBe(`mailto:${PUBLIC_EMAIL}`);
  expect(email.closest('footer')).toBeTruthy();
  expect(screen.queryByText(PUBLIC_EMAIL)).toBeNull();
});

it.each([false, true])('gates the résumé link on the build flag: %s', (available) => {
  vi.stubGlobal('__HAS_RESUME__', available);
  renderFooter();
  const download = screen.queryByRole('link', { name: 'Download résumé (PDF)' });
  if (available) {
    expect(download?.getAttribute('href')).toBe(RESUME_PATH);
    expect(download?.getAttribute('download')).toBe(RESUME_FILENAME);
  } else {
    expect(download).toBeNull();
  }
});

it('links back to the home section and returns focus to the home heading', () => {
  renderFooter();
  const backToTop = screen.getByRole('link', { name: 'Back to top' });
  expect(backToTop.getAttribute('href')).toBe('#home');
  fireEvent.click(backToTop);
  expect(screen.getByRole('heading', { name: 'Portfolio home' })).toBe(document.activeElement);
});
