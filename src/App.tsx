import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Menu, Sparkles, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import AiLabSection from './components/AiLabSection';
import CosmicContactSection from './components/CosmicContactSection';
import CosmicFooter from './components/CosmicFooter';
import CosmicMeshBackground from './components/CosmicMeshBackground';
import ExperienceTimeline from './components/ExperienceTimeline';
import PortfolioAssistant from './components/PortfolioAssistant';
import ProjectsSection from './components/ProjectsSection';
import ScrollReveal from './components/ScrollReveal';
import SkillsSection from './components/SkillsSection';
import Starfield from './components/Starfield';

const navItems = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Experience', id: 'experience' },
  { label: 'Skills', id: 'skills' },
  { label: 'Projects', id: 'projects' },
  { label: 'AI Lab', id: 'ai-lab' },
  { label: 'Contact', id: 'contact' },
] as const;

function Planet() {
  return (
    <div className="planet-scene" aria-hidden="true">
      <div className="planet-orbit orbit-one" />
      <div className="planet-orbit orbit-two" />
      <div className="ringed-planet">
        <div className="planet-shadow" />
      </div>
      <div className="small-planet small-planet-one" />
      <div className="small-planet small-planet-two" />
      <div className="nebula nebula-one" />
      <div className="nebula nebula-two" />
    </div>
  );
}

