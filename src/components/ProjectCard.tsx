import { motion } from 'motion/react';
import type { Project } from '../data/projects';
import './ProjectCard.css';

type ProjectCardProps = {
  project: Project;
  index: number;
  selected: boolean;
  reduceMotion: boolean;
  onSelect: (projectId: string) => void;
};

export default function ProjectCard({
  project,
  index,
  selected,
  reduceMotion,
  onSelect,
}: ProjectCardProps) {
  return (
    <motion.button
      className={`mission-nav-card${selected ? ' is-selected' : ''}`}
      type="button"
      aria-pressed={selected}
      aria-controls="mission-feature"
      onClick={() => onSelect(project.id)}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.36, delay: index * 0.06 }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
    >
      <span className="mission-nav-number">MISSION / {project.number}</span>
      <strong>{project.name}</strong>
      <span className="mission-nav-category">{project.category}</span>
      <span className="mission-nav-indicator" aria-hidden="true" />
    </motion.button>
  );
}
