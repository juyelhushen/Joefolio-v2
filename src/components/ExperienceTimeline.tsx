import { useState } from 'react';
import { motion } from 'motion/react';
import { experience } from '../data/experience';

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
          <stop offset="0%" stopColor="#ffbc8f" stopOpacity=".82" />
          <stop offset="52%" stopColor="#a5a6ff" stopOpacity=".82" />
          <stop offset="100%" stopColor="#77bbff" stopOpacity=".3" />
        </linearGradient>
      </defs>
      {reduceMotion ? (
        <path
          id={routeId}
          className="career-route-line"
          d={route}
          stroke={`url(#career-route-gradient-${mobile ? 'mobile' : 'desktop'})`}
        />
      ) : (
        <motion.path
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
  const [selectedExperience, setSelectedExperience] = useState(
    experience.find((entry) => entry.current)?.id ?? experience[0].id,
  );

  return (
    <div className="career-odyssey" data-reduced-motion={reduceMotion ? 'true' : 'false'}>
      <CareerRoute reduceMotion={reduceMotion} />
      <CareerRoute reduceMotion={reduceMotion} mobile />
      <ol className="experience-timeline" aria-label="Career milestones">
        {experience.map((entry, index) => {
          const selected = selectedExperience === entry.id;
          return (
            <motion.li
              className={`experience-entry${selected ? ' is-selected' : ''}${entry.current ? ' is-current' : ''}`}
              key={entry.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.42, delay: index * 0.12 }}
            >
              <article className="experience-card" id={`career-card-${entry.id}`}>
                <div className="experience-card-heading">
                  <div>
                    <span className="experience-chapter">
                      CHAPTER / {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="experience-employer">{entry.employer}</p>
                    <h3>{entry.role}</h3>
                  </div>
                  <div className="experience-card-meta">
                    {entry.dates && <span className="experience-dates">{entry.dates}</span>}
                    {entry.current && <span className="experience-current">CURRENT ROLE</span>}
                  </div>
                </div>
              </article>
              <motion.button
                className="experience-marker"
                type="button"
                aria-label={`Highlight ${entry.employer}: ${entry.role}`}
                aria-pressed={selected}
                aria-controls={`career-card-${entry.id}`}
                onClick={() => setSelectedExperience(entry.id)}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.4, delay: 0.3 + index * 0.2, ease: 'easeOut' }
                }
              >
                <span className="experience-marker-core" aria-hidden="true" />
              </motion.button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
