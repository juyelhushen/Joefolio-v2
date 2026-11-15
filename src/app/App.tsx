import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import './App.css';
import AboutSection from '../features/about/components/AboutSection';
import ProjectsSection from '../features/projects/components/ProjectsSection';
import CosmicContactSection from '../features/contact/components/CosmicContactSection';
import CosmicFooter from '../components/layout/Footer/CosmicFooter';
import Navbar from '../components/layout/Navbar/Navbar';
import LoadBoundary from '../components/common/LoadBoundary';
import { useActiveSection } from './hooks/useActiveSection';
import { useBackendHealth } from './hooks/useBackendHealth';
import { useSystemReducedMotion } from '../hooks/useSystemReducedMotion';
import { impactStats } from '../features/impact/data/impact';
import { scheduleAfterIdle } from '../lib/scheduleAfterIdle';

const ImpactStrip = lazy(() => import('../features/impact/components/ImpactStrip'));
const PortfolioAssistant = lazy(
  () => import('../features/assistant/components/PortfolioAssistant'),
);
const loadPalette = () => import('../features/command-palette/components/CommandPalette');
const CommandPalette = lazy(loadPalette);

function IdleAssistant({ reduceMotion }: { reduceMotion: boolean }) {
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      scheduleAfterIdle(() => setReady(true), {
        timeout: 2500,
        fallbackDelay: 1200,
      }),
    [],
  );

  return ready ? (
    <LoadBoundary label="the optional assistant" fallback={null}>
      <Suspense fallback={null}>
        <PortfolioAssistant reduceMotion={reduceMotion} />
      </Suspense>
    </LoadBoundary>
  ) : null;
}

export default function App() {
  const [paletteOpener, setPaletteOpener] = useState<HTMLElement | null>(null);
  const backendStatus = useBackendHealth();
  const { activeSection, handleNavigationClick } = useActiveSection();
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useSystemReducedMotion();
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
      <main id="main-content">
        <section className="hero-section page-column" id="home" aria-labelledby="home-title">
          <h1 id="home-title" ref={homeHeadingRef} tabIndex={-1}>
            Juyel Hushen
          </h1>
          <p className="hero-subtitle">Software Engineer building reliable backend systems.</p>
          <p className="hero-description">
            I work across the stack with a backend focus on clear APIs, system integration,
            persistence, and dependable asynchronous workflows.
          </p>
          <p className="hero-profile">Java · Spring Boot · Kafka · Bengaluru, India</p>
          <p className="hero-links">
            <a href="#projects">See my work</a>
            <a href="#contact">Get in touch</a>
          </p>
        </section>
        <AboutSection />
        {impactStats.length > 0 && (
          <Suspense fallback={null}>
            <ImpactStrip reduceMotion={reduceMotion} />
          </Suspense>
        )}
        <ProjectsSection />
        <CosmicContactSection backendStatus={backendStatus} />
      </main>
      <CosmicFooter homeHeadingRef={homeHeadingRef} />
      <IdleAssistant reduceMotion={reduceMotion} />
    </div>
  );
}
