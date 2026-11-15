import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import './App.css';
import AboutSection from '../features/about/components/AboutSection';
import ProjectsSection from '../features/projects/components/ProjectsSection';
import CosmicContactSection from '../features/contact/components/CosmicContactSection';
import CosmicFooter from '../components/layout/Footer/CosmicFooter';
import Navbar from '../components/layout/Navbar/Navbar';
import SocialLinks from '../components/layout/SocialLinks';
import LoadBoundary from '../components/common/LoadBoundary';
import { useActiveSection } from './hooks/useActiveSection';
import { useBackendHealth } from './hooks/useBackendHealth';
import { useSystemReducedMotion } from '../hooks/useSystemReducedMotion';
import { useDesktopLayout } from '../hooks/useDesktopLayout';
import { impactStats } from '../features/impact/data/impact';

const ImpactStrip = lazy(() => import('../features/impact/components/ImpactStrip'));
const PortfolioAssistant = lazy(
  () => import('../features/assistant/components/PortfolioAssistant'),
);
const loadPalette = () => import('../features/command-palette/components/CommandPalette');
const CommandPalette = lazy(loadPalette);

export default function App() {
  const [paletteOpener, setPaletteOpener] = useState<HTMLElement | null>(null);
  const [assistantOpener, setAssistantOpener] = useState<HTMLButtonElement | null>(null);
  const backendStatus = useBackendHealth();
  const { activeSection, handleNavigationClick } = useActiveSection();
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useSystemReducedMotion();
  const isDesktop = useDesktopLayout();
  const closeAssistant = useCallback(() => setAssistantOpener(null), []);
  const assistantButton = (placement: 'header' | 'floating') => (
    <button
      className={`button assistant-trigger assistant-trigger-${placement}`}
      type="button"
      aria-label="Open portfolio assistant"
      aria-expanded={assistantOpener !== null}
      aria-controls={assistantOpener ? 'portfolio-assistant-panel' : undefined}
      onClick={(event) => {
        if (assistantOpener) closeAssistant();
        else setAssistantOpener(event.currentTarget);
      }}
    >
      <MessageCircle aria-hidden="true" />
    </button>
  );
  const openPalette = () => {
    setPaletteOpener(
      (current) =>
        current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null),
    );
  };

  return (
    <div className="site-shell">
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
        assistantButton={assistantButton('header')}
        socialLinks={isDesktop ? <SocialLinks /> : undefined}
        homeHeadingRef={homeHeadingRef}
      />
      {paletteOpener && (
        <LoadBoundary label="search" fallback={null}>
          <Suspense fallback={null}>
            <CommandPalette
              opener={paletteOpener}
              onClose={() => setPaletteOpener(null)}
              onNavigate={handleNavigationClick}
              reduceMotion={reduceMotion}
            />
          </Suspense>
        </LoadBoundary>
      )}
      <div className="content-shell">
        <main id="main-content">
          <section className="hero-section page-column" id="home" aria-labelledby="home-title">
            <h1 id="home-title" ref={homeHeadingRef} tabIndex={-1}>
              Juyel Hushen
            </h1>
            <p className="hero-subtitle">
              <span>Software Engineer building reliable backend systems.</span>
              <a href="#projects">See my work</a>
              <a href="#contact">Get in touch</a>
            </p>
          </section>
          <AboutSection />
          {impactStats.length > 0 && (
            <Suspense fallback={null}>
              <ImpactStrip />
            </Suspense>
          )}
          <ProjectsSection />
          <CosmicContactSection backendStatus={backendStatus} />
        </main>
        <CosmicFooter homeHeadingRef={homeHeadingRef} showSocial={!isDesktop} />
      </div>
      {assistantButton('floating')}
      {assistantOpener && (
        <LoadBoundary
          label="the optional assistant"
          fallback={<p role="alert">The assistant could not load.</p>}
        >
          <Suspense
            fallback={
              <p className="assistant-loading-status" role="status">
                Loading assistant…
              </p>
            }
          >
            <PortfolioAssistant opener={assistantOpener} onClose={closeAssistant} />
          </Suspense>
        </LoadBoundary>
      )}
    </div>
  );
}
