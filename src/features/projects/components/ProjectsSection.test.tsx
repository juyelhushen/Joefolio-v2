import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProjectsSection from './ProjectsSection';
import { projects } from '../data/projects';

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});

afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.restoreAllMocks();
});

it('renders each project as a plain list entry with a case-study and repository link', () => {
  render(<ProjectsSection />);
  const list = screen.getByRole('list');
  expect(within(list).getAllByRole('listitem')).toHaveLength(projects.length);

  for (const [index, project] of projects.entries()) {
    const row = within(list).getAllByRole('listitem')[index];
    const title = within(row).getByRole('heading', { level: 3, name: project.name });
    expect(title.querySelector('a')?.getAttribute('href')).toBe(`#projects/${project.id}`);
    expect(within(row).getByText(project.summary)).toBeTruthy();
    expect(within(row).getByText(project.category)).toBeTruthy();
    expect(row.querySelectorAll('.project-tags span').length).toBeGreaterThan(0);
    expect(within(row).getByRole('link', { name: 'Case study' }).getAttribute('href')).toBe(
      `#projects/${project.id}`,
    );
    const repository = within(row).getByRole('link', { name: 'Repository' });
    expect(repository.getAttribute('href')).toBe(project.repositoryUrl);
    expect(repository.getAttribute('rel')).toBe('noopener noreferrer');
  }
  expect(document.querySelector('.project-gallery')).toBeNull();
  expect(document.querySelector('.project-visual')).toBeNull();
});

it('opens and dismisses a case study while preserving the project deep link', async () => {
  render(<ProjectsSection />);
  const opener = screen.getAllByRole('link', { name: 'Case study' })[0];
  opener.focus();
  fireEvent.click(opener);

  const dialog = await screen.findByRole('dialog', { name: projects[0].name });
  expect(location.hash).toBe(`#projects/${projects[0].id}`);
  expect(within(dialog).getByText(projects[0].problem)).toBeTruthy();
  expect(within(dialog).getByRole('heading', { name: 'Engineering decisions' })).toBeTruthy();
  expect(document.activeElement).toBe(
    within(dialog).getByRole('button', { name: 'Close case study' }),
  );
  fireEvent.keyDown(dialog, { key: 'Escape' });

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(location.hash).toBe('#projects');
  expect(document.activeElement).toBe(opener);
  expect(document.body.style.overflow).toBe('');
});

it('opens a case study directly from a project hash', async () => {
  history.replaceState(null, '', `#projects/${projects[1].id}`);
  render(<ProjectsSection />);
  expect(await screen.findByRole('dialog', { name: projects[1].name })).toBeTruthy();
  history.replaceState(null, '', '#projects');
  fireEvent(window, new PopStateEvent('popstate'));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
