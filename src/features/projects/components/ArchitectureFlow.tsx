import type { ProjectArchitecture } from '../data/projects';
import './ArchitectureFlow.css';

export default function ArchitectureFlow({ architecture }: { architecture: ProjectArchitecture }) {
  return (
    <div className="architecture-flow">
      {architecture.lanes.map((lane) => (
        <section className="architecture-lane" key={lane.label} aria-label={lane.label}>
          <h4>{lane.label}</h4>
          <ol>
            {lane.steps.map((step, index) => (
              <li key={step} data-step={index + 1}>
                <span aria-hidden="true">{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
