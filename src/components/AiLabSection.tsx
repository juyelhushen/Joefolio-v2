import { ArrowUpRight, Network, ShieldCheck } from 'lucide-react';
import { projects } from '../data/projects';

const caseStudies = [
  {
    name: 'Enterprise Knowledge Assistant',
    icon: Network,
    focus: 'Document-grounded retrieval',
    detail:
      'PDF ingestion, chunking, and embeddings feed a LangGraph retrieval, reasoning, and citation workflow backed by ChromaDB. SQLite stores document metadata and interaction audit logs.',
  },
  {
    name: 'Sentinel',
    icon: ShieldCheck,
    focus: 'Controlled agent workflows',
    detail:
      'LangGraph planner and investigator agents initiate incident investigations through registered, policy-controlled repository tools. Repair and verification are documented as an internal constrained workflow, not a public patch API.',
  },
] as const;

export default function AiLabSection() {
  return (
    <section className="ai-lab section-wrap" id="ai-lab" aria-labelledby="ai-lab-title">
      <div className="ai-lab-heading">
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
      </div>
      <div className="ai-lab-orb" aria-hidden="true">
        <div />
        <div />
        <div />
      </div>
      <div className="ai-lab-cases">
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
      </div>
    </section>
  );
}
