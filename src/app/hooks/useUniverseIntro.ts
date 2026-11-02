import { useCallback, useRef, useState } from 'react';
import { useEffectsPreference } from '../../hooks/useEffectsPreference';

const INTRO_SESSION_KEY = 'joefolio-universe-intro-seen';

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

function shouldShowUniverseIntro(reducedEffects: boolean): boolean {
  if (typeof window === 'undefined') return false;
  if (reducedEffects) return false;
  if (window.innerWidth <= 740) return false;
  if ((navigator as NavigatorWithConnection).connection?.saveData) return false;
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('intro') === '1')
    return true;

  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) !== 'true';
  } catch (error) {
    console.warn(
      'Could not read the intro session flag; showing the intro for this page load.',
      error,
    );
    return true;
  }
}

export const useUniverseIntro = () => {
  const { reducedEffects } = useEffectsPreference();
  const [completed, setCompleted] = useState(false);
  const shouldShowRef = useRef<boolean | null>(null);
  const dismissedByPreferenceRef = useRef(false);
  if (shouldShowRef.current === null)
    shouldShowRef.current = shouldShowUniverseIntro(reducedEffects);
  if (reducedEffects) dismissedByPreferenceRef.current = true;
  const showUniverseIntro =
    shouldShowRef.current && !completed && !dismissedByPreferenceRef.current;

  const completeUniverseIntro = useCallback(() => {
    setCompleted(true);
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
    } catch (error) {
      console.warn(
        'Could not save the intro session flag; it may replay on a later page load.',
        error,
      );
    }
  }, []);

  return { showUniverseIntro, completeUniverseIntro };
};
