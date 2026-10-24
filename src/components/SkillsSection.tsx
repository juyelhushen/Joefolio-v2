import { BrainCircuit, Code2, Database, Layers3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { skillGroups } from '../data/skills';
import type { SkillIcon } from '../data/skills';

const skillIcons: Record<SkillIcon, LucideIcon> = {
  code: Code2,
  layers: Layers3,
  data: Database,
  ai: BrainCircuit,
};

type SkillsSectionProps = {
  reduceMotion: boolean;
};

export default function SkillsSection({ reduceMotion }: SkillsSectionProps) {
  return (
    <section className="skills-section section-wrap" id="skills" aria-labelledby="skills-title">
      <div className="section-heading">
        <div>
          <span className="section-kicker">ENGINEERING TOOLKIT / 004</span>
          <h2 id="skills-title">
            Skills &amp; <em>systems.</em>
          </h2>
        </div>
        <p>
          Technologies documented across the selected projects and this portfolio. Project-specific
          implementation context lives with each case study.
        </p>
      </div>
      <div className="skills-grid">
        {skillGroups.map((group, index) => {
          const Icon = skillIcons[group.icon];

          return (
            <motion.article
              className="skill-group"
              key={group.name}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.4, delay: index * 0.05 }}
            >
              <div className="skill-group-heading">
                <span className="skill-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.6} />
                </span>
                <h3>{group.name}</h3>
              </div>
              <ul className="skill-list">
                {group.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
