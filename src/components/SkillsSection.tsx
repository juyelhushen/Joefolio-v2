import { useState } from 'react';
import { BrainCircuit, Code2, Database, Layers3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { projects } from '../data/projects';
import { skillGroups } from '../data/skills';
import type { SkillDomainId, SkillIcon } from '../data/skills';

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
  const [selectedDomain, setSelectedDomain] = useState<SkillDomainId>(skillGroups[0].id);
  const selectedGroup = skillGroups.find((group) => group.id === selectedDomain) ?? skillGroups[0];
  const SelectedIcon = skillIcons[selectedGroup.icon];

  const evidence = selectedGroup.evidenceProjects.flatMap(({ projectName, linkLabel }) => {
    const project = projects.find((item) => item.name === projectName);
    return (
      project?.links
        .filter((link) => !linkLabel || link.label === linkLabel)
        .map((link) => ({
          projectName: project.name,
          label: link.label,
          href: link.href,
        })) ?? []
    );
  });

  return (
    <section className="skills-section section-wrap" id="skills" aria-labelledby="skills-title">
      <div className="section-heading skills-heading">
        <div>
          <span className="section-kicker">ENGINEERING CONSTELLATION / 006</span>
          <h2 id="skills-title">
            The Skill <em>Galaxy.</em>
          </h2>
        </div>
        <p>Explore the tools, disciplines, and systems behind my engineering work.</p>
      </div>

      <div className="skills-universe">
        <div className="skills-orbit-scene" role="group" aria-label="Choose a skills domain">
          <div className="skills-orbit-path skills-orbit-path-one" aria-hidden="true" />
          <div className="skills-orbit-path skills-orbit-path-two" aria-hidden="true" />
          <div className="skills-orbit-path skills-orbit-path-three" aria-hidden="true" />
          <div className="skills-orbit-core" aria-hidden="true">
            <span />
            <strong>Engineering</strong>
            <small>CORE SYSTEM</small>
          </div>

          {skillGroups.map((group) => {
            const Icon = skillIcons[group.icon];
            const selected = selectedDomain === group.id;

            return (
              <button
                className={`skill-orbit-planet skill-orbit-planet-${group.id}${selected ? ' is-selected' : ''}`}
                type="button"
                key={group.id}
                aria-pressed={selected}
                aria-controls="skill-detail"
                onClick={() => setSelectedDomain(group.id)}
              >
                <span className="skill-planet-sphere" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.55} />
                </span>
                <span className="skill-planet-label">{group.name}</span>
              </button>
            );
          })}
        </div>

        <motion.article
          className={`skill-detail skill-detail-${selectedGroup.id}`}
          id="skill-detail"
          aria-labelledby="skill-detail-title"
          key={selectedGroup.id}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: 'easeOut' }}
        >
          <div className="skill-detail-heading">
            <span className="skill-detail-icon" aria-hidden="true">
              <SelectedIcon size={18} strokeWidth={1.6} />
            </span>
            <span className="skill-detail-kicker">
              DOMAIN / {skillGroups.indexOf(selectedGroup) + 1}
            </span>
          </div>
          <h3 id="skill-detail-title">{selectedGroup.name}</h3>
          <p className="skill-detail-description">{selectedGroup.description}</p>
          <div className="skill-detail-block">
            <h4>Tools &amp; disciplines</h4>
            <ul className="skill-detail-tags">
              {selectedGroup.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
          {evidence.length > 0 && (
            <div className="skill-detail-block">
              <h4>Documented project evidence</h4>
              <ul className="skill-evidence-list">
                {evidence.map((item) => (
                  <li key={`${item.projectName}-${item.href}`}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      <span>{item.projectName}</span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.article>
      </div>
    </section>
  );
}
