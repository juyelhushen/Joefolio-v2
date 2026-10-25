import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Mail, Menu, Sparkles, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import AiLabSection from './components/AiLabSection';
import CosmicContactSection from './components/CosmicContactSection';
import CosmicFooter from './components/CosmicFooter';
import ExperienceTimeline from './components/ExperienceTimeline';
import PortfolioAssistant from './components/PortfolioAssistant';
import ProjectsSection from './components/ProjectsSection';
import SkillsSection from './components/SkillsSection';
import Starfield from './components/Starfield';

const navItems = [
  ['Home', '#home'],
  ['About', '#about'],
  ['Experience', '#experience'],
  ['Skills', '#skills'],
  ['Projects', '#projects'],
  ['AI Lab', '#ai-lab'],
  ['Contact', '#contact'],
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();
  const closeMenu = () => setMenuOpen(false);

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
      <Starfield />
      <div className="space-grain" aria-hidden="true" />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a href="#home" className="brand" aria-label="Juyel Hushen home" onClick={closeMenu}>
          <span className="brand-mark">
            JH<span className="brand-spark">•</span>
          </span>
          <span className="brand-name">JUYEL HUSHEN</span>
        </a>
        <nav
          className={`main-nav ${menuOpen ? 'is-open' : ''}`}
          id="main-navigation"
          aria-label="Main navigation"
        >
          {navItems.map(([label, href], index) => (
            <a key={label} href={href} className={index === 0 ? 'active' : ''} onClick={closeMenu}>
              {label}
            </a>
          ))}
        </nav>
        <a className="header-cta" href="#contact">
          <Mail size={15} /> <span>Contact</span>
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
          <div className="manifesto-symbol">
            <Sparkles size={24} strokeWidth={1.2} />
            <span>FIELD NOTES / 002</span>
          </div>
          <div className="manifesto-copy">
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
          </div>
          <a className="text-link" href="#skills">
            Explore my toolkit <ArrowUpRight size={16} />
          </a>
        </section>

        <section
          className="experience-section section-wrap"
          id="experience"
          aria-labelledby="experience-title"
        >
          <div className="section-heading career-heading">
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
          </div>
          <ExperienceTimeline reduceMotion={reduceMotion ?? false} />
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
