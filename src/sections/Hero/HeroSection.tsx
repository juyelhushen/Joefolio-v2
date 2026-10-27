import type { Ref } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
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
          <span className="eyebrow-dot" /> SOFTWARE ENGINEER
        </div>
        <h1 ref={headingRef} id="home-title" tabIndex={-1}>
          Backend systems.
          <br />
          Full-stack software.
          <br />
          <em>Practical AI.</em>
        </h1>
        <p className="hero-intro">
          I build backend services and full-stack applications, while exploring AI engineering
          through document retrieval and agent workflows.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#projects">
            Explore Projects <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a className="button button-quiet" href="#contact">
            Let’s connect <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
        <ul className="hero-proof" aria-label="Selected technologies">
          <li>Java · Spring Boot</li>
          <li>React · TypeScript</li>
          <li>LangGraph · RAG</li>
        </ul>
      </motion.div>
    </section>
  );
}
