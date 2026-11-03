import type { Ref } from 'react';
import { ArrowRight, ArrowUpRight, Braces, Layers3, Network, Sparkles } from 'lucide-react';
import { m } from 'motion/react';
import './HeroSection.css';
import { createRevealVariants } from '../../components/common/reveal-variants';
import { useInteractiveActivity } from '../../hooks/useInteractiveActivity';

type HeroSectionProps = {
  reduceMotion: boolean;
  headingRef: Ref<HTMLHeadingElement>;
};

function EngineeringConstellation({ reduceMotion }: { reduceMotion: boolean }) {
  const { ref, active, staticEffects } = useInteractiveActivity<HTMLDivElement>(reduceMotion);
  return (
    <div
      ref={ref}
      className="engineering-constellation"
      data-motion-active={active && !staticEffects}
      role="group"
      aria-label="Engineering constellation: explore my work and skills"
    >
      <svg
        className="constellation-lines"
        viewBox="0 0 540 480"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <ellipse cx="270" cy="250" rx="216" ry="155" />
        <ellipse cx="270" cy="250" rx="155" ry="112" transform="rotate(-28 270 250)" />
        <path d="M119 96 270 250 421 96M270 250 270 403" />
        <circle cx="119" cy="96" r="4" />
        <circle cx="421" cy="96" r="4" />
        <circle cx="270" cy="403" r="4" />
      </svg>
      <span className="constellation-caption" aria-hidden="true">
        ENGINEERING / CONNECTED DISCIPLINES
      </span>
      <div className="constellation-core" aria-hidden="true">
        <span className="constellation-core-halo" />
        <Braces size={32} strokeWidth={1.4} />
        <span>
          ENGINEERING
          <br />
          CORE
        </span>
      </div>
      <a
        className="constellation-node constellation-backend"
        href="#projects"
        aria-label="Backend: Java, Spring Boot. Explore projects"
      >
        <Network size={20} aria-hidden="true" />
        <strong>Backend</strong>
        <span>Java · Spring Boot</span>
      </a>
      <a
        className="constellation-node constellation-fullstack"
        href="#skills"
        aria-label="Full-stack: React, TypeScript. Explore skills"
      >
        <Layers3 size={20} aria-hidden="true" />
        <strong>Full-stack</strong>
        <span>React · TypeScript</span>
      </a>
      <a
        className="constellation-node constellation-ai"
        href="#ai-lab"
        aria-label="AI systems: RAG, LangGraph, agents. Explore AI Lab"
      >
        <Sparkles size={20} aria-hidden="true" />
        <strong>AI systems</strong>
        <span>RAG · LangGraph · agents</span>
      </a>
      <div className="constellation-satellite-orbit" aria-hidden="true">
        <svg className="constellation-satellite" viewBox="0 0 40 24" fill="none">
          <path d="M10 12h20" stroke="currentColor" strokeWidth="2" />
          <path d="M2 5h10v14H2zm26 0h10v14H28z" fill="#232E43" stroke="currentColor" />
          <path d="M7 5v14m26-14v14M2 12h10m16 0h10" stroke="currentColor" strokeOpacity=".5" />
          <rect
            x="15"
            y="6"
            width="10"
            height="12"
            rx="2"
            fill="var(--color-accent-secondary)"
            stroke="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}

export default function HeroSection({ reduceMotion, headingRef }: HeroSectionProps) {
  const { ref, staticEffects } = useInteractiveActivity<HTMLDivElement>(reduceMotion, false);
  return (
    <section className="hero section-wrap" id="home" aria-labelledby="home-title">
      <m.div
        ref={ref}
        className="hero-copy"
        initial={staticEffects ? false : 'hidden'}
        animate="visible"
        variants={createRevealVariants('stagger-container', 0.55, 0, staticEffects)}
      >
        <m.div
          className="eyebrow"
          variants={createRevealVariants('fade-up', 0.55, 0, staticEffects)}
        >
          SOFTWARE ENGINEER II · FULL-STACK · AI
        </m.div>
        <m.h1
          ref={headingRef}
          id="home-title"
          tabIndex={-1}
          variants={createRevealVariants('rise', 0.55, 0, staticEffects)}
        >
          <span>I turn complex</span> <span>ideas into</span> <em>reliable software.</em>
        </m.h1>
        <m.p
          className="hero-intro"
          variants={createRevealVariants('fade-up', 0.55, 0, staticEffects)}
        >
          Building dependable backend systems, thoughtful digital experiences and practical AI
          solutions.
        </m.p>
        <m.div
          className="hero-actions"
          variants={createRevealVariants('fade-up', 0.55, 0, staticEffects)}
        >
          <a className="button button-primary hero-cta" href="#projects">
            <span>Explore my work</span> <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a className="button button-secondary hero-cta" href="#contact">
            <span>Get in touch</span> <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </m.div>
      </m.div>
      <EngineeringConstellation reduceMotion={reduceMotion} />
    </section>
  );
}
