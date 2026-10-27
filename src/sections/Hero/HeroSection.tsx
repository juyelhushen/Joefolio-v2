import type { Ref } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import './HeroSection.css';

type HeroSectionProps = {
  reduceMotion: boolean;
  headingRef: Ref<HTMLHeadingElement>;
};

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

export default function HeroSection({ reduceMotion, headingRef }: HeroSectionProps) {
  return (
    <section className="hero section-wrap" id="home" aria-labelledby="home-title">
      <Planet />
      <motion.div
        className="hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
      >
        <div className="eyebrow">
          <span className="eyebrow-dot" /> SOFTWARE ENGINEER{' '}
          <span className="eyebrow-separator">/</span> BACKEND & FULL-STACK{' '}
          <span className="eyebrow-separator">/</span> AI ENGINEERING EXPLORATION
        </div>
        <h1 ref={headingRef} id="home-title" tabIndex={-1}>
          I build software
          <br />
          that solves <em>real problems.</em>
        </h1>
        <p className="hero-intro">
          I build backend services and full-stack applications, and explore AI engineering through
          projects in document retrieval and agent workflows.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#projects">
            Explore Projects <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a className="button button-quiet" href="#contact">
            Let’s connect <ArrowUpRight size={16} aria-hidden="true" />
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
        <span className="note-coordinate">12° 34&apos; / 56° 78&apos;</span>
      </div>
      <a className="scroll-cue" href="#skills">
        <span>SCROLL TO EXPLORE</span>
        <ArrowDownRight size={19} aria-hidden="true" />
      </a>
      <div className="hero-bottom-glow" aria-hidden="true" />
    </section>
  );
}
