import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import EarthGlobe from './EarthGlobe';

const mocks = vi.hoisted(() => ({
  render: vi.fn(),
  dispose: vi.fn(),
  renderer: vi.fn(),
  textureLoad: vi.fn(),
}));

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = document.createElement('canvas');
      render = mocks.render;
      dispose = mocks.dispose;
      constructor() {
        mocks.renderer();
      }
      setPixelRatio() {}
      setClearColor() {}
      setSize() {}
    },
    TextureLoader: class {
      load(url: string, onLoad: (texture: InstanceType<typeof actual.Texture>) => void) {
        mocks.textureLoad(url);
        onLoad(new actual.Texture());
      }
    },
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('updates motion without rebuilding the renderer or reloading the texture', () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  const requestFrame = vi.fn(() => 1);
  vi.stubGlobal('requestAnimationFrame', requestFrame);
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const view = render(<EarthGlobe lit={false} reduceMotion />);

  expect(mocks.renderer).toHaveBeenCalledTimes(1);
  expect(mocks.textureLoad).toHaveBeenCalledTimes(1);
  expect(requestFrame).not.toHaveBeenCalled();

  view.rerender(<EarthGlobe lit reduceMotion={false} />);
  expect(requestFrame).toHaveBeenCalledTimes(1);
  view.rerender(<EarthGlobe lit reduceMotion />);
  expect(mocks.renderer).toHaveBeenCalledTimes(1);
  expect(mocks.textureLoad).toHaveBeenCalledTimes(1);
  expect(mocks.dispose).not.toHaveBeenCalled();
  expect(view.container.querySelector('.earth-renderer')?.getAttribute('aria-hidden')).toBe('true');

  view.unmount();
  expect(mocks.dispose).toHaveBeenCalledTimes(1);
});
