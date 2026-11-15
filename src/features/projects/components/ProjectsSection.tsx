import { lazy, Suspense, useEffect, useState } from 'react';
import { projects } from '../data/projects';
import LoadBoundary from '../../../components/common/LoadBoundary';
import './ProjectsSection.css';

const ProjectCaseStudy = lazy(() => import('./ProjectCaseStudy'));

const projectFromHash = () =>
  projects.find((project) => window.location.hash === `#projects/${project.id}`) ?? null;

function isAiProject(technologies: readonly string[]) {
  return technologies.some((technology) => /^(AI|LangGraph|MCP|Ollama|RAG)$/i.test(technology));
}

export default function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState(projectFromHash);

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
      className="projects-section page-column"
      id="projects"
      aria-labelledby="projects-title"
    >
      <h2 id="projects-title">Work</h2>
      <ol className="project-list">
        {projects.map((project) => (
          <li className="project-row" key={project.id}>
            <h3>
              <a href={`#projects/${project.id}`}>{project.name}</a>
            </h3>
            <p className="project-summary">{project.summary}</p>
            <p className="project-tags" aria-label={`${project.name} tags`}>
              {[...(isAiProject(project.technologies) ? ['AI'] : []), ...project.technologies].join(
                ' · ',
              )}
            </p>
            <div className="project-links">
              <a href={`#projects/${project.id}`}>Case study</a>
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                Repository
              </a>
            </div>
          </li>
        ))}
      </ol>
      {selectedProject && (
        <LoadBoundary
          label="the case study"
          fallback={
            <div role="alert">
              <p>The case study could not load.</p>
              <button className="button" type="button" onClick={closeCaseStudy}>
                Close
              </button>
            </div>
          }
        >
          <Suspense fallback={<p role="status">Loading case study…</p>}>
            <ProjectCaseStudy
              key={selectedProject.id}
              project={selectedProject}
              onClose={closeCaseStudy}
            />
          </Suspense>
        </LoadBoundary>
      )}
    </section>
  );
}
