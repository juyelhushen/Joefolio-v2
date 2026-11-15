import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(notify: () => void) {
  const query = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
  query?.addEventListener('change', notify);
  return () => query?.removeEventListener('change', notify);
}

function snapshot() {
  return typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : false;
}

export function useSystemReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
