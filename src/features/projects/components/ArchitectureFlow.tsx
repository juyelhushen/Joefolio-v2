import { useState, type CSSProperties } from 'react';
import { useIsPresent } from 'motion/react';
import { useInteractiveActivity } from '../../../hooks/useInteractiveActivity';
import type { ProjectArchitecture } from '../data/projects';
import './ArchitectureFlow.css';

export default function ArchitectureFlow({
  architecture,
  enabled = true,
  reduceMotion = false,
}: {
  architecture: ProjectArchitecture;
  enabled?: boolean;
  reduceMotion?: boolean;
}) {
  const isPresent = useIsPresent();
  const { ref, active, staticEffects } = useInteractiveActivity<HTMLDivElement>(
    reduceMotion,
    enabled && isPresent,
  );
  const animated = !staticEffects;
  const [started, setStarted] = useState(false);
  const [replay, setReplay] = useState(0);
  if (active && !started) setStarted(true);

  return (
    <div
      ref={ref}
      className="architecture-flow"
      data-animated={animated}
      data-started={started}
      data-running={active}
    >
      {animated && (
        <button
          type="button"
          className="architecture-replay"
          aria-label="Replay architecture animation"
          onClick={() => setReplay((value) => value + 1)}
        >
          Replay
        </button>
      )}
      <div key={replay}>
        {architecture.lanes.map((lane) => (
          <section className="architecture-lane" key={lane.label} aria-label={lane.label}>
            <h4>{lane.label}</h4>
            <ol>
              {lane.steps.map((step, index) => (
                <li
                  key={step}
                  data-step={index + 1}
                  style={{ '--step-delay': `${index * 250}ms` } as CSSProperties}
                >
                  <i className="architecture-node-glow" aria-hidden="true" />
                  <span aria-hidden="true">{index + 1}</span>
                  <p>{step}</p>
                  {index < lane.steps.length - 1 && (
                    <i className="architecture-packet" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
