import { ArrowUpRight, Files, Link2, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { Project, ProjectVisual } from '../data/projects';

const visualIcons: Record<ProjectVisual, LucideIcon> = {
  agents: Network,
  links: Link2,
  knowledge: Files,
};

type ProjectCardProps = {
  project: Project;
  index: number;
  reduceMotion: boolean;
};

export default function ProjectCard({ project, index, reduceMotion }: ProjectCardProps) {
  const VisualIcon = visualIcons[project.visual];

  return (
    <motion.article
      className="project-card"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, delay: index * 0.07 }}
    >
      <div className="project-card-top">
        <span className="project-number">PROJECT / {project.number}</span>
        <span className="project-category">{project.category}</span>
      </div>

      <div className={`project-visual project-visual-${project.visual}`} aria-hidden="true">
        <span className="visual-orbit visual-orbit-one" />
        <span className="visual-orbit visual-orbit-two" />
        <span className="visual-icon">
          <VisualIcon size={34} strokeWidth={1.25} />
        </span>
      </div>

      <div className="project-content">
        <h3>{project.name}</h3>

        <div className="project-detail">
          <span className="project-detail-label">Problem</span>
          <p>{project.problem}</p>
        </div>

        <div className="project-detail">
          <span className="project-detail-label">Approach</span>
          <p className="project-summary">{project.summary}</p>
        </div>

        <div className="project-focus">
          <span className="project-detail-label">Engineering focus</span>
          <p>{project.engineeringFocus}</p>
        </div>

        <ul className="tech-tags" aria-label={`${project.name} technologies`}>
          {project.technologies.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>

        <footer className="project-footer">
          {project.links.map((link) => (
            <a
              className="project-link"
              aria-label={`${project.name}: ${link.label}`}
              href={link.href}
              key={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          ))}
        </footer>
      </div>
    </motion.article>
  );
}
