import { useState } from 'react';
import { m } from 'motion/react';
import { useAnimationVisibility } from '../../../hooks/useAnimationVisibility';
import { experience } from '../data/experience';
import './ExperienceTimeline.css';

type ExperienceTimelineProps = {
  reduceMotion: boolean;
};

function CareerRoute({
  reduceMotion,
  mobile = false,
}: ExperienceTimelineProps & { mobile?: boolean }) {
  const routeId = mobile ? 'career-route-mobile' : 'career-route-desktop';
  const route = mobile
    ? 'M 27 0 C 20 110, 34 160, 27 260 S 20 405, 27 510 S 34 655, 27 760 S 20 900, 27 1000'
    : 'M 500 0 C 454 105, 546 155, 500 250 S 454 405, 500 500 S 546 655, 500 750 S 454 900, 500 1000';

  return (
    <svg
      className={`career-route career-route-${mobile ? 'mobile' : 'desktop'}`}
      viewBox={mobile ? '0 0 54 1000' : '0 0 1000 1000'}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-motion={reduceMotion ? 'reduced' : 'continuous'}
    >
      <defs>
        <linearGradient
          id={`career-route-gradient-${mobile ? 'mobile' : 'desktop'}`}
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#77bbff" stopOpacity=".82" />
          <stop offset="42%" stopColor="#8fd8ce" stopOpacity=".82" />
          <stop offset="72%" stopColor="#c3a9ff" stopOpacity=".82" />
          <stop offset="100%" stopColor="#ffc38e" stopOpacity=".3" />
        </linearGradient>
      </defs>
      <path
        className="career-route-aura"
        d={route}
        stroke={`url(#career-route-gradient-${mobile ? 'mobile' : 'desktop'})`}
      />
      {reduceMotion ? (
        <path
          id={routeId}
          className="career-route-line"
          d={route}
          stroke={`url(#career-route-gradient-${mobile ? 'mobile' : 'desktop'})`}
        />
      ) : (
        <m.path
          id={routeId}
          className="career-route-line"
          d={route}
          stroke={`url(#career-route-gradient-${mobile ? 'mobile' : 'desktop'})`}
          initial={{ pathLength: 0, opacity: 0.45 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
        />
      )}
      {!reduceMotion && (
        <circle className="career-route-signal" r={mobile ? 2.4 : 5}>
          <animateMotion dur="13s" repeatCount="indefinite" begin="-4s" path={route} />
        </circle>
      )}
    </svg>
  );
}

export default function ExperienceTimeline({ reduceMotion }: ExperienceTimelineProps) {
  const { ref, visible } = useAnimationVisibility<HTMLDivElement>();
  const [selectedExperience, setSelectedExperience] = useState(
    experience.find((entry) => entry.current)?.id ?? experience[0].id,
  );

  return (
    <div
      ref={ref}
      className="career-odyssey"
      data-reduced-motion={reduceMotion ? 'true' : 'false'}
      data-animation-visible={visible}
    >
      <CareerRoute reduceMotion={reduceMotion} />
      <CareerRoute reduceMotion={reduceMotion} mobile />
      <ol className="experience-timeline" aria-label="Career milestones">
        {experience.map((entry, index) => {
          const selected = selectedExperience === entry.id;
          return (
            <m.li
              className={`experience-entry${selected ? ' is-selected' : ''}${entry.current ? ' is-current' : ''}`}
              data-chapter={entry.chapter}
              key={entry.id}
              initial={
                reduceMotion || typeof IntersectionObserver === 'undefined' ? false : 'hidden'
              }
              whileInView={typeof IntersectionObserver === 'undefined' ? undefined : 'visible'}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.98 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              viewport={{ once: true, amount: 0.2 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.65, delay: (index % 2) * 0.1, ease: [0.22, 0.68, 0.2, 1] }
              }
            >
              <article className="experience-card" id={`career-card-${entry.id}`}>
                <div className="experience-card-heading">
                  <div>
                    <span className="experience-chapter">CHAPTER / {entry.chapter}</span>
                    <p className="experience-employer">{entry.employer}</p>
                    <h3>{entry.role}</h3>
                  </div>
                  <div className="experience-card-meta">
                    {entry.dates && <span className="experience-dates">{entry.dates}</span>}
                    {entry.current && <span className="experience-current">Current</span>}
                  </div>
                </div>
                {entry.summary && <p className="experience-summary">{entry.summary}</p>}
                {!!entry.highlights?.length && (
                  <ul className="experience-highlights">
                    {entry.highlights.slice(0, 4).map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                )}
                {!!entry.stack?.length && (
                  <ul
                    className="experience-stack"
                    aria-label={`${entry.employer} technology stack`}
                  >
                    {entry.stack.map((technology) => (
                      <li key={technology}>{technology}</li>
                    ))}
                  </ul>
                )}
              </article>
              <m.button
                className="experience-marker"
                type="button"
                aria-label={`Highlight ${entry.employer}: ${entry.role}`}
                aria-pressed={selected}
                aria-controls={`career-card-${entry.id}`}
                onClick={() => setSelectedExperience(entry.id)}
                variants={{
                  hidden: { opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.7 },
                  visible: { opacity: 1, scale: 1 },
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.4, delay: 0.3 + index * 0.2, ease: 'easeOut' }
                }
              >
                <span className="experience-marker-core" aria-hidden="true" />
              </m.button>
            </m.li>
          );
        })}
      </ol>
    </div>
  );
}
