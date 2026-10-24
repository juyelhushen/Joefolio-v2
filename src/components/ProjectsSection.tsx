import ProjectCard from './ProjectCard';
import { projects } from '../data/projects';

type ProjectsSectionProps = {
  reduceMotion: boolean;
};

export default function ProjectsSection({ reduceMotion }: ProjectsSectionProps) {
  return (
    <section
      className="project-section section-wrap"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div className="section-heading">
        <div>
          <span className="section-kicker">ENGINEERING LOG / 001</span>
          <h2 id="projects-title">
            Selected <em>work.</em>
          </h2>
        </div>
        <p>
          A closer look at the problems, system boundaries, and implementation choices behind
          selected projects.
        </p>
      </div>
      <div className="project-grid">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.name}
            project={project}
            index={index}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}
