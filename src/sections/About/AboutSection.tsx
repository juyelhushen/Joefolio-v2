import { ArrowUpRight, Sparkles } from 'lucide-react';
import ScrollReveal from '../../components/ScrollReveal';
import './AboutSection.css';

export default function AboutSection() {
  return (
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
          persistence, and dependable asynchronous workflows. My project work also explores RAG, LLM
          applications, and agentic systems, with attention to inspectable retrieval, tools, and
          verification.
        </p>
      </ScrollReveal>
      <ScrollReveal className="manifesto-link-reveal" delay={0.14}>
        <a className="text-link" href="#skills">
          Explore my toolkit <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </ScrollReveal>
    </section>
  );
}
