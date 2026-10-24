import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Github,
  Linkedin,
  Mail,
  Menu,
  Orbit,
  Sparkles,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Starfield from './components/Starfield';
import { projects } from './data/projects';

const navItems = [
  ['Home', '#home'],
  ['About', '#about'],
  ['Experience', '#experience'],
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
            <h1>
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
          <a className="scroll-cue" href="#projects">
            <span>SCROLL TO EXPLORE</span>
            <ArrowDownRight size={19} />
          </a>
          <div className="hero-bottom-glow" aria-hidden="true" />
        </section>

        <section className="project-section section-wrap" id="projects">
          <div className="section-heading">
            <div>
              <span className="section-kicker">TRANSMISSION LOG / 001</span>
              <h2>
                Selected <em>work.</em>
              </h2>
            </div>
            <p>A few systems and products that reflect how I think, build, and keep learning.</p>
          </div>
          <div className="project-grid">
            {projects.map((project, i) => (
              <motion.article
                key={project.name}
                className={`project-card project-card-${i + 1}`}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: i * 0.08 }}
              >
                <div className="project-card-top">
                  <span className="project-number">
                    {project.number} / {project.category}
                  </span>
                  <ArrowUpRight size={19} />
                </div>
                <div className={`project-visual visual-${i + 1}`} aria-hidden="true">
                  {i === 0 ? (
                    <>
                      <div className="visual-window">
                        <div className="window-bar">
                          <i />
                          <i />
                          <i />
                        </div>
                        <div className="window-sidebar" />
                        <div className="window-main">
                          <span />
                          <span />
                          <span />
                          <b />
                        </div>
                      </div>
                      <div className="visual-orbit" />
                    </>
                  ) : i === 1 ? (
                    <>
                      <Orbit className="visual-orbit-icon" size={64} strokeWidth={0.7} />
                      <div className="visual-node node-a" />
                      <div className="visual-node node-b" />
                      <div className="visual-node node-c" />
                      <div className="visual-connection connection-a" />
                      <div className="visual-connection connection-b" />
                    </>
                  ) : (
                    <>
                      <div className="data-bars">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="data-line" />
                    </>
                  )}
                </div>
                <div className="project-content">
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <div className="tech-tags">
                    {project.stack.map((technology) => (
                      <span key={technology}>{technology}</span>
                    ))}
                  </div>
                  <div className="project-footer">
                    <span className="project-status">
                      <span /> CASE STUDY IN PREPARATION
                    </span>
                    {project.href ? (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${project.name} website`}
                      >
                        <ArrowUpRight size={16} />
                      </a>
                    ) : (
                      <a href="#contact" aria-label={`Ask about ${project.name}`}>
                        <ArrowUpRight size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          <p className="content-note">
            Project descriptions are draft copy pending codebase and contribution verification.
          </p>
        </section>

        <section className="manifesto section-wrap" id="about">
          <div className="manifesto-symbol">
            <Sparkles size={24} strokeWidth={1.2} />
            <span>FIELD NOTES / 002</span>
          </div>
          <div className="manifesto-copy">
            <h2>
              Curious by nature.
              <br />
              <em>Engineering by craft.</em>
            </h2>
            <p>
              I enjoy understanding problems deeply, designing clear interfaces between systems, and
              making software that is reliable, useful, and maintainable. Today, that means
              combining full-stack fundamentals with deliberate exploration of AI-powered tools.
            </p>
          </div>
          <a className="text-link" href="#experience">
            Explore my approach <ArrowUpRight size={16} />
          </a>
        </section>

        <section className="experience-section section-wrap" id="experience">
          <div className="section-heading">
            <div>
              <span className="section-kicker">MISSION LOG / 003</span>
              <h2>
                How I <em>engineer.</em>
              </h2>
            </div>
            <p>
              Core areas I bring to a project. Specific tools vary by the problem and verified
              project context.
            </p>
          </div>
          <div className="capability-grid">
            <article>
              <span className="cap-index">01</span>
              <h3>Build end to end</h3>
              <p>
                Connect thoughtful frontend experiences to well-structured APIs, persistence, and
                dependable workflows.
              </p>
              <span className="cap-line" />
            </article>
            <article>
              <span className="cap-index">02</span>
              <h3>Design for clarity</h3>
              <p>
                Make system boundaries, data flows, and engineering trade-offs explicit and easier
                to reason about.
              </p>
              <span className="cap-line" />
            </article>
            <article>
              <span className="cap-index">03</span>
              <h3>Explore what’s next</h3>
              <p>
                Experiment with AI and developer tooling while staying grounded in useful outcomes
                and real constraints.
              </p>
              <span className="cap-line" />
            </article>
          </div>
        </section>

        <section className="ai-lab section-wrap" id="ai-lab">
          <div className="ai-lab-orb" aria-hidden="true">
            <div />
            <div />
            <div />
          </div>
          <div className="ai-lab-content">
            <span className="section-kicker">EXPERIMENT BAY / 004</span>
            <h2>
              Exploring the edge
              <br />
              of <em>intelligent systems.</em>
            </h2>
            <p>
              AI Lab will document real experiments, integration patterns, agent workflows, and
              lessons learned. The interactive portfolio assistant comes later, after the core
              experience is stable.
            </p>
            <a
              className="text-link"
              href="https://github.com/juyelhushen"
              target="_blank"
              rel="noreferrer"
            >
              Explore GitHub <ArrowUpRight size={16} />
            </a>
          </div>
        </section>

        <section className="contact-section section-wrap" id="contact">
          <span className="section-kicker">OPEN CHANNEL / 005</span>
          <h2>
            Have a good problem
            <br />
            <em>to solve?</em>
          </h2>
          <p>
            I’m interested in thoughtful engineering, useful products, and opportunities to keep
            building.
          </p>
          <div className="contact-actions">
            <a
              className="button button-primary"
              href="https://github.com/juyelhushen"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} /> GitHub <ArrowUpRight size={15} />
            </a>
            <a
              className="button button-quiet"
              href="https://linkedin.com/in/juyel-hushen-770674170"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin size={16} /> LinkedIn <ArrowUpRight size={15} />
            </a>
          </div>
          <span className="contact-email-note">
            Add verified email and current résumé before public launch.
          </span>
        </section>
      </main>
      <footer className="site-footer section-wrap">
        <a href="#home" className="footer-brand">
          JH<span>•</span>
        </a>
        <p>BUILT WITH CURIOSITY · ANCHORED IN ENGINEERING</p>
        <a href="#home" className="back-top">
          BACK TO ORBIT ↑
        </a>
      </footer>
    </div>
  );
}
