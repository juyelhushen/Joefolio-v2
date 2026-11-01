import type { CSSProperties } from 'react';
import type { SimpleIcon } from 'simple-icons';
import {
  siApachekafka,
  siDocker,
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
import type { SkillPlanet } from './data/skills';

const technologyIcons = {
  springboot: siSpringboot,
  react: siReact,
  typescript: siTypescript,
  postgresql: siPostgresql,
  sqlite: siSqlite,
  redis: siRedis,
  apachekafka: siApachekafka,
  docker: siDocker,
  python: siPython,
  langgraph: siLanggraph,
  ollama: siOllama,
  fastapi: siFastapi,
} satisfies Record<Exclude<SkillPlanet['icon'], 'aws'>, SimpleIcon>;

export const getTechnologyIcon = (icon: SkillPlanet['icon']): SimpleIcon | null =>
  icon === 'aws' ? null : technologyIcons[icon];

type SkillOrbitStyle = CSSProperties & {
  '--skill-orbit-phase': string;
  '--skill-counter-phase': string;
};

export const getOrbitStyle = (planet: SkillPlanet, reduceMotion: boolean): SkillOrbitStyle => {
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
};

export const getCounterRotationStyle = (
  planet: SkillPlanet,
  reduceMotion: boolean,
): CSSProperties => {
  if (reduceMotion) return { transform: `rotate(${-planet.phaseDegrees}deg)` };
  return {
    animationDuration: `${planet.durationSeconds}s`,
    animationDelay: `${-(planet.durationSeconds * planet.phaseDegrees) / 360}s`,
    animationDirection: planet.direction === 'clockwise' ? 'reverse' : 'normal',
  };
};
