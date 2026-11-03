import { useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(notify: () => void) {
  const query = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
  query?.addEventListener('change', notify);
  return () => query?.removeEventListener('change', notify);
}

function snapshot() {
  return typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : null;
}

export function useSystemReducedMotion() {
  const initialPreference = useReducedMotion() ?? false;
  // Motion currently snapshots the OS setting; subscribe as well for live changes.
  return useSyncExternalStore(subscribe, snapshot, () => null) ?? initialPreference;
}
