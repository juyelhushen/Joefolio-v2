import { lazy, Suspense, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../data/projects';
import LoadBoundary from '../../../components/common/LoadBoundary';
import './ProjectCaseStudy.css';

const ArchitectureFlow = lazy(() => import('./ArchitectureFlow'));

type Props = {
  project: Project;
  onClose: () => void;
};

export default function ProjectCaseStudy({ project, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    const scrollbarGutter = document.documentElement.style.scrollbarGutter;
    dialog.showModal();
    closeRef.current?.focus();
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      document.documentElement.style.scrollbarGutter = scrollbarGutter;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [project.id]);

  return (
    <dialog
      ref={dialogRef}
      className="project-case-study"
      aria-labelledby={`case-study-title-${project.id}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="case-study-panel">
        <div className="case-study-toolbar">
          <button
            className="button button-secondary button-icon"
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close case study"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="case-study-copy">
          <span className="case-study-kicker">{project.category}</span>
          <h2 id={`case-study-title-${project.id}`}>{project.name}</h2>
          <p>{project.summary}</p>
          <section>
            <h3>The problem</h3>
            <p>{project.problem}</p>
          </section>
          {project.engineeringFocus && (
            <section>
              <h3>What I focused on</h3>
              <p>{project.engineeringFocus}</p>
            </section>
          )}
          <section>
            <h3>How it works</h3>
            <LoadBoundary
              label="the architecture diagram"
              fallback={
                <div role="alert">
                  <p>The interactive diagram could not load. System components:</p>
                  <ul>
                    {project.architecture.lanes.map((lane) => (
                      <li key={lane.label}>
                        {lane.label}: {lane.steps.join(' -> ')}
                      </li>
                    ))}
                  </ul>
                </div>
              }
            >
              <Suspense fallback={<div className="architecture-loading" aria-busy="true" />}>
                <ArchitectureFlow architecture={project.architecture} />
              </Suspense>
            </LoadBoundary>
          </section>
          <section>
            <h3>Stack</h3>
            <ul className="case-study-stack">
              {project.technologies.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Engineering decisions</h3>
            <ul>
              {project.decisions.map((decision) => (
                <li key={decision}>{decision}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Challenges and trade-offs</h3>
            <ul>
              {project.tradeoffs.map((tradeoff) => (
                <li key={tradeoff}>{tradeoff}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Testing and reliability</h3>
            <ul>
              {project.reliability.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
          {project.role && (
            <section>
              <h3>Role</h3>
              <p>{project.role}</p>
            </section>
          )}
          {project.outcome && (
            <section>
              <h3>Outcome</h3>
              <p>{project.outcome}</p>
            </section>
          )}
          {!!project.metrics?.length && (
            <section>
              <h3>Metrics</h3>
              <dl>
                {project.metrics.map((metric) => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {!!project.lessons?.length && (
            <section>
              <h3>Lessons</h3>
              <ul>
                {project.lessons.map((lesson) => (
                  <li key={lesson}>{lesson}</li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h3>Verify it yourself</h3>
            <ul className="case-study-sources">
              {project.architecture.sourceLinks.map((link) => (
                <li key={link.href}>
                  <a
                    className="button button-tertiary"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  className="button button-tertiary"
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub repository
                </a>
              </li>
              {project.demoUrl && (
                <li>
                  <a
                    className="button button-tertiary"
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Live demo
                  </a>
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </dialog>
  );
}