export default function App() {
  const initialHashTarget = navItems.find(
    (item) => item.id === (typeof window === 'undefined' ? '' : window.location.hash.slice(1)),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof navItems)[number]['id']>(
    initialHashTarget?.id ?? 'home',
  );
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const pendingNavigationRef = useRef<(typeof navItems)[number]['id'] | null>(
    initialHashTarget?.id ?? null,
  );
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();
  const closeMenu = () => setMenuOpen(false);

  const updateActiveSection = useCallback(() => {
    const header = document.querySelector<HTMLElement>('.site-header');
    const activationLine =
      (header?.getBoundingClientRect().bottom ?? 0) + 16 + Math.min(140, window.innerHeight * 0.2);
    const pendingId = pendingNavigationRef.current;
    if (pendingId) {
      const pendingSection = document.getElementById(pendingId);
      if (pendingSection && pendingSection.getBoundingClientRect().top > activationLine) return;
      pendingNavigationRef.current = null;
    }

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
    closeMenu();
  };

  useEffect(() => {
    const clearPendingNavigation = () => {
      pendingNavigationRef.current = null;
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
    window.addEventListener('resize', updateActiveSection);
    window.addEventListener('wheel', clearPendingNavigation, { passive: true });
    window.addEventListener('touchstart', clearPendingNavigation, { passive: true });
    window.addEventListener('keydown', handleScrollKey);
    window.addEventListener('hashchange', syncHistoryNavigation);
    window.addEventListener('popstate', syncHistoryNavigation);
    const initialFrame = requestAnimationFrame(updateActiveSection);
    return () => {
      cancelAnimationFrame(initialFrame);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
      window.removeEventListener('wheel', clearPendingNavigation);
      window.removeEventListener('touchstart', clearPendingNavigation);
      window.removeEventListener('keydown', handleScrollKey);
      window.removeEventListener('hashchange', syncHistoryNavigation);
      window.removeEventListener('popstate', syncHistoryNavigation);
    };
  }, [updateActiveSection]);

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    const updateIndicator = () => {
      const activeLink = navigation.querySelector<HTMLAnchorElement>(
        `[data-nav-id="${activeSection}"]`,
      );
      if (!activeLink) return;
      navigation.style.setProperty(
        '--active-indicator-left',
        `${activeLink.offsetLeft + (activeLink.offsetWidth - 17) / 2}px`,
      );
    };

    updateIndicator();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateIndicator);
    observer?.observe(navigation);
    document.fonts?.ready.then(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeSection, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="site-shell">
      <CosmicMeshBackground />
      <Starfield />
      <div className="space-grain" aria-hidden="true" />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a
          href="#home"
          className="brand"
          aria-label="Juyel Hushen home"
          onClick={() => handleNavigationClick('home')}
        >
          <span className="brand-mark">
            <span className="brand-mark-text">
              JH<span className="brand-spark">•</span>
            </span>
            <span className="brand-orbit" aria-hidden="true">
              <span />
            </span>
          </span>
          <span className="brand-name">JUYEL HUSHEN</span>
        </a>
        <nav
          ref={navigationRef}
          className={`main-nav ${menuOpen ? 'is-open' : ''}`}
          id="main-navigation"
          aria-label="Main navigation"
        >
          {navItems.map(({ label, id }) => (
            <a
              key={id}
              href={`#${id}`}
              data-nav-id={id}
              className={activeSection === id ? 'active' : ''}
              aria-current={activeSection === id ? 'location' : undefined}
              onClick={() => handleNavigationClick(id)}
            >
              {label}
            </a>
          ))}
          <span className="main-nav-indicator" aria-hidden="true" />
        </nav>
        <a className="header-cta" href="#contact" onClick={() => handleNavigationClick('contact')}>
          <span>Get in Touch</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <button
          ref={menuToggleRef}
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <main id="main-content">
        <section className="hero section-wrap" id="home">
          <Planet />
          <motion.div
            className="hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
          >
            <div className="eyebrow">
              <span className="eyebrow-dot" /> SOFTWARE ENGINEER{' '}
              <span className="eyebrow-separator">/</span> FULL-STACK{' '}
              <span className="eyebrow-separator">/</span> AI ENGINEERING
            </div>
            <h1 ref={homeHeadingRef} id="home-title" tabIndex={-1}>
              I build software
              <br />
              that solves <em>real problems.</em>
            </h1>
            <p className="hero-intro">
              From reliable backend systems to thoughtful user experiences and emerging AI-powered
              products — I turn ideas into useful software.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#projects">
                Explore Projects <ArrowRight size={17} />
              </a>
              <a className="button button-quiet" href="#contact">
                Let’s connect <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="hero-proof">
              <div>
                <span className="proof-index">01</span>
                <span>
                  FULL-STACK
                  <br />
                  DEVELOPMENT
                </span>
              </div>
              <div>
                <span className="proof-index">02</span>
                <span>
                  BACKEND
                  <br />
                  ENGINEERING
                </span>
              </div>
              <div>
                <span className="proof-index">03</span>
                <span>
                  AI SYSTEMS
                  <br />
                  EXPLORATION
                </span>
              </div>
            </div>
          </motion.div>
          <div className="hero-side-note">
            <span className="note-line" /> A CURIOSITY-DRIVEN ENGINEER{' '}
            <span className="note-coordinate">12° 34' / 56° 78'</span>
          </div>
          <a className="scroll-cue" href="#skills">
            <span>SCROLL TO EXPLORE</span>
            <ArrowDownRight size={19} />
          </a>
          <div className="hero-bottom-glow" aria-hidden="true" />
        </section>

        <section className="manifesto section-wrap" id="about" aria-labelledby="about-title">
          <ScrollReveal className="manifesto-symbol">
            <Sparkles size={24} strokeWidth={1.2} />
            <span>FIELD NOTES / 002</span>
          </ScrollReveal>
          <ScrollReveal className="manifesto-copy" delay={0.08}>
            <h2 id="about-title">
              Build end to end.
              <br />
              <em>Keep the seams clear.</em>
            </h2>
            <p>
              I work across the stack with a backend focus on clear APIs, system integration,
              persistence, and dependable asynchronous workflows. My project work also explores RAG,
              LLM applications, and agentic systems, with attention to inspectable retrieval, tools,
              and verification.
            </p>
          </ScrollReveal>
          <ScrollReveal className="manifesto-link-reveal" delay={0.14}>
            <a className="text-link" href="#skills">
              Explore my toolkit <ArrowUpRight size={16} />
            </a>
          </ScrollReveal>
        </section>

        <section
          className="experience-section section-wrap"
          id="experience"
          aria-labelledby="experience-title"
        >
          <ScrollReveal className="section-heading career-heading">
            <div>
              <span className="section-kicker">CAREER ODYSSEY / 003</span>
              <h2 id="experience-title">
                Every chapter <em>built something.</em>
              </h2>
            </div>
            <p>
              Four career chapters, from a Java Developer Internship through to my current Software
              Engineer II role.
            </p>
          </ScrollReveal>
          <ScrollReveal className="career-odyssey-reveal">
            <ExperienceTimeline reduceMotion={reduceMotion ?? false} />
          </ScrollReveal>
        </section>

        <SkillsSection reduceMotion={reduceMotion ?? false} />

        <ProjectsSection reduceMotion={reduceMotion ?? false} />

        <AiLabSection />

        <CosmicContactSection reduceMotion={reduceMotion ?? false} />
      </main>
      <CosmicFooter homeHeadingRef={homeHeadingRef} reducedMotion={reduceMotion ?? false} />
      <PortfolioAssistant />
    </div>
  );
}
