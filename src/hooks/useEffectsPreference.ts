import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'joefolio-reduce-effects';
const CHANGE_EVENT = 'joefolio-effects-preference-change';

type NetworkInformation = EventTarget & {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

function getConnection(): NetworkInformation | undefined {
  return (navigator as NavigatorWithConnection).connection;
}

function getDefaultPreference(): boolean {
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReducedMotion || Boolean(getConnection()?.saveData);
}

function readExplicitPreference(): boolean | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'true' ? true : stored === 'false' ? false : null;
  } catch (error) {
    console.warn('Could not read the effects preference; using device defaults.', error);
    return null;
  }
}

let explicitPreference = typeof window === 'undefined' ? null : readExplicitPreference();

function getSnapshot(): boolean {
  return explicitPreference ?? getDefaultPreference();
}

function subscribe(onChange: () => void): () => void {
  const motionQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
  const connection = getConnection();
  const notify = () => onChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    explicitPreference =
      event.newValue === 'true' ? true : event.newValue === 'false' ? false : null;
    notify();
  };

  motionQuery?.addEventListener('change', notify);
  connection?.addEventListener('change', notify);
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, notify);

  return () => {
    motionQuery?.removeEventListener('change', notify);
    connection?.removeEventListener('change', notify);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

export function setReducedEffects(reduced: boolean): void {
  explicitPreference = reduced;
  if (typeof document !== 'undefined')
    document.documentElement.dataset.effectsReduced = String(reduced);
  try {
    window.localStorage.setItem(STORAGE_KEY, String(reduced));
  } catch (error) {
    console.warn('Could not save the effects preference; applying it for this visit only.', error);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useEffectsPreference(): {
  reducedEffects: boolean;
  setReducedEffects: (reduced: boolean) => void;
} {
  const reducedEffects = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const updatePreference = useCallback((reduced: boolean) => setReducedEffects(reduced), []);
  return { reducedEffects, setReducedEffects: updatePreference };
}
