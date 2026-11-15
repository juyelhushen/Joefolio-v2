import { useCallback, useEffect, useRef, useState } from 'react';
import { navItems } from '../../components/layout/Navbar/navItems';
import { getNavigationTarget, type NavigationId } from '../navigation-target';

export const useActiveSection = () => {
  const initialHashTarget =
    typeof window === 'undefined' ? null : getNavigationTarget(window.location.hash);
  const [activeSection, setActiveSection] = useState<NavigationId>(initialHashTarget ?? 'home');
  const activeSectionRef = useRef(activeSection);
  const [isScrolled, setIsScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 64,
  );
  const selectSection = useCallback((id: NavigationId) => {
    activeSectionRef.current = id;
    setActiveSection((current) => (current === id ? current : id));
  }, []);
  const pendingNavigationRef = useRef<NavigationId | null>(initialHashTarget);
  const scrollLegacyHash = () => {
    const hashId = window.location.hash.replace(/^#/, '').split('/')[0];
    if (!['experience', 'skills', 'ai-lab'].includes(hashId)) return;
    const target = hashId === 'ai-lab' ? 'projects' : hashId;
    if (target) document.getElementById(target)?.scrollIntoView({ block: 'start' });
  };
  const updateActiveSection = useCallback(() => {
    setIsScrolled((current) => window.scrollY > (current ? 24 : 64));
    if (window.location.hash.startsWith('#projects/')) {
      selectSection('projects');
      return;
    }
    const header = document.querySelector<HTMLElement>('.site-header');
    const headerBottom =
      window.innerWidth <= 980 ? (header?.getBoundingClientRect().bottom ?? 0) : 0;
    const activationLine = headerBottom + 16 + Math.min(140, window.innerHeight * 0.2);
    // Keep an explicit navigation target active until scrolling settles or the user scrolls again.
    if (pendingNavigationRef.current) return;

    const page = document.documentElement;
    if (
      page.scrollHeight > window.innerHeight &&
      window.scrollY + window.innerHeight >= page.scrollHeight - 2
    ) {
      selectSection('contact');
      return;
    }

    let currentSection: NavigationId = 'home';
    for (const item of navItems) {
      const section = document.getElementById(item.id);
      if (section && section.getBoundingClientRect().top <= activationLine)
        currentSection = item.id;
    }
    const previousIndex = navItems.findIndex((item) => item.id === activeSectionRef.current);
    const nextIndex = navItems.findIndex((item) => item.id === currentSection);
    // A small dead band prevents scroll/section-height jitter from toggling adjacent items.
    if (
      nextIndex > previousIndex &&
      (document.getElementById(currentSection)?.getBoundingClientRect().top ?? Infinity) >
        activationLine - 12
    )
      return;
    if (
      nextIndex < previousIndex &&
      (document.getElementById(activeSectionRef.current)?.getBoundingClientRect().top ??
        Infinity) <=
        activationLine + 12
    )
      return;
    selectSection(currentSection);
  }, [selectSection]);

  const handleNavigationClick = (id: NavigationId) => {
    pendingNavigationRef.current = id;
    selectSection(id);
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
      const hashTarget = getNavigationTarget(window.location.hash);
      pendingNavigationRef.current = hashTarget;
      if (hashTarget) selectSection(hashTarget);
      if (historyFrame !== undefined) cancelAnimationFrame(historyFrame);
      historyFrame = requestAnimationFrame(() => {
        historyFrame = undefined;
        scrollLegacyHash();
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
    const initialFrame = requestAnimationFrame(() => {
      scrollLegacyHash();
      updateActiveSection();
    });
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
  }, [selectSection, updateActiveSection]);

  return { activeSection, handleNavigationClick, isScrolled };
};
