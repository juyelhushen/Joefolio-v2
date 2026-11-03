import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useSpring } from 'motion/react';
import CosmicMagnifyingCursor from './CosmicMagnifyingCursor';

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  return { ...actual, useSpring: vi.fn((value) => value) };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('switches scanner modes only with targets and pauses rotations after pointer motion stops', () => {
  vi.useFakeTimers();
  configureMedia();
  const { baseElement: container, unmount } = render(
    <>
      <CosmicMagnifyingCursor />
      <div data-cursor-target="card">Card</div>
      <div data-cursor-target="image">Image</div>
      <button className="skill-orbit-planet">Planet</button>
      <a href="#projects">Inspect link</a>
    </>,
  );
  const scanner = container.querySelector('.cosmic-cursor');
  expect(container.querySelectorAll('.cosmic-cursor-ghost')).toHaveLength(2);
  expect(container.querySelector('.scanner-beam')).toBeTruthy();
  for (const [text, mode] of [
    ['Card', 'inspect'],
    ['Image', 'image'],
    ['Planet', 'planet'],
    ['Inspect link', 'interactive'],
  ]) {
    pointer(screen.getByText(text), 'pointermove');
    expect(scanner?.getAttribute('data-mode')).toBe(mode);
    expect(scanner?.getAttribute('data-moving')).toBe('true');
  }
  act(() => vi.advanceTimersByTime(180));
  expect(scanner?.getAttribute('data-moving')).toBe('false');
  pointer(container, 'pointermove');
  expect(scanner?.getAttribute('data-mode')).toBe('default');
  unmount();
  expect(vi.getTimerCount()).toBeLessThanOrEqual(1);
});

function configureMedia(fine = true, reduced = false) {
  let currentReduced = reduced;
  const queries = new Map<
    string,
    {
      matches: boolean;
      addEventListener: ReturnType<typeof vi.fn>;
      removeEventListener: ReturnType<typeof vi.fn>;
    }
  >();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const existing = queries.get(query);
      if (existing) return existing;
      const media = {
        get matches() {
          return query.includes('reduced-motion') ? currentReduced : fine;
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      queries.set(query, media);
      return media;
    }),
  );
  return {
    queries,
    setReducedPreference(next: boolean) {
      currentReduced = next;
      for (const [query, media] of queries) {
        if (query.includes('reduced-motion')) {
          for (const [, listener] of media.addEventListener.mock.calls) {
            if (typeof listener === 'function') listener(new Event('change'));
          }
        }
      }
    },
  };
}

function pointer(element: Element, type: string, x = 120, y = 180, pointerType = 'mouse') {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { clientX: x, clientY: y, pointerType, buttons: 0 });
  fireEvent(element, event);
}

it.each([
  [false, false],
  [true, true],
])('does not render for fine=%s reduced=%s', (fine, reduced) => {
  configureMedia(fine, reduced);
  const { container } = render(<CosmicMagnifyingCursor />);
  expect(container.querySelector('.cosmic-cursor')).toBeNull();
});

it('tracks pointer values without intercepting clicks, and clears targets on exit/blur/drag', () => {
  configureMedia();
  const click = vi.fn();
  const { baseElement: container } = render(
    <>
      <CosmicMagnifyingCursor />
      <button onClick={click}>Explore</button>
      <input aria-label="Name" />
    </>,
  );
  const lens = container.querySelector('.cosmic-cursor');
  expect(lens?.getAttribute('aria-hidden')).toBe('true');
  expect((lens as HTMLElement).style.pointerEvents).toBe('none');
  const button = screen.getByRole('button');
  const bounds = vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    top: 160,
    width: 40,
    height: 40,
  } as DOMRect);
  pointer(button, 'pointermove');
  const springs = vi.mocked(useSpring).mock.results;
  expect(springs[0].value.get()).toBe(120);
  expect(springs[1].value.get()).toBe(180);
  pointer(button, 'pointermove', 130, 190);
  expect(springs[0].value.get()).toBeCloseTo(128.8);
  expect(bounds).toHaveBeenCalledTimes(1);
  expect(button.classList.contains('is-cursor-target')).toBe(true);
  fireEvent.click(button);
  expect(click).toHaveBeenCalledTimes(1);
  fireEvent(document, new Event('pointerleave'));
  expect(button.classList.contains('is-cursor-target')).toBe(false);
  pointer(button, 'pointermove');
  fireEvent(window, new Event('blur'));
  expect(button.classList.contains('is-cursor-target')).toBe(false);
  pointer(button, 'pointermove');
  pointer(button, 'pointerdown');
  pointer(button, 'pointermove');
  expect(button.classList.contains('is-cursor-target')).toBe(false);
  pointer(button, 'pointerup');
  pointer(button, 'pointermove');
  expect(button.classList.contains('is-cursor-target')).toBe(true);
  pointer(screen.getByLabelText('Name'), 'pointermove');
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Juyel' } });
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Juyel');
  expect(button.classList.contains('is-cursor-target')).toBe(false);
  pointer(button, 'pointermove', 120, 180, 'touch');
  expect(button.classList.contains('is-cursor-target')).toBe(false);
});

it('removes pointer/media listeners and target styling on unmount or preference changes', () => {
  const { queries, setReducedPreference } = configureMedia();
  const removeDocument = vi.spyOn(document, 'removeEventListener');
  const removeWindow = vi.spyOn(window, 'removeEventListener');
  const { unmount } = render(
    <>
      <CosmicMagnifyingCursor />
      <a href="#projects">Projects</a>
    </>,
  );
  const link = screen.getByRole('link');
  pointer(link, 'pointermove');
  const springs = vi.mocked(useSpring).mock.results;
  const stopX = vi.spyOn(springs[0].value, 'stop');
  const stopY = vi.spyOn(springs[1].value, 'stop');
  act(() => setReducedPreference(true));
  expect(document.querySelector('.cosmic-cursor')).toBeNull();
  expect(link.classList.contains('is-cursor-target')).toBe(false);
  unmount();
  for (const event of [
    'pointermove',
    'pointerleave',
    'pointerdown',
    'pointerup',
    'pointerout',
    'pointercancel',
  ]) {
    expect(removeDocument).toHaveBeenCalledWith(event, expect.any(Function));
  }
  expect(removeWindow).toHaveBeenCalledWith('blur', expect.any(Function));
  expect(removeWindow).toHaveBeenCalledWith('scroll', expect.any(Function));
  expect(stopX).toHaveBeenCalled();
  expect(stopY).toHaveBeenCalled();
  for (const query of queries.values())
    expect(query.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});
