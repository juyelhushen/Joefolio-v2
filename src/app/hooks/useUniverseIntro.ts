import { useCallback, useState } from 'react';

const INTRO_SESSION_KEY = 'joefolio-universe-intro-seen';

function shouldShowUniverseIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return false;
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
  const [showUniverseIntro, setShowUniverseIntro] = useState(shouldShowUniverseIntro);
  const completeUniverseIntro = useCallback(() => {
    setShowUniverseIntro(false);
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
