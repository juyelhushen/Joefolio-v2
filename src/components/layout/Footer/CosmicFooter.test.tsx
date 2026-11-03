import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { domAnimation, LazyMotion } from 'motion/react';
import CosmicFooter from './CosmicFooter';
import { PUBLIC_EMAIL, RESUME_FILENAME, RESUME_PATH } from '../../../lib/profile';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderFooter(reducedMotion = false) {
  const homeHeadingRef = createRef<HTMLHeadingElement>();
  render(
    <LazyMotion features={domAnimation}>
      <>
        <h1 ref={homeHeadingRef} tabIndex={-1}>
          Portfolio home
        </h1>
        <CosmicFooter homeHeadingRef={homeHeadingRef} reducedMotion={reducedMotion} />
      </>
    </LazyMotion>,
  );
}

it('renders the three accessible social profiles with verified destinations', () => {
  renderFooter();

  const expectedLinks = [
    ['LinkedIn', 'https://linkedin.com/in/juyel-hushen-770674170'],
    ['GitHub', 'https://github.com/juyelhushen'],
    ['LeetCode', 'https://leetcode.com/u/Juyel/'],
  ];

  for (const [name, href] of expectedLinks) {
    const link = screen.getByRole('link', { name });
    expect(link.getAttribute('href')).toBe(href);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  }
});

it.each([false, true])('labels email Gmail and gates the footer PDF link: %s', (available) => {
  vi.stubGlobal('__HAS_RESUME__', available);
  renderFooter(true);
  expect(screen.getByRole('link', { name: 'Gmail' }).getAttribute('href')).toBe(
    `mailto:${PUBLIC_EMAIL}`,
  );
  const email = screen.getByRole('link', { name: 'Gmail' });
  expect(screen.queryByText(PUBLIC_EMAIL)).toBeNull();
  expect(screen.queryByRole('link', { name: PUBLIC_EMAIL })).toBeNull();
  expect(screen.getByRole('navigation', { name: 'Social profiles' }).textContent).toBe(
    'LinkedInGitHubGmailLeetCode',
  );
  expect(email.previousElementSibling).toBe(screen.getByRole('link', { name: 'GitHub' }));
  expect(email.closest('nav')?.className).toBe('footer-social-links');
  expect(email.getAttribute('target')).toBeNull();
  expect(screen.queryByRole('button', { name: /Reduce effects|Copy email/i })).toBeNull();
  const download = screen.queryByRole('link', { name: 'Download résumé (PDF)' });
  if (available) {
    expect(download?.getAttribute('href')).toBe(RESUME_PATH);
    expect(download?.getAttribute('download')).toBe(RESUME_FILENAME);
  } else {
    expect(download).toBeNull();
  }
});

it('animates one jet from the button position, scrolls home, and resets for another launch', async () => {
  const scrollTo = vi.fn();
  vi.stubGlobal('scrollTo', scrollTo);
  renderFooter();

  const button = screen.getByRole('button', { name: 'Fly to top' });
  vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(new DOMRect(120, 520, 100, 46));
  fireEvent.click(button);
  fireEvent.click(button);

  const flight = screen.getByTestId('return-flight');
  expect(flight.getAttribute('data-start-x')).toBe('170');
  expect(flight.getAttribute('data-start-y')).toBe('543');
  expect((flight as HTMLElement).style.left).toBe('170px');
  expect((flight as HTMLElement).style.top).toBe('543px');
  expect(screen.getAllByTestId('return-flight')).toHaveLength(1);
  expect(button.hasAttribute('disabled')).toBe(true);
  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

  await waitFor(() => expect(screen.queryByTestId('return-flight')).toBeNull(), { timeout: 4000 });
  expect(button.hasAttribute('disabled')).toBe(false);
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });

  fireEvent.click(button);
  expect(screen.getByTestId('return-flight')).toBeTruthy();
});

it('skips the flight and scrolls immediately when reduced motion is requested', () => {
  const scrollTo = vi.fn();
  vi.stubGlobal('scrollTo', scrollTo);
  renderFooter(true);

  fireEvent.click(screen.getByRole('button', { name: 'Fly to top' }));

  expect(screen.queryByTestId('return-flight')).toBeNull();
  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  expect(screen.getByRole('heading', { name: 'Portfolio home' })).toBe(document.activeElement);
});
