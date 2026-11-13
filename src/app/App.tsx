import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { LazyMotion } from 'motion/react';
import { useSystemReducedMotion } from '../hooks/useSystemReducedMotion';
import './App.css';
import CosmicMeshBackground from '../components/background/CosmicMeshBackground/CosmicMeshBackground';
import HeroSection from '../sections/Hero/index';
import Starfield from '../components/background/Starfield/Starfield';
import Navbar from '../components/layout/Navbar/Navbar';
import LoadBoundary from '../components/common/LoadBoundary';
import { useActiveSection } from './hooks/useActiveSection';
import { useBackendHealth } from './hooks/useBackendHealth';
import CosmicMagnifyingCursor from '../components/cursor/CosmicMagnifyingCursor';
import CosmicScrollProgress from '../components/common/CosmicScrollProgress';
import { impactStats } from '../features/impact/data/impact';
import { scheduleAfterIdle } from '../lib/scheduleAfterIdle';
import { EnvironmentProvider } from '../components/background/EnvironmentContext';

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
const loadPalette = () => import('../features/command-palette/components/CommandPalette');
const CommandPalette = lazy(loadPalette);
const loadMotionFeatures = () => import('../lib/motion-features').then((module) => module.default);

function LazySection({
  id,
  className,
  label,
  children,
}: {
  id: string;
  className: string;
  label: string;
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
        <LoadBoundary
          label={label}
          fallback={
            <section
              id={id}
              className={`lazy-section-placeholder ${className} section-wrap load-error`}
              role="alert"
            >
              <h2>{label} could not load</h2>
              <p>The rest of the portfolio is still available. Reload to try this section again.</p>
              <a className="button button-secondary" href="">
                Reload portfolio
              </a>
            </section>
          }
        >
          <Suspense
            fallback={
              <section
                id={id}
                className={`lazy-section-placeholder ${className} section-wrap`}
                aria-busy="true"
                aria-label={`Loading ${label}`}
              >
                <div className="section-skeleton" aria-hidden="true">
                  <span className="skeleton-kicker" />
                  <span className="skeleton-heading" />
                  <span className="skeleton-line" />
                  <span className="skeleton-line skeleton-line-short" />
                </div>
              </section>
            }
          >
            {children}
          </Suspense>
        </LoadBoundary>
      ) : (
        <div id={id} className={`lazy-section-placeholder ${className}`} aria-busy="true" />
      )}
    </div>
  );
}

function IdleAssistant({ reduceMotion }: { reduceMotion: boolean }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return scheduleAfterIdle(() => setReady(true), {
      timeout: 2500,
      fallbackDelay: 1200,
    });
  }, []);

  return ready ? (
    <LoadBoundary label="the optional assistant" fallback={null}>
      <Suspense fallback={null}>
        <PortfolioAssistant reduceMotion={reduceMotion} />
      </Suspense>
    </LoadBoundary>
  ) : null;
}

export default function App() {
  const [paletteOpener, setPaletteOpener] = useState<{ element: HTMLElement | null } | null>(null);
  const backendStatus = useBackendHealth();
  const { activeSection, handleNavigationClick, isScrolled } = useActiveSection();
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useSystemReducedMotion();
  useLayoutEffect(() => {
    window.__PORTFOLIO_STARTUP__?.ready();
  }, []);
  const openPalette = () => {
    setPaletteOpener(
      (current) =>
        current ?? {
          element: document.activeElement instanceof HTMLElement ? document.activeElement : null,
        },
    );
  };

  return (
    <LazyMotion features={loadMotionFeatures}>
      <EnvironmentProvider>
        <div className="site-shell">
          <CosmicMeshBackground />
          <Starfield />
          <div className="space-grain" aria-hidden="true" />
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Navbar
            activeSection={activeSection}
            scrolled={isScrolled}
            onNavigate={handleNavigationClick}
            onSearch={openPalette}
            onSearchIntent={() => {
              void loadPalette().catch((error: unknown) =>
                console.error('Could not prefetch search.', error),
              );
            }}
          />
          {paletteOpener && (
            <LoadBoundary
              label="search"
              fallback={
                <div className="load-error section-wrap" role="alert">
                  <p>Search could not load. Use the section navigation or reload to try again.</p>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => setPaletteOpener(null)}
                  >
                    Dismiss
                  </button>
                </div>
              }
            >
              <Suspense fallback={null}>
                <CommandPalette
                  opener={paletteOpener.element}
                  onClose={() => setPaletteOpener(null)}
                  onNavigate={handleNavigationClick}
                  reduceMotion={reduceMotion}
                />
              </Suspense>
            </LoadBoundary>
          )}

          <main id="main-content">
            <HeroSection reduceMotion={reduceMotion} headingRef={homeHeadingRef} />
            <LazySection id="about" className="about" label="About">
              <AboutSection />
            </LazySection>
            {impactStats.length > 0 && (
              <LoadBoundary label="the optional impact summary" fallback={null}>
                <Suspense fallback={<div className="impact-lazy-placeholder" aria-hidden="true" />}>
                  <ImpactStrip reduceMotion={reduceMotion} />
                </Suspense>
              </LoadBoundary>
            )}
            <LazySection id="experience" className="experience" label="Experience">
              <ExperienceSection reduceMotion={reduceMotion} />
            </LazySection>
            <LazySection id="skills" className="skills" label="Skills">
              <SkillsSection reduceMotion={reduceMotion} />
            </LazySection>

            <LazySection id="projects" className="projects" label="Projects">
              <ProjectsSection reduceMotion={reduceMotion} />
            </LazySection>

            <LazySection id="ai-lab" className="ai-lab" label="AI Lab">
              <AiLabSection />
            </LazySection>

            <LazySection id="contact" className="contact" label="Contact">
              <CosmicContactSection reduceMotion={reduceMotion} backendStatus={backendStatus} />
            </LazySection>
          </main>
          <LazySection id="footer" className="footer" label="Footer">
            <CosmicFooter homeHeadingRef={homeHeadingRef} reducedMotion={reduceMotion} />
          </LazySection>
          <IdleAssistant reduceMotion={reduceMotion} />
          <CosmicMagnifyingCursor />
          <CosmicScrollProgress />
        </div>
      </EnvironmentProvider>
    </LazyMotion>
  );
}
