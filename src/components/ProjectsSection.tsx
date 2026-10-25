import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ProjectVisual from './ProjectVisual';
import ProjectUniverse from './ProjectUniverse';
import ScrollReveal from './ScrollReveal';
import { projects } from '../data/projects';

type ProjectsSectionProps = {
  reduceMotion: boolean;
};

export default function ProjectsSection({ reduceMotion }: ProjectsSectionProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0];

  return (
    <section
      className="project-section section-wrap"
      id="projects"
      aria-labelledby="projects-title"
    >
      <ScrollReveal className="section-heading mission-heading">
        <div>
          <span className="section-kicker">PROJECT UNIVERSE / 007</span>
          <h2 id="projects-title">
            The Project <em>Universe.</em>
          </h2>
        </div>
        <p>
          Five distinct systems, explored through the engineering ideas and evidence behind each.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <div
          className="project-universe-stage"
          data-active-project={selectedProject.id}
          data-reduced-motion={reduceMotion ? 'true' : 'false'}
        >
          <ProjectUniverse activeProjectId={selectedProject.id} reduceMotion={reduceMotion} />
          <div className="project-universe-caption" aria-hidden="true">
            <span>CONCEPTUAL ENGINEERING CONSTELLATION</span>
            <span>INDEPENDENT PROJECTS · SHARED CURIOSITY</span>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="mission-console">
          <div className="mission-feature-host" data-reduced-motion={reduceMotion}>
            <motion.article
              className={`mission-feature mission-feature-${selectedProject.visual}`}
              id="mission-feature"
              key={selectedProject.id}
              aria-labelledby="mission-feature-title"
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: 'easeOut' }}
            >
              <div className="mission-feature-visual">
                <div className="mission-feature-meta">
                  <span>ACTIVE FILE / {selectedProject.number}</span>
                  <span>{selectedProject.category}</span>
                </div>
                <ProjectVisual visual={selectedProject.visual} />
                <div className="mission-visual-footnote">
                  <span>ENGINEERING SCHEMATIC</span>
                  <span>CONCEPTUAL VISUALIZATION</span>
                </div>
              </div>

              <div className="mission-feature-copy">
                <div className="mission-feature-index">
                  <span>PROJECT / {selectedProject.number}</span>
                  <span className="mission-status">
                    <i /> ARCHIVE RECORD
                  </span>
                </div>
                <h3 id="mission-feature-title">{selectedProject.name}</h3>
                <div className="project-detail">
                  <span className="project-detail-label">Problem</span>
                  <p>{selectedProject.problem}</p>
                </div>
                <div className="project-detail">
                  <span className="project-detail-label">Approach</span>
                  <p className="project-summary">{selectedProject.summary}</p>
                </div>
                {selectedProject.engineeringFocus && (
                  <div className="project-focus">
                    <span className="project-detail-label">Engineering focus</span>
                    <p>{selectedProject.engineeringFocus}</p>
                  </div>
                )}

                {(selectedProject.technologies?.length ?? 0) > 0 && (
                  <ul className="tech-tags" aria-label={`${selectedProject.name} technologies`}>
                    {selectedProject.technologies?.map((technology) => (
                      <li key={technology}>{technology}</li>
                    ))}
                  </ul>
                )}

                {(selectedProject.links?.length ?? 0) > 0 && (
                  <footer className="project-footer">
                    {selectedProject.links?.map((link) => (
                      <a
                        className="project-link"
                        aria-label={`${selectedProject.name}: ${link.label}`}
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
                )}
              </div>
            </motion.article>
          </div>

          <div className="mission-navigation" role="group" aria-label="Project archive">
            <div className="mission-navigation-heading">
              <span>ARCHIVE INDEX</span>
              <span>{String(projects.length).padStart(2, '0')} PROJECTS</span>
            </div>
            <div className="mission-navigation-list">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  selected={project.id === selectedProject.id}
                  reduceMotion={reduceMotion}
                  onSelect={setSelectedProjectId}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
