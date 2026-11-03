import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ArchitectureFlow from './ArchitectureFlow';
import { projects } from '../data/projects';

let intersect: (visible: boolean) => void;
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersect = (visible) => callback([{ isIntersecting: visible }]);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, 'connection');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const architecture = projects[0].architecture;

it('starts once on visibility, retains ordered steps and replays without losing button focus', () => {
  const { container } = render(<ArchitectureFlow architecture={architecture} />);
  const flow = container.querySelector('.architecture-flow');
  expect(flow?.getAttribute('data-started')).toBe('false');
  expect(screen.getAllByRole('list')).toHaveLength(architecture.lanes.length);
  expect(screen.getAllByRole('listitem')).toHaveLength(
    architecture.lanes.reduce((sum, lane) => sum + lane.steps.length, 0),
  );
  act(() => intersect(true));
  expect(flow?.getAttribute('data-started')).toBe('true');
  const node = container.querySelector('ol');
  act(() => intersect(false));
  expect(flow?.getAttribute('data-running')).toBe('false');
  act(() => intersect(true));
  expect(container.querySelector('ol')).toBe(node);
  const replay = screen.getByRole('button', { name: 'Replay architecture animation' });
  replay.focus();
  fireEvent.click(replay);
  expect(container.querySelector('ol')).not.toBe(node);
  expect(document.activeElement).toBe(replay);
  expect(container.querySelector('.architecture-packet')?.getAttribute('aria-hidden')).toBe('true');
});

it.each(['mobile', 'OS reduced motion', 'reduced-motion prop', 'missing observer', 'data saving'])(
  'shows the final static state without Replay for %s',
  (condition) => {
    if (condition === 'data saving') {
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: Object.assign(new EventTarget(), { saveData: true }),
      });
    }
    if (condition === 'missing observer') vi.stubGlobal('IntersectionObserver', undefined);
    if (condition === 'mobile' || condition === 'OS reduced motion') {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((media: string) => ({
          matches:
            media ===
            (condition === 'mobile' ? '(max-width: 740px)' : '(prefers-reduced-motion: reduce)'),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      );
    }
    const { container } = render(
      <ArchitectureFlow
        architecture={architecture}
        reduceMotion={condition === 'reduced-motion prop'}
      />,
    );
    expect(container.querySelector('[data-animated="false"]')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Replay architecture animation' })).toBeNull();
  },
);

it('pauses when hidden or exiting the dialog', () => {
  const { container, rerender } = render(<ArchitectureFlow architecture={architecture} />);
  act(() => intersect(true));
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(container.querySelector('.architecture-flow')?.getAttribute('data-running')).toBe('false');
  vi.restoreAllMocks();
  fireEvent(document, new Event('visibilitychange'));
  rerender(<ArchitectureFlow architecture={architecture} enabled={false} />);
  expect(container.querySelector('.architecture-flow')?.getAttribute('data-running')).toBe('false');
});
