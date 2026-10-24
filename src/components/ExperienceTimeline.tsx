import { ArrowUpRight, BriefcaseBusiness } from 'lucide-react';
import { motion } from 'motion/react';
import { experience } from '../data/experience';

type ExperienceTimelineProps = {
  reduceMotion: boolean;
};

export default function ExperienceTimeline({ reduceMotion }: ExperienceTimelineProps) {
  if (experience.length === 0) {
    return (
      <div className="timeline-empty">
        <span className="timeline-empty-icon" aria-hidden="true">
          <BriefcaseBusiness size={19} strokeWidth={1.5} />
        </span>
        <div>
          <h3>Professional history is being updated</h3>
          <p>
            Employment details will appear here once roles, employers, dates, and contributions are
            confirmed.
          </p>
        </div>
        <a className="text-link" href="#projects">
          Explore selected projects <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <ol className="experience-timeline">
      {experience.map((entry, index) => (
        <motion.li
          className="experience-entry"
          key={`${entry.employer}-${entry.role}`}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.4, delay: index * 0.06 }}
        >
          <span className="experience-marker" aria-hidden="true" />
          <article className="experience-card">
            <div className="experience-card-heading">
              <div>
                <h3>{entry.role}</h3>
                <p className="experience-employer">{entry.employer}</p>
              </div>
              {entry.dates && <span className="experience-dates">{entry.dates}</span>}
            </div>
            <p className="experience-summary">{entry.summary}</p>
            {entry.contributions.length > 0 && (
              <ul className="experience-contributions">
                {entry.contributions.map((contribution) => (
                  <li key={contribution}>{contribution}</li>
                ))}
              </ul>
            )}
            {entry.technologies.length > 0 && (
              <ul className="experience-technologies" aria-label="Technologies used">
                {entry.technologies.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>
            )}
          </article>
        </motion.li>
      ))}
    </ol>
  );
}
