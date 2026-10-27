import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import './App.css';
import AiLabSection from '../sections/AiLab/AiLabSection';
import CosmicContactSection from '../sections/Contact/CosmicContactSection';
import CosmicFooter from '../components/layout/Footer/CosmicFooter';
import CosmicMeshBackground from '../components/background/CosmicMeshBackground/CosmicMeshBackground';
import ExperienceSection from '../sections/Experience/ExperienceSection';
import HeroSection from '../sections/Hero';
import PortfolioAssistant from '../components/PortfolioAssistant';
import ProjectsSection from '../sections/Projects/ProjectsSection';
import AboutSection from '../sections/About/AboutSection';
import SkillsSection from '../sections/Skills/SkillsSection';
import Starfield from '../components/background/Starfield/Starfield';
import { navItems } from '../components/layout/Navbar/navItems';
import Navbar from '../components/layout/Navbar/Navbar';
import UniverseIntro from '../components/intro/UniverseIntro';

const introSessionKey = 'joefolio-universe-intro-seen';

function shouldShowUniverseIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return false;
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('intro') === '1')
    return true;

  try {
    return window.sessionStorage.getItem(introSessionKey) !== 'true';
  } catch (error) {
    console.warn(
      'Could not read the intro session flag; showing the intro for this page load.',
      error,
    );
    return true;
  }
}

export default function App() {
  const [showUniverseIntro, setShowUniverseIntro] = useState(shouldShowUniverseIntro);
  const initialHashTarget = navItems.find(
    (item) => item.id === (typeof window === 'undefined' ? '' : window.location.hash.slice(1)),
  );
  const [activeSection, setActiveSection] = useState<(typeof navItems)[number]['id']>(
    initialHashTarget?.id ?? 'home',
  );
  const pendingNavigationRef = useRef<(typeof navItems)[number]['id'] | null>(
    initialHashTarget?.id ?? null,
  );
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();

  const completeUniverseIntro = useCallback(() => {
    setShowUniverseIntro(false);
    try {
      window.sessionStorage.setItem(introSessionKey, 'true');
    } catch (error) {
      console.warn(
        'Could not save the intro session flag; it may replay on a later page load.',
        error,
      );
    }
  }, []);

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
      requestAnimationFrame(updateActiveSection);
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

  return (
    <div className="site-shell" data-intro-active={showUniverseIntro ? 'true' : undefined}>
      <CosmicMeshBackground paused={showUniverseIntro} />
      <Starfield paused={showUniverseIntro} />
      <div className="space-grain" aria-hidden="true" />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar activeSection={activeSection} onNavigate={handleNavigationClick} />

      <main id="main-content">
        <HeroSection reduceMotion={reduceMotion ?? false} headingRef={homeHeadingRef} />
        <AboutSection />
        <ExperienceSection reduceMotion={reduceMotion ?? false} />
        <SkillsSection reduceMotion={reduceMotion ?? false} />

        <ProjectsSection reduceMotion={reduceMotion ?? false} />

        <AiLabSection />

        <CosmicContactSection reduceMotion={reduceMotion ?? false} />
      </main>
      <CosmicFooter homeHeadingRef={homeHeadingRef} reducedMotion={reduceMotion ?? false} />
      <PortfolioAssistant />
      {showUniverseIntro && <UniverseIntro onComplete={completeUniverseIntro} />}
    </div>
  );
}
