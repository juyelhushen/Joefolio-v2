import { ArrowUpRight } from 'lucide-react';
import { caseStudies } from '../case-studies';
import { projects } from '../../projects/data/projects';
import LegacyPortfolioOrbit from './LegacyPortfolioOrbit';
import ScrollReveal from '../../../components/common/ScrollReveal';
import './AiLabSection.css';
import { useAnimationVisibility } from '../../../hooks/useAnimationVisibility';

export default function AiLabSection() {
  const { ref, visible } = useAnimationVisibility<HTMLElement>();

  return (
    <section
      ref={ref}
      className="ai-lab section-wrap"
      id="ai-lab"
      aria-labelledby="ai-lab-title"
      data-animation-visible={visible}
    >
      <ScrollReveal className="ai-lab-heading" headingReveal>
        <span className="section-kicker">05 / AI LAB</span>
        <h2 id="ai-lab-title">
          <span className="heading-line-mask">
            <span className="heading-line">Engineering with</span>
          </span>
          <br />
          <span className="heading-line-mask">
            <span className="heading-line">
              <em>intelligent systems.</em>
            </span>
          </span>
        </h2>
        <p>
          Applied AI work is strongest when its sources, tools, and boundaries are inspectable.
          These projects explore retrieval-grounded answers and controlled agent workflows.
        </p>
      </ScrollReveal>
      <LegacyPortfolioOrbit />
      <div className="ai-lab-cases">
        {caseStudies.map((study, index) => {
          const project = projects.find((item) => item.name === study.name);
          const Icon = study.icon;

          return (
            <ScrollReveal
              as="article"
              className="ai-lab-case"
              key={study.name}
              duration={0.65}
              delay={index * 0.11}
            >
              <div className="ai-lab-case-icon" aria-hidden="true">
                <Icon size={17} />
              </div>
              <div className="ai-lab-case-copy">
                <span>{study.focus}</span>
                <h3>{study.name}</h3>
                <p>{study.detail}</p>
                <ul aria-label={`${study.name} technologies`}>
                  {project?.technologies.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
                {project?.links.map((link) => (
                  <a
                    className="button button-tertiary"
                    href={link.href}
                    key={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label} <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
