type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type IdleScheduleOptions = {
  timeout?: number;
  fallbackDelay?: number;
};

export function scheduleAfterIdle(
  callback: () => void,
  { timeout = 1500, fallbackDelay = 150 }: IdleScheduleOptions = {},
): () => void {
  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const timer = window.setTimeout(callback, fallbackDelay);
  return () => window.clearTimeout(timer);
}
