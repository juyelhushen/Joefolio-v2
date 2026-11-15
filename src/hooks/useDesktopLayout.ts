import { useSyncExternalStore } from 'react';

const QUERY = '(min-width: 981px)';

function subscribe(notify: () => void) {
  if (typeof window.matchMedia === 'function') {
    const query = window.matchMedia(QUERY);
    query.addEventListener('change', notify);
    return () => query.removeEventListener('change', notify);
  }
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
}

function snapshot() {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : window.innerWidth >= 981;
}

export function useDesktopLayout() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
