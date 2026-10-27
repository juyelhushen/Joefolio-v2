import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import ProjectsSection from './ProjectsSection';
import { projects } from '../../data/projects';

afterEach(cleanup);

it('renders five concise project cards with accurate copy and decorative covers', () => {
  render(<ProjectsSection reduceMotion={false} />);

  expect(screen.getByRole('heading', { level: 2, name: 'Selected Work.' })).toBeTruthy();
  const cards = screen.getAllByRole('article');
  expect(projects).toHaveLength(5);
  expect(cards).toHaveLength(5);

  for (const project of projects) {
    const card = screen.getByRole('article', { name: project.name });
    expect(within(card).getByRole('heading', { level: 3, name: project.name })).toBeTruthy();
    expect(within(card).getByText(project.summary)).toBeTruthy();
    expect(within(card).getAllByRole('listitem')).toHaveLength(
      Math.min(project.technologies.length, 4),
    );
    expect(
      within(card)
        .getByRole('link', { name: `${project.name}: view GitHub repository` })
        .getAttribute('href'),
    ).toBe(project.repositoryUrl);
    expect(card.querySelector(`.mission-visual-${project.visual}`)).toBeTruthy();
    expect(card.querySelector('.mission-visual')?.getAttribute('aria-hidden')).toBe('true');
    expect(card.querySelector('img')).toBeNull();
    expect(card.querySelectorAll('.visual-art svg').length).toBeGreaterThanOrEqual(1);
    expect(
      [...card.querySelectorAll<SVGSVGElement>('.visual-art svg')].every((icon) => {
        const computed = window.getComputedStyle(icon);
        return computed.opacity !== '0' && computed.visibility !== 'hidden';
      }),
    ).toBe(true);
  }
});

it('shows only a verified repository action when no live demo is configured', () => {
  render(<ProjectsSection reduceMotion={false} />);

  for (const project of projects) {
    const card = screen.getByRole('article', { name: project.name });
    expect(project.demoUrl).toBeUndefined();
    expect(within(card).getAllByRole('link')).toHaveLength(1);
    expect(within(card).queryByText(/live demo/i)).toBeNull();
  }
});

it('keeps implementation notes and deep source links out of the gallery', () => {
  render(<ProjectsSection reduceMotion={false} />);

  expect(screen.queryByText(/engineering focus/i)).toBeNull();
  expect(screen.queryByText(/^problem$/i)).toBeNull();
  expect(screen.queryByText(/^approach$/i)).toBeNull();
  expect(screen.queryByText(/source-backed workflow/i)).toBeNull();
  expect(screen.queryByText(/inspect source/i)).toBeNull();
  expect(screen.queryByRole('group', { name: /project archive/i })).toBeNull();
  expect(screen.queryByLabelText(/source files/i)).toBeNull();
});

it('exposes repository links as keyboard-focusable external links', () => {
  render(<ProjectsSection reduceMotion={false} />);

  for (const project of projects) {
    const link = screen.getByRole('link', { name: `${project.name}: view GitHub repository` });
    link.focus();
    expect(document.activeElement).toBe(link);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  }
});

it('keeps the gallery visible and its decorative transitions disabled for reduced motion', () => {
  render(<ProjectsSection reduceMotion />);

  const section = document.getElementById('projects');
  expect(section?.getAttribute('data-reduced-motion')).toBe('true');
  expect(screen.getAllByRole('article')).toHaveLength(5);
  expect(document.querySelectorAll('.project-universe-graphic')).toHaveLength(0);
});

it('uses only the verified project repository destinations in the primary actions', () => {
  for (const project of projects) {
    const repository = new URL(project.repositoryUrl);
    expect(repository.protocol).toBe('https:');
    expect(repository.hostname).toBe('github.com');
    expect(repository.pathname).toMatch(/^\/juyelhushen\/[^/]+$/);
    expect(project.links.some((link) => link.href === project.repositoryUrl)).toBe(true);
    expect(project.architecture.sourceLinks.length).toBeGreaterThan(0);
    expect(project.technologies.length).toBeGreaterThanOrEqual(3);
    expect(project.technologies.length).toBeLessThanOrEqual(4);
    expect(project.summary.split(/\s+/).length).toBeLessThanOrEqual(20);
  }
});
