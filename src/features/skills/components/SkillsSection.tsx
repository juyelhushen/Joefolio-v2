import { useState } from 'react';
import { Cloud } from 'lucide-react';
import { motion } from 'motion/react';
import ScrollReveal from '../../../components/common/ScrollReveal';
import './SkillsSection.css';
import { projects } from '../../projects/data/projects';
import { skillGroups, skillPlanets } from '../data/skills';
import { getCounterRotationStyle, getOrbitStyle, getTechnologyIcon } from '../skill-presentation';

type SkillsSectionProps = {
  reduceMotion: boolean;
};

export default function SkillsSection({ reduceMotion }: SkillsSectionProps) {
  const [selectedPlanetId, setSelectedPlanetId] = useState(skillPlanets[0].id);
  const selectedPlanet =
    skillPlanets.find((planet) => planet.id === selectedPlanetId) ?? skillPlanets[0];
  const selectedDomain = skillGroups.find((group) => group.id === selectedPlanet.domainId);
  const selectedIcon = getTechnologyIcon(selectedPlanet.icon);
  const evidence = selectedPlanet.evidenceProjects.flatMap(({ projectName, linkLabel }) => {
    const project = projects.find((item) => item.name === projectName);
    return (
      project?.links
        ?.filter((link) => !linkLabel || link.label === linkLabel)
        .slice(0, 1)
        .map((link) => ({
          projectName: project.name,
          label: link.label,
          href: link.href,
        })) ?? []
    );
  });

  return (
    <section className="skills-section section-wrap" id="skills" aria-labelledby="skills-title">
      <ScrollReveal className="section-heading skills-heading">
        <div>
          <span className="section-kicker">ENGINEERING SOLAR SYSTEM / 006</span>
          <h2 id="skills-title">
            The Skill <em>Solar System.</em>
          </h2>
        </div>
        <p>Explore the tools, disciplines, and systems behind my engineering work.</p>
      </ScrollReveal>

      <ScrollReveal className="skills-solar-system">
        <div
          className="skills-orbit-scene"
          role="group"
          aria-label="Orbiting technology skills"
          data-reduced-motion={reduceMotion ? 'true' : 'false'}
        >
          {([1, 2, 3, 4, 5, 6] as const).map((orbit) => (
            <div
              className={`solar-orbit-track solar-orbit-track-${orbit}`}
              aria-hidden="true"
              key={orbit}
            />
          ))}

          <div className="solar-core" aria-hidden="true">
            <span className="solar-core-corona" />
            <strong>JH</strong>
            <small>ENGINEERING CORE</small>
          </div>

          {skillPlanets.map((planet) => {
            const icon = getTechnologyIcon(planet.icon);
            const selected = selectedPlanet.id === planet.id;
            const style = getOrbitStyle(planet, reduceMotion);
            const counterStyle = getCounterRotationStyle(planet, reduceMotion);

            return (
              <div
                className={`skill-orbit-frame skill-orbit-frame-${planet.orbit}`}
                key={planet.id}
                style={style}
                data-orbit-duration={planet.durationSeconds}
              >
                <button
                  className={`skill-orbit-planet${selected ? ' is-selected' : ''}`}
                  type="button"
                  style={{ color: planet.color }}
                  aria-label={`Select ${planet.name} skill`}
                  aria-pressed={selected}
                  aria-controls="skill-detail"
                  onClick={() => setSelectedPlanetId(planet.id)}
                >
                  <span className="skill-planet-counter" style={counterStyle} aria-hidden="true">
                    {icon === null ? (
                      <Cloud className="skill-planet-logo" aria-hidden="true" />
                    ) : (
                      <svg
                        className="skill-planet-logo"
                        viewBox="0 0 24 24"
                        role="img"
                        focusable="false"
                        style={{ color: planet.color }}
                      >
                        <path d={icon.path} />
                      </svg>
                    )}
                    <span className="skill-planet-label">{planet.name}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <section className="skill-category-index" aria-label="Technology categories">
          {skillGroups.map((group) => (
            <div className={`skill-category skill-category-${group.id}`} key={group.id}>
              <h3>{group.name}</h3>
              <ul>
                {group.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <motion.article
          className={`skill-detail skill-detail-${selectedPlanet.domainId}`}
          id="skill-detail"
          aria-labelledby="skill-detail-title"
          aria-live="polite"
          key={selectedPlanet.id}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: 'easeOut' }}
        >
          <div className="skill-detail-heading">
            <span className="skill-detail-icon" aria-hidden="true">
              {selectedIcon === null ? (
                <Cloud aria-hidden="true" />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={selectedIcon.path} />
                </svg>
              )}
            </span>
            <span className="skill-detail-kicker">
              {selectedDomain?.name ?? 'Engineering'} /{' '}
              {String(skillPlanets.indexOf(selectedPlanet) + 1).padStart(2, '0')}
            </span>
          </div>
          <h3 id="skill-detail-title">{selectedPlanet.name}</h3>
          <p className="skill-detail-description">{selectedPlanet.description}</p>
          {evidence.length > 0 && (
            <ul className="skill-evidence-list" aria-label="Related project repositories">
              {evidence.map((item) => (
                <li key={`${item.projectName}-${item.href}`}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    <span>{item.projectName}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </motion.article>
      </ScrollReveal>
    </section>
  );
}
