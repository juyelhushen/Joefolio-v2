import { ArrowUpRight, Github } from 'lucide-react';
import ProjectVisual from '../../components/ProjectVisual';
import ScrollReveal from '../../components/ScrollReveal';
import { projects } from '../../data/projects';
import './ProjectsSection.css';

type ProjectsSectionProps = {
  reduceMotion: boolean;
};

export default function ProjectsSection({ reduceMotion }: ProjectsSectionProps) {
  return (
    <section
      className="project-section section-wrap"
      id="projects"
      aria-labelledby="projects-title"
      data-reduced-motion={reduceMotion}
    >
      <ScrollReveal className="projects-heading">
        <div>
          <span className="section-kicker">A FEW THINGS I’VE MADE</span>
          <h2 id="projects-title">
            Selected <em>Work.</em>
          </h2>
        </div>
        <p>
          A handful of projects shaped by curiosity, thoughtful engineering, and a love of building.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <div className="project-gallery">
          {projects.map((project, index) => (
            <article
              className={`project-gallery-card${index === 0 ? ' project-gallery-card-featured' : ''}`}
              key={project.id}
              aria-labelledby={`project-title-${project.id}`}
            >
              <div className={`project-gallery-cover project-gallery-cover-${project.visual}`}>
                <ProjectVisual visual={project.visual} />
              </div>

              <div className="project-gallery-content">
                <div className="project-gallery-copy">
                  <h3 id={`project-title-${project.id}`}>{project.name}</h3>
                  <p>{project.summary}</p>
                </div>

                <ul className="project-gallery-tags" aria-label={`${project.name} technologies`}>
                  {project.technologies.slice(0, 4).map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>

                <div className="project-gallery-actions">
                  <a
                    className="project-gallery-link"
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${project.name}: view GitHub repository`}
                  >
                    <Github size={16} aria-hidden="true" />
                    <span>GitHub</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                  {project.demoUrl && (
                    <a
                      className="project-gallery-demo"
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live demo
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
