import { useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'motion/react';
import type { SimpleIcon } from 'simple-icons';
import {
  siApachekafka,
  siFastapi,
  siLanggraph,
  siOllama,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siSpringboot,
  siSqlite,
  siTypescript,
} from 'simple-icons';
import { projects } from '../data/projects';
import { skillGroups, skillPlanets } from '../data/skills';
import type { SkillPlanet } from '../data/skills';

const technologyIcons: Record<string, SimpleIcon> = {
  springboot: siSpringboot,
  react: siReact,
  typescript: siTypescript,
  postgresql: siPostgresql,
  sqlite: siSqlite,
  redis: siRedis,
  apachekafka: siApachekafka,
  python: siPython,
  langgraph: siLanggraph,
  ollama: siOllama,
  fastapi: siFastapi,
};

type SkillsSectionProps = {
  reduceMotion: boolean;
};

type SkillOrbitStyle = CSSProperties & {
  '--skill-orbit-phase': string;
  '--skill-counter-phase': string;
};

function getOrbitStyle(planet: SkillPlanet, reduceMotion: boolean): SkillOrbitStyle {
  const phaseStyle = {
    '--skill-orbit-phase': `${planet.phaseDegrees}deg`,
    '--skill-counter-phase': `${-planet.phaseDegrees}deg`,
  };

  if (reduceMotion) {
    return {
      ...phaseStyle,
      transform: `translate(-50%, -50%) rotate(${planet.phaseDegrees}deg)`,
    };
  }

  return {
    ...phaseStyle,
    animationDuration: `${planet.durationSeconds}s`,
    animationDelay: `${-(planet.durationSeconds * planet.phaseDegrees) / 360}s`,
    animationDirection: planet.direction === 'clockwise' ? 'normal' : 'reverse',
  };
}

function getCounterRotationStyle(planet: SkillPlanet, reduceMotion: boolean) {
  if (reduceMotion) return { transform: `rotate(${-planet.phaseDegrees}deg)` };

  return {
    animationDuration: `${planet.durationSeconds}s`,
    animationDelay: `${-(planet.durationSeconds * planet.phaseDegrees) / 360}s`,
    animationDirection: planet.direction === 'clockwise' ? 'reverse' : 'normal',
  } as const;
}

export default function SkillsSection({ reduceMotion }: SkillsSectionProps) {
  const [selectedPlanetId, setSelectedPlanetId] = useState(skillPlanets[0].id);
  const selectedPlanet =
    skillPlanets.find((planet) => planet.id === selectedPlanetId) ?? skillPlanets[0];
  const selectedDomain = skillGroups.find((group) => group.id === selectedPlanet.domainId);
  const selectedIcon = technologyIcons[selectedPlanet.icon];
  const evidence = selectedPlanet.evidenceProjects.flatMap(({ projectName, linkLabel }) => {
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
          <span className="section-kicker">ENGINEERING SOLAR SYSTEM / 006</span>
          <h2 id="skills-title">
            The Skill <em>Solar System.</em>
          </h2>
        </div>
        <p>Explore the tools, disciplines, and systems behind my engineering work.</p>
      </div>

      <div className="skills-solar-system">
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
            const icon = technologyIcons[planet.icon];
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
                    <svg
                      className="skill-planet-logo"
                      viewBox="0 0 24 24"
                      role="img"
                      focusable="false"
                      style={{ color: planet.color }}
                    >
                      <path d={icon.path} />
                    </svg>
                    <span className="skill-planet-label">{planet.name}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>

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
              <svg viewBox="0 0 24 24">
                <path d={selectedIcon.path} />
              </svg>
            </span>
            <span className="skill-detail-kicker">
              {selectedDomain?.name ?? 'Engineering'} /{' '}
              {String(skillPlanets.indexOf(selectedPlanet) + 1).padStart(2, '0')}
            </span>
          </div>
          <h3 id="skill-detail-title">{selectedPlanet.name}</h3>
          <p className="skill-detail-domain">{selectedDomain?.name}</p>
          <p className="skill-detail-description">{selectedPlanet.description}</p>
          <div className="skill-detail-block">
            <h4>Domain toolkit · {selectedDomain?.name}</h4>
            <ul className="skill-detail-tags">
              {selectedDomain?.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
          <div className="skill-detail-block">
            <h4>Documented project evidence</h4>
            {evidence.length > 0 ? (
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
            ) : (
              <p className="skill-evidence-note">
                This technology is in the existing skills inventory; a specific project association
                is not documented here.
              </p>
            )}
          </div>
        </motion.article>
      </div>
    </section>
  );
}
