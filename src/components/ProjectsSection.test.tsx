import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import ProjectsSection from './ProjectsSection';
import ProjectUniverse from './ProjectUniverse';
import { projects } from '../data/projects';

afterEach(cleanup);

it('renders a navigable archive with a distinct visual for every typed project', () => {
  render(<ProjectsSection reduceMotion={false} />);

  const archive = screen.getByRole('group', { name: 'Project archive' });
  expect(projects).toHaveLength(5);
  expect(within(archive).getAllByRole('button')).toHaveLength(5);
  for (const project of projects) {
    expect(within(archive).getByRole('button', { name: new RegExp(project.name) })).toBeTruthy();
    fireEvent.click(within(archive).getByRole('button', { name: new RegExp(project.name) }));
    expect(document.querySelector(`.mission-visual-${project.visual}`)).toBeTruthy();
    expect(
      within(document.getElementById('mission-feature')!).getByRole('heading', {
        level: 3,
        name: project.name,
      }),
    ).toBeTruthy();
  }
});

it('updates the featured project and visual when selected by keyboard', () => {
  render(<ProjectsSection reduceMotion={false} />);

  const archive = screen.getByRole('group', { name: 'Project archive' });
  const selection = within(archive).getByRole('button', { name: /YouTube Clone/ });
  selection.focus();
  fireEvent.keyDown(selection, { key: 'Enter' });
  fireEvent.click(selection);

  expect(selection.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('heading', { level: 3, name: 'YouTube Clone' })).toBeTruthy();
  expect(document.querySelector('.mission-visual-video')).toBeTruthy();
  expect(
    document.querySelector('.project-universe-node[data-project-id="youtube-clone"]')?.classList,
  ).toContain('is-active');
});

it('renders the verified stacks and repository links for the YouTube and library projects', () => {
  render(<ProjectsSection reduceMotion={false} />);

  const archive = screen.getByRole('group', { name: 'Project archive' });
  fireEvent.click(within(archive).getByRole('button', { name: /YouTube Clone/ }));
  expect(screen.getByRole('list', { name: 'YouTube Clone technologies' }).textContent).toContain(
    'AWS S3',
  );
  expect(
    screen.getByRole('link', { name: 'YouTube Clone: S3 upload service' }).getAttribute('href'),
  ).toBe(
    'https://github.com/juyelhushen/youtube-clone/blob/master/backend/src/main/java/com/youtubeclone/service/S3Service.java',
  );
  expect(screen.getByRole('link', { name: 'YouTube Clone: Repository' }).getAttribute('href')).toBe(
    'https://github.com/juyelhushen/youtube-clone',
  );
  expect(screen.getByText(/Java 17 \/ Spring Boot 3.1.4 Maven backend uses MongoDB/)).toBeTruthy();
  expect(document.querySelector('.visual-video-storage')?.textContent).toContain('AWS S3');
  expect(document.querySelector('.visual-video-timeline-label')?.textContent).toContain(
    'PLAYBACK TIMELINE',
  );

  fireEvent.click(within(archive).getByRole('button', { name: /Library Management System/ }));
  const libraryTech = screen.getByRole('list', {
    name: 'Library Management System technologies',
  }).textContent;
  expect(libraryTech).toContain('Angular 15.2');
  expect(libraryTech).toContain('Spring Data JPA');
  expect(libraryTech).toContain('PostgreSQL JDBC');
  expect(libraryTech).toContain('JWT');
  expect(
    screen.getByRole('link', { name: 'Library Management System: Order API' }).getAttribute('href'),
  ).toBe(
    'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/controller/OrderController.java',
  );
  expect(document.querySelector('.visual-library-flow')?.textContent).toContain('BOOK RECORD');
  expect(document.querySelector('.visual-library-flow')?.textContent).toContain('RETURN');
});

it('uses only verified GitHub destinations and keeps Docker unassociated with these projects', () => {
  for (const project of projects) {
    for (const link of project.links) {
      expect(link.href).toMatch(/^https:\/\/github\.com\/juyelhushen\//);
    }
  }
  expect(projects.find((project) => project.id === 'youtube-clone')?.technologies).toContain(
    'AWS S3',
  );
  expect(
    projects.some((project) =>
      project.technologies.some((technology) => /docker/i.test(technology)),
    ),
  ).toBe(false);
});

it('keeps the archive interactive without entrance transitions for reduced motion', () => {
  render(<ProjectsSection reduceMotion />);

  expect(document.querySelector('.mission-feature-host')?.getAttribute('data-reduced-motion')).toBe(
    'true',
  );
  expect(document.querySelector('.project-universe-graphic')?.getAttribute('data-motion')).toBe(
    'reduced',
  );
  expect(document.querySelector('.project-universe-graphic animateMotion')).toBeNull();
  const youtube = screen.getByRole('button', { name: /YouTube Clone/ });
  fireEvent.click(youtube);
  expect(youtube.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('heading', { level: 3, name: 'YouTube Clone' })).toBeTruthy();
});

it('animates packets along constellation routes in the normal-motion state', () => {
  render(<ProjectUniverse activeProjectId="sentinel" reduceMotion={false} />);

  expect(document.querySelectorAll('.project-universe-route')).toHaveLength(5);
  expect(document.querySelectorAll('.project-universe-graphic animateMotion')).toHaveLength(5);
  expect(
    document.querySelector('.project-universe-node[data-project-id="sentinel"]')?.classList,
  ).toContain('is-active');
});
