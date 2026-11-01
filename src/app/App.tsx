import { useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import './App.css';
import AiLabSection from '../features/ai-lab/components/AiLabSection';
import CosmicContactSection from '../features/contact/components/CosmicContactSection';
import CosmicFooter from '../components/layout/Footer/CosmicFooter';
import CosmicMeshBackground from '../components/background/CosmicMeshBackground/CosmicMeshBackground';
import ExperienceSection from '../features/experience/components/ExperienceSection';
import HeroSection from '../sections/Hero/index';
import PortfolioAssistant from '../features/assistant/components/PortfolioAssistant';
import ProjectsSection from '../features/projects/components/ProjectsSection';
import AboutSection from '../features/about/components/AboutSection';
import SkillsSection from '../features/skills/components/SkillsSection';
import Starfield from '../components/background/Starfield/Starfield';
import Navbar from '../components/layout/Navbar/Navbar';
import UniverseIntro from '../components/intro/UniverseIntro';

import { useUniverseIntro } from './hooks/useUniverseIntro';
import { useActiveSection } from './hooks/useActiveSection';
import { useBackendHealth } from './hooks/useBackendHealth';
import CosmicMagnifyingCursor from '../components/cursor/CosmicMagnifyingCursor';
import CosmicScrollProgress from '../components/common/CosmicScrollProgress';

export default function App() {
  useBackendHealth();
  const { showUniverseIntro, completeUniverseIntro } = useUniverseIntro();
  const { activeSection, handleNavigationClick } = useActiveSection();
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();

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
      <CosmicMagnifyingCursor />
      <CosmicScrollProgress />
      {showUniverseIntro && <UniverseIntro onComplete={completeUniverseIntro} />}
    </div>
  );
}
