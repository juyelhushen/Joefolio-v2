import { cleanup, renderHook, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useActiveSection } from './useActiveSection';

it('keeps Projects active for case-study hashes on load and history changes', () => {
  history.replaceState(null, '', '#projects/sentinel');
  const { result } = renderHook(() => useActiveSection());
  expect(result.current.activeSection).toBe('projects');
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    history.replaceState(null, '', '#projects/cut2short');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(result.current.activeSection).toBe('projects');
});

it.each([
  ['experience', 'experience', 'about'],
  ['skills', 'skills', 'about'],
  ['ai-lab', 'projects', 'projects'],
] as const)(
  'scrolls #%s to the correct heading and retains the section state',
  (hash, target, active) => {
    const element = document.createElement('div');
    element.id = target;
    element.scrollIntoView = vi.fn();
    document.body.append(element);
    history.replaceState(null, '', `#${hash}`);
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        callbacks.push(callback);
        return callbacks.length;
      }),
    );
    const { result, unmount } = renderHook(() => useActiveSection());
    act(() => callbacks[0](0));
    expect(element.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(result.current.activeSection).toBe(active);
    unmount();
    element.remove();
  },
);

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('shares the existing scroll listener with the dock compact state and avoids threshold flicker', () => {
  const { result } = renderHook(() => useActiveSection());
  const scroll = (y: number) => {
    vi.stubGlobal('scrollY', y);
    act(() => window.dispatchEvent(new Event('scroll')));
  };
  scroll(70);
  expect(result.current.isScrolled).toBe(true);
  scroll(55);
  expect(result.current.isScrolled).toBe(true);
  scroll(20);
  expect(result.current.isScrolled).toBe(false);
  scroll(50);
  expect(result.current.isScrolled).toBe(false);
});

it('keeps adjacent sections stable inside a twelve-pixel activation dead band', () => {
  const home = document.createElement('section');
  const about = document.createElement('section');
  home.id = 'home';
  about.id = 'about';
  document.body.append(home, about);
  const line = 16 + Math.min(140, window.innerHeight * 0.2);
  let top = line - 5;
  vi.spyOn(home, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, -100, 100, 100));
  vi.spyOn(about, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, top, 100, 100));
  const { result, unmount } = renderHook(() => useActiveSection());
  const update = () => act(() => window.dispatchEvent(new Event('scroll')));
  update();
  expect(result.current.activeSection).toBe('home');
  top = line - 13;
  update();
  expect(result.current.activeSection).toBe('about');
  top = line + 5;
  update();
  expect(result.current.activeSection).toBe('about');
  top = line + 13;
  update();
  expect(result.current.activeSection).toBe('home');
  unmount();
  home.remove();
  about.remove();
});

it('does not use the full-height sidebar as the scroll-spy offset', () => {
  vi.stubGlobal('innerWidth', 1280);
  const header = document.createElement('header');
  header.className = 'site-header';
  const home = document.createElement('section');
  const projects = document.createElement('section');
  home.id = 'home';
  projects.id = 'projects';
  document.body.append(header, home, projects);
  vi.spyOn(header, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 260, 800));
  vi.spyOn(home, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, -500, 500, 400));
  vi.spyOn(projects, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 64, 500, 400));
  const { result, unmount } = renderHook(() => useActiveSection());
  act(() => window.dispatchEvent(new Event('scroll')));
  expect(result.current.activeSection).toBe('projects');
  unmount();
  header.remove();
  home.remove();
  projects.remove();
});

it('cancels pending history measurements when a newer measurement arrives and on unmount', () => {
  let nextFrame = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => ++nextFrame),
  );
  const cancelFrame = vi.fn();
  vi.stubGlobal('cancelAnimationFrame', cancelFrame);
  const { unmount } = renderHook(() => useActiveSection());

  window.dispatchEvent(new PopStateEvent('popstate'));
  window.dispatchEvent(new PopStateEvent('popstate'));
  expect(cancelFrame).toHaveBeenCalledWith(2);
  unmount();
  expect(cancelFrame).toHaveBeenCalledWith(1);
  expect(cancelFrame).toHaveBeenCalledWith(3);
  expect(cancelFrame).toHaveBeenCalledTimes(3);
});
