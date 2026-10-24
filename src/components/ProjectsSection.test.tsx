import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import ProjectsSection from './ProjectsSection';
import { projects } from '../data/projects';

afterEach(cleanup);

it('renders a navigable archive with a distinct visual for every typed project', () => {
  render(<ProjectsSection reduceMotion={false} />);

  const archive = screen.getByRole('group', { name: 'Project archive' });
  expect(within(archive).getAllByRole('button')).toHaveLength(projects.length);
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
});

it('does not invent technologies or links for the earlier projects', () => {
  render(<ProjectsSection reduceMotion={false} />);

  const archive = screen.getByRole('group', { name: 'Project archive' });
  for (const name of ['Library Management System', 'YouTube Clone']) {
    fireEvent.click(within(archive).getByRole('button', { name: new RegExp(name) }));
    expect(screen.getByRole('heading', { level: 3, name })).toBeTruthy();
    expect(screen.queryByRole('list', { name: `${name} technologies` })).toBeNull();
    expect(screen.queryByRole('link', { name: new RegExp(`${name}:`) })).toBeNull();
    expect(screen.queryByText('Engineering focus')).toBeNull();
  }
});

it('keeps the archive interactive without entrance transitions for reduced motion', () => {
  render(<ProjectsSection reduceMotion />);

  expect(document.querySelector('.mission-feature-host')?.getAttribute('data-reduced-motion')).toBe(
    'true',
  );
  const youtube = screen.getByRole('button', { name: /YouTube Clone/ });
  fireEvent.click(youtube);
  expect(youtube.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('heading', { level: 3, name: 'YouTube Clone' })).toBeTruthy();
});
