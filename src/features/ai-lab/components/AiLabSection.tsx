import { ArrowUpRight } from 'lucide-react';
import { caseStudies } from '../case-studies';
import { projects } from '../../projects/data/projects';
import LegacyPortfolioOrbit from './LegacyPortfolioOrbit';
import ScrollReveal from '../../../components/common/ScrollReveal';
import './AiLabSection.css';

export default function AiLabSection() {
  return (
    <section className="ai-lab section-wrap" id="ai-lab" aria-labelledby="ai-lab-title">
      <ScrollReveal className="ai-lab-heading">
        <span className="section-kicker">EXPERIMENT BAY / 005</span>
        <h2 id="ai-lab-title">
          Engineering with
          <br />
          <em>intelligent systems.</em>
        </h2>
        <p>
          Applied AI work is strongest when its sources, tools, and boundaries are inspectable.
          These projects explore retrieval-grounded answers and controlled agent workflows.
        </p>
      </ScrollReveal>
      <LegacyPortfolioOrbit />
      <ScrollReveal className="ai-lab-cases">
        {caseStudies.map((study) => {
          const project = projects.find((item) => item.name === study.name);
          const Icon = study.icon;

          return (
            <article className="ai-lab-case" key={study.name}>
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
                    className="text-link"
                    href={link.href}
                    key={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label} <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
            </article>
          );
        })}
      </ScrollReveal>
    </section>
  );
}
