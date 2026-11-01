import type { Ref } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import './HeroSection.css';
import { createRevealVariants } from '../../components/common/reveal-variants';

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
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={createRevealVariants('stagger-container', 0.55, 0, reduceMotion)}
      >
        <motion.div
          className="eyebrow"
          variants={createRevealVariants('fade-up', 0.55, 0, reduceMotion)}
        >
          <span className="eyebrow-dot" /> SOFTWARE ENGINEER
        </motion.div>
        <motion.h1
          ref={headingRef}
          id="home-title"
          tabIndex={-1}
          variants={createRevealVariants('fade-up', 0.55, 0, reduceMotion)}
        >
          Backend systems.
          <br />
          Full-stack software.
          <br />
          <em>Practical AI.</em>
        </motion.h1>
        <motion.p
          className="hero-intro"
          variants={createRevealVariants('fade-up', 0.55, 0, reduceMotion)}
        >
          I build backend services and full-stack applications, while exploring AI engineering
          through document retrieval and agent workflows.
        </motion.p>
        <motion.div
          className="hero-actions"
          variants={createRevealVariants('fade-up', 0.55, 0, reduceMotion)}
        >
          <a className="button button-primary" href="#projects">
            Explore Projects <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a className="button button-quiet" href="#contact">
            Let’s connect <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </motion.div>
        <motion.ul
          className="hero-proof"
          aria-label="Selected technologies"
          variants={createRevealVariants('fade-up', 0.55, 0, reduceMotion)}
        >
          <li>Java · Spring Boot</li>
          <li>React · TypeScript</li>
          <li>LangGraph · RAG</li>
        </motion.ul>
      </motion.div>
    </section>
  );
}
