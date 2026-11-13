import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CosmicMeshBackground from './CosmicMeshBackground';
import { EnvironmentProvider } from '../EnvironmentContext';

afterEach(() => {
  cleanup();
  delete document.body.dataset.cosmicIntro;
  Reflect.deleteProperty(window, '__STELLAR_FOLD__');
  Reflect.deleteProperty(navigator, 'connection');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('initializes the same WebGL environment during the intro and ignores duplicate handoffs', () => {
  document.body.dataset.cosmicIntro = 'active';
  window.__STELLAR_FOLD__ = { active: true, elapsed: 0, painted: false, settled: 0 };
  const callbacks = mockIdleCallback();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { unmount } = renderWithEnvironment(<CosmicMeshBackground />);
  expect(callbacks).toHaveLength(0);
  expect(getContext).toHaveBeenCalledTimes(1);

  delete document.body.dataset.cosmicIntro;
  act(() => window.dispatchEvent(new Event('cosmic-intro-complete')));
  act(() => window.dispatchEvent(new Event('cosmic-intro-complete')));
  expect(callbacks).toHaveLength(0);
  expect(getContext).toHaveBeenCalledTimes(1);
  unmount();
  act(() => window.dispatchEvent(new Event('cosmic-intro-complete')));
  expect(callbacks).toHaveLength(0);
});

it('does not acquire another context after unmount during the intro', () => {
  document.body.dataset.cosmicIntro = 'active';
  window.__STELLAR_FOLD__ = { active: true, elapsed: 0, painted: false, settled: 0 };
  const callbacks = mockIdleCallback();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { unmount } = renderWithEnvironment(<CosmicMeshBackground />);
  unmount();
  delete document.body.dataset.cosmicIntro;
  act(() => window.dispatchEvent(new Event('cosmic-intro-complete')));
  expect(callbacks).toHaveLength(0);
});

function mockIdleCallback() {
  const callbacks: (() => void)[] = [];
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((callback: () => void) => {
      callbacks.push(callback);
      return callbacks.length;
    }),
  );
  vi.stubGlobal('cancelIdleCallback', vi.fn());
  return callbacks;
}

function renderWithEnvironment(component: React.ReactElement) {
  return render(<EnvironmentProvider>{component}</EnvironmentProvider>);
}

it('waits for idle time before acquiring WebGL resources', () => {
  const callbacks = mockIdleCallback();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = renderWithEnvironment(<CosmicMeshBackground />);

  expect(container.querySelector('.cosmic-mesh-background')?.getAttribute('data-mode')).toBe(
    'static',
  );
  expect(callbacks).toHaveLength(1);
  expect(getContext).not.toHaveBeenCalled();

  act(() => callbacks[0]());

  expect(getContext).toHaveBeenCalledTimes(1);
});

it('initializes mobile WebGL and restores a lost context without deleting invalid handles', () => {
  const callbacks = mockIdleCallback();
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => frames.push(callback)),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'matchMedia',
    vi.fn((media: string) => ({
      matches: media === '(max-width: 768px)',
      media,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const mockGLContext = {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    LINK_STATUS: 35714,
    COMPILE_STATUS: 35713,
    TRIANGLES: 4,
    COLOR_BUFFER_BIT: 16384,
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => null),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => null),
    deleteProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn(() => ({})),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    deleteBuffer: vi.fn(),
  };
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(mockGLContext as unknown as WebGLRenderingContext);
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  const { container, unmount } = renderWithEnvironment(<CosmicMeshBackground />);

  expect(container.querySelector('.cosmic-mesh-background')?.getAttribute('data-mode')).toBe(
    'static',
  );
  expect(callbacks).toHaveLength(1);

  // After idle callback, WebGL should be initialized
  act(() => callbacks[0]());
  expect(getContext).toHaveBeenCalled();

  const canvas = container.querySelector('canvas');
  window.__STELLAR_FOLD__ = { active: true, elapsed: 500, painted: true, settled: 0 };
  const animate = frames.find((callback) => callback.name === 'animate')!;
  const originalQuality = Number(canvas?.dataset.quality);
  act(() => {
    for (let index = 1; index <= 9; index++) animate(index * 45);
  });
  expect(Number(canvas?.dataset.quality)).toBeLessThan(originalQuality);
  window.__STELLAR_FOLD__.active = false;
  act(() => window.dispatchEvent(new Event('cosmic-intro-complete')));
  act(() => animate(500));
  expect(Number(canvas?.dataset.quality)).toBe(originalQuality);
  act(() => canvas?.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  expect(canvas?.dataset.ready).toBe('fallback');
  act(() => canvas?.dispatchEvent(new Event('webglcontextrestored')));
  expect(getContext).toHaveBeenCalledTimes(2);
  expect(canvas?.dataset.ready).toBe('true');
  expect(mockGLContext.deleteBuffer).not.toHaveBeenCalled();
  expect(mockGLContext.deleteProgram).not.toHaveBeenCalled();

  unmount();
  expect(mockGLContext.deleteBuffer).toHaveBeenCalledTimes(1);
  expect(mockGLContext.deleteProgram).toHaveBeenCalledTimes(1);
});

it('can fall back to CSS mesh when the connection requests data saving', () => {
  const callbacks = mockIdleCallback();
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: true },
  });
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const { container } = renderWithEnvironment(<CosmicMeshBackground />);

  expect(container.querySelector('.cosmic-mesh-background')?.getAttribute('data-mode')).toBe(
    'static',
  );
  // Should still schedule WebGL initialization
  expect(callbacks).toHaveLength(1);

  // After idle, if WebGL fails, should fall back gracefully
  act(() => callbacks[0]());
  expect(getContext).toHaveBeenCalled();
  expect(container.querySelector('.cosmic-mesh-background')?.getAttribute('data-mode')).toBe(
    'fallback',
  );
  expect(container.querySelector('canvas')?.getAttribute('data-ready')).toBe('fallback');
});

it('cancels the pending WebGL initialization when unmounted', () => {
  mockIdleCallback();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const { unmount } = renderWithEnvironment(<CosmicMeshBackground />);

  unmount();
  expect(cancelIdleCallback).toHaveBeenCalledWith(1);
  expect(getContext).not.toHaveBeenCalled();
});
