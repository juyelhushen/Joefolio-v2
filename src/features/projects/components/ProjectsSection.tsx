import { ArrowUpRight, Github } from 'lucide-react';
import ProjectVisual from './ProjectVisual';
import ScrollReveal, { ScrollRevealItem } from '../../../components/common/ScrollReveal';
import { projects } from '../data/projects';
import './ProjectsSection.css';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';

const ProjectCaseStudy = lazy(() => import('./ProjectCaseStudy'));
const EventPipelinePlayground = lazy(
  () => import('../../playground/components/EventPipelinePlayground'),
);

function PlaygroundSlot({ reduceMotion }: { reduceMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (loaded || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoaded(true);
        observer.disconnect();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [loaded]);
  return (
    <div ref={ref} className="pipeline-lazy-slot">
      {loaded && (
        <Suspense fallback={null}>
          <EventPipelinePlayground reduceMotion={reduceMotion} />
        </Suspense>
      )}
    </div>
  );
}

const projectFromHash = () =>
  projects.find((project) => window.location.hash === `#projects/${project.id}`) ?? null;

type ProjectsSectionProps = {
  reduceMotion: boolean;
};

export default function ProjectsSection({ reduceMotion }: ProjectsSectionProps) {
  const [selectedProject, setSelectedProject] = useState(projectFromHash);
  const [accent, setAccent] = useState('var(--color-accent-primary)');
  useEffect(() => {
    const sync = () => setSelectedProject(projectFromHash());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);
  const closeCaseStudy = () => {
    history.replaceState(history.state, '', `${location.pathname}${location.search}#projects`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  return (
    <section
      className="project-section section-wrap"
      id="projects"
      aria-labelledby="projects-title"
      data-reduced-motion={reduceMotion}
    >
      <ScrollReveal className="projects-heading" headingReveal>
        <div>
          <span className="section-kicker">04 / PROJECTS</span>
          <h2 id="projects-title">
            <span className="heading-line-mask">
              <span className="heading-line">
                Selected <em>Work.</em>
              </span>
            </span>
          </h2>
        </div>
        <p>
          A handful of projects shaped by curiosity, thoughtful engineering, and a love of building.
        </p>
      </ScrollReveal>

      <div className="project-gallery">
        {projects.map((project, index) => (
          <ScrollReveal
            as="article"
            className={`project-gallery-card${index === 0 ? ' project-gallery-card-featured' : ''}`}
            key={project.id}
            aria-labelledby={`project-title-${project.id}`}
            data-cursor-target="card"
            duration={0.65}
            delay={(index % 3) * 0.11}
          >
            <ScrollRevealItem
              variant="scale-up"
              className={`project-gallery-cover project-gallery-cover-${project.visual}`}
              data-cursor-target="image"
            >
              <ProjectVisual visual={project.visual} />
            </ScrollRevealItem>

            <ScrollRevealItem className="project-gallery-content">
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
                <button
                  className="project-case-study-button"
                  type="button"
                  aria-label={`${project.name}: view case study`}
                  onClick={(event) => {
                    setAccent(
                      getComputedStyle(
                        event.currentTarget.closest('article') ?? event.currentTarget,
                      )
                        .getPropertyValue('--project-accent')
                        .trim() || 'var(--color-accent-primary)',
                    );
                    history.pushState(history.state, '', `#projects/${project.id}`);
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                  }}
                >
                  View case study
                </button>
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
            </ScrollRevealItem>
          </ScrollReveal>
        ))}
      </div>
      <PlaygroundSlot reduceMotion={reduceMotion} />
      <AnimatePresence>
        {selectedProject && (
          <Suspense key={selectedProject.id} fallback={null}>
            <ProjectCaseStudy
              key={selectedProject.id}
              project={selectedProject}
              accent={accent}
              reduceMotion={reduceMotion}
              onClose={closeCaseStudy}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </section>
  );
}
