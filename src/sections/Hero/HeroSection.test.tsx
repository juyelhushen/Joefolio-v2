import { act, cleanup, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { domAnimation, LazyMotion } from 'motion/react';
import HeroSection from './HeroSection';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each([false, true])(
  'renders one concise identity and two actions with reduced motion=%s',
  (reduceMotion) => {
    const headingRef = createRef<HTMLHeadingElement>();
    const { container } = render(
      <LazyMotion features={domAnimation}>
        <HeroSection reduceMotion={reduceMotion} headingRef={headingRef} />
      </LazyMotion>,
    );
    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'I turn complex ideas into reliable software.',
    });
    const hero = screen.getByRole('region', { name: heading.textContent ?? '' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(headingRef.current).toBe(heading);
    expect(heading.id).toBe('home-title');
    expect(heading.tabIndex).toBe(-1);
    expect(screen.getByText('SOFTWARE ENGINEER II · FULL-STACK · AI')).toBeTruthy();
    expect(
      screen.getByText(
        'Building dependable backend systems, thoughtful digital experiences and practical AI solutions.',
      ),
    ).toBeTruthy();
    expect(container.querySelector('.hero-actions')?.querySelectorAll('a')).toHaveLength(2);
    expect(within(hero).getByRole('link', { name: 'Explore my work' }).getAttribute('href')).toBe(
      '#projects',
    );
    expect(within(hero).getByRole('link', { name: 'Get in touch' }).getAttribute('href')).toBe(
      '#contact',
    );
    expect(within(hero).queryByRole('list')).toBeNull();
    expect(container.querySelector('.hero-employment-proof')).toBeNull();
    const scene = screen.getByRole('group', { name: /Engineering constellation/ });
    expect(scene.parentElement).toBe(hero);
    expect(within(scene).getAllByRole('link')).toHaveLength(3);
    expect(
      within(scene)
        .getByRole('link', { name: /Backend: Java, Spring Boot/ })
        .getAttribute('href'),
    ).toBe('#projects');
    expect(
      within(scene)
        .getByRole('link', { name: /Full-stack: React, TypeScript/ })
        .getAttribute('href'),
    ).toBe('#skills');
    expect(
      within(scene)
        .getByRole('link', { name: /AI systems: RAG, LangGraph, agents/ })
        .getAttribute('href'),
    ).toBe('#ai-lab');
    expect(scene.querySelector('.constellation-lines')?.getAttribute('aria-hidden')).toBe('true');
    expect(scene.querySelector('.constellation-satellite-orbit')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(container.querySelector('.planet-scene')).toBeNull();
    expect(scene.getAttribute('data-motion-active')).toBe('false');

    expect(heading.querySelector('em')?.textContent).toBe('reliable software.');
    expect(container.querySelectorAll('.hero-cta')).toHaveLength(2);
    expect(heading.style.opacity).not.toBe('0');
  },
);

it('animates the constellation only while visible in an active tab and stops for reduced motion', () => {
  let intersect: IntersectionObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const renderHero = (reduceMotion: boolean) => (
    <LazyMotion features={domAnimation}>
      <HeroSection reduceMotion={reduceMotion} headingRef={createRef()} />
    </LazyMotion>
  );
  const { container, rerender, unmount } = render(renderHero(false));
  const scene = container.querySelector('.engineering-constellation')!;
  const setVisible = (isIntersecting: boolean) =>
    act(() =>
      intersect([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver),
    );
  expect(scene.getAttribute('data-motion-active')).toBe('false');
  setVisible(true);
  expect(scene.getAttribute('data-motion-active')).toBe('true');
  setVisible(false);
  expect(scene.getAttribute('data-motion-active')).toBe('false');
  setVisible(true);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(scene.getAttribute('data-motion-active')).toBe('false');
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(scene.getAttribute('data-motion-active')).toBe('true');
  rerender(renderHero(true));
  expect(scene.getAttribute('data-motion-active')).toBe('false');
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});
