import { useCallback, useEffect, useRef, useState } from 'react';
import { navItems } from '../../components/layout/Navbar/navItems';

export const useActiveSection = () => {
  const initialHashTarget = navItems.find(
    (item) => item.id === (typeof window === 'undefined' ? '' : window.location.hash.slice(1)),
  );
  const [activeSection, setActiveSection] = useState<(typeof navItems)[number]['id']>(
    initialHashTarget?.id ?? 'home',
  );
  const pendingNavigationRef = useRef<(typeof navItems)[number]['id'] | null>(
    initialHashTarget?.id ?? null,
  );
  const updateActiveSection = useCallback(() => {
    const header = document.querySelector<HTMLElement>('.site-header');
    const activationLine =
      (header?.getBoundingClientRect().bottom ?? 0) + 16 + Math.min(140, window.innerHeight * 0.2);
    // Keep an explicit navigation target active until scrolling settles or the user scrolls again.
    if (pendingNavigationRef.current) return;

    const page = document.documentElement;
    if (
      page.scrollHeight > window.innerHeight &&
      window.scrollY + window.innerHeight >= page.scrollHeight - 2
    ) {
      setActiveSection((current) => (current === 'contact' ? current : 'contact'));
      return;
    }

    let currentSection: (typeof navItems)[number]['id'] = 'home';
    for (const item of navItems) {
      const section = document.getElementById(item.id);
      if (section && section.getBoundingClientRect().top <= activationLine)
        currentSection = item.id;
    }
    setActiveSection((current) => (current === currentSection ? current : currentSection));
  }, []);

  const handleNavigationClick = (id: (typeof navItems)[number]['id']) => {
    pendingNavigationRef.current = id;
    setActiveSection(id);
  };

  useEffect(() => {
    let historyFrame: number | undefined;
    const clearPendingNavigation = () => {
      pendingNavigationRef.current = null;
    };
    const finishPendingNavigation = () => {
      if (!pendingNavigationRef.current) return;
      pendingNavigationRef.current = null;
      updateActiveSection();
    };
    const handleResize = () => {
      clearPendingNavigation();
      updateActiveSection();
    };
    const handleScrollKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
        clearPendingNavigation();
      }
    };
    const syncHistoryNavigation = () => {
      if (
        pendingNavigationRef.current &&
        window.location.hash === `#${pendingNavigationRef.current}`
      )
        return;
      const hashId = window.location.hash.slice(1);
      const hashTarget = navItems.find((item) => item.id === hashId);
      pendingNavigationRef.current = hashTarget?.id ?? null;
      if (hashTarget) setActiveSection(hashTarget.id);
      if (historyFrame !== undefined) cancelAnimationFrame(historyFrame);
      historyFrame = requestAnimationFrame(() => {
        historyFrame = undefined;
        updateActiveSection();
      });
    };

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', clearPendingNavigation, { passive: true });
    window.addEventListener('touchstart', clearPendingNavigation, { passive: true });
    window.addEventListener('keydown', handleScrollKey);
    window.addEventListener('hashchange', syncHistoryNavigation);
    window.addEventListener('popstate', syncHistoryNavigation);
    document.addEventListener('scrollend', finishPendingNavigation);
    const initialFrame = requestAnimationFrame(updateActiveSection);
    return () => {
      cancelAnimationFrame(initialFrame);
      if (historyFrame !== undefined) cancelAnimationFrame(historyFrame);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', clearPendingNavigation);
      window.removeEventListener('touchstart', clearPendingNavigation);
      window.removeEventListener('keydown', handleScrollKey);
      window.removeEventListener('hashchange', syncHistoryNavigation);
      window.removeEventListener('popstate', syncHistoryNavigation);
      document.removeEventListener('scrollend', finishPendingNavigation);
    };
  }, [updateActiveSection]);

  return { activeSection, handleNavigationClick };
};
