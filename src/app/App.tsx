import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { domAnimation, LazyMotion } from 'motion/react';
import './App.css';
import CosmicMeshBackground from '../components/background/CosmicMeshBackground/CosmicMeshBackground';
import HeroSection from '../sections/Hero/index';
import Starfield from '../components/background/Starfield/Starfield';
import Navbar from '../components/layout/Navbar/Navbar';
import { useUniverseIntro } from './hooks/useUniverseIntro';
import { useActiveSection } from './hooks/useActiveSection';
import { useBackendHealth } from './hooks/useBackendHealth';
import CosmicMagnifyingCursor from '../components/cursor/CosmicMagnifyingCursor';
import CosmicScrollProgress from '../components/common/CosmicScrollProgress';
import { useEffectsPreference } from '../hooks/useEffectsPreference';
import { impactStats } from '../features/impact/data/impact';
import { scheduleAfterIdle } from '../lib/scheduleAfterIdle';

const SkillsSection = lazy(() => import('../features/skills/components/SkillsSection'));
const AboutSection = lazy(() => import('../features/about/components/AboutSection'));
const ImpactStrip = lazy(() => import('../features/impact/components/ImpactStrip'));
const ExperienceSection = lazy(() => import('../features/experience/components/ExperienceSection'));
const ProjectsSection = lazy(() => import('../features/projects/components/ProjectsSection'));
const AiLabSection = lazy(() => import('../features/ai-lab/components/AiLabSection'));
const CosmicContactSection = lazy(
  () => import('../features/contact/components/CosmicContactSection'),
);
const CosmicFooter = lazy(() => import('../components/layout/Footer/CosmicFooter'));
const PortfolioAssistant = lazy(
  () => import('../features/assistant/components/PortfolioAssistant'),
);
const UniverseIntro = lazy(() => import('../components/intro/UniverseIntro'));
const loadPalette = () => import('../features/command-palette/components/CommandPalette');
const CommandPalette = lazy(loadPalette);

function LazySection({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(
    () =>
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      window.location.hash === `#${id}` ||
      window.location.hash.startsWith(`#${id}/`),
  );
  useEffect(() => {
    if (loaded) return;
    const shell = shellRef.current;
    if (!shell) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '1000px 0px' },
    );
    observer.observe(shell);
    const activateHash = () => {
      if (window.location.hash === `#${id}` || window.location.hash.startsWith(`#${id}/`))
        setLoaded(true);
    };
    window.addEventListener('hashchange', activateHash);
    window.addEventListener('popstate', activateHash);
    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', activateHash);
      window.removeEventListener('popstate', activateHash);
    };
  }, [id, loaded]);

  useEffect(() => {
    if (
      !loaded ||
      (window.location.hash !== `#${id}` && !window.location.hash.startsWith(`#${id}/`))
    )
      return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [id, loaded]);

  return (
    <div className="lazy-section-shell" ref={shellRef}>
      {loaded ? (
        <Suspense fallback={<div id={id} className={`lazy-section-placeholder ${className}`} />}>
          {children}
        </Suspense>
      ) : (
        <div id={id} className={`lazy-section-placeholder ${className}`} aria-busy="true" />
      )}
    </div>
  );
}

function IdleAssistant() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return scheduleAfterIdle(() => setReady(true), {
      timeout: 2500,
      fallbackDelay: 1200,
    });
  }, []);

  return ready ? (
    <Suspense fallback={null}>
      <PortfolioAssistant />
    </Suspense>
  ) : null;
}

export default function App() {
  const [paletteOpener, setPaletteOpener] = useState<{ element: HTMLElement | null } | null>(null);
  const backendStatus = useBackendHealth();
  const { showUniverseIntro, completeUniverseIntro } = useUniverseIntro();
  const { activeSection, handleNavigationClick } = useActiveSection();
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const { reducedEffects, setReducedEffects } = useEffectsPreference();
  const openPalette = () => {
    setPaletteOpener(
      (current) =>
        current ?? {
          element: document.activeElement instanceof HTMLElement ? document.activeElement : null,
        },
    );
  };

  useLayoutEffect(() => {
    document.documentElement.dataset.effectsReduced = String(reducedEffects);
  }, [reducedEffects]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="site-shell" data-intro-active={showUniverseIntro ? 'true' : undefined}>
        <CosmicMeshBackground paused={showUniverseIntro} />
        <Starfield paused={showUniverseIntro} />
        <div className="space-grain" aria-hidden="true" />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Navbar
          activeSection={activeSection}
          onNavigate={handleNavigationClick}
          onSearch={openPalette}
          onSearchIntent={() => {
            void loadPalette().catch((error: unknown) =>
              console.error('Could not prefetch search.', error),
            );
          }}
        />
        {paletteOpener && (
          <Suspense fallback={null}>
            <CommandPalette
              opener={paletteOpener.element}
              onClose={() => setPaletteOpener(null)}
              onNavigate={handleNavigationClick}
              reducedEffects={reducedEffects}
              onToggleEffects={() => setReducedEffects(!reducedEffects)}
            />
          </Suspense>
        )}

        <main id="main-content">
          <HeroSection reduceMotion={reducedEffects} headingRef={homeHeadingRef} />
          <LazySection id="about" className="about">
            <AboutSection />
          </LazySection>
          {impactStats.length > 0 && (
            <Suspense fallback={<div className="impact-lazy-placeholder" aria-hidden="true" />}>
              <ImpactStrip reduceMotion={reducedEffects} />
            </Suspense>
          )}
          <LazySection id="experience" className="experience">
            <ExperienceSection reduceMotion={reducedEffects} />
          </LazySection>
          <LazySection id="skills" className="skills">
            <SkillsSection reduceMotion={reducedEffects} />
          </LazySection>

          <LazySection id="projects" className="projects">
            <ProjectsSection reduceMotion={reducedEffects} />
          </LazySection>

          <LazySection id="ai-lab" className="ai-lab">
            <AiLabSection />
          </LazySection>

          <LazySection id="contact" className="contact">
            <CosmicContactSection reduceMotion={reducedEffects} backendStatus={backendStatus} />
          </LazySection>
        </main>
        <LazySection id="footer" className="footer">
          <CosmicFooter homeHeadingRef={homeHeadingRef} reducedMotion={reducedEffects} />
        </LazySection>
        <IdleAssistant />
        <CosmicMagnifyingCursor />
        <CosmicScrollProgress />
        {showUniverseIntro && (
          <Suspense fallback={null}>
            <UniverseIntro onComplete={completeUniverseIntro} />
          </Suspense>
        )}
      </div>
    </LazyMotion>
  );
}
