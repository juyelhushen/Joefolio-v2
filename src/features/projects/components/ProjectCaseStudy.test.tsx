import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProjectCaseStudy from './ProjectCaseStudy';
import { projects, type Project } from '../data/projects';

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
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

it('renders supplied optional fields and screenshot without altering authoritative project data', () => {
  const project: Project = {
    ...projects[0],
    role: 'Test fixture role',
    outcome: 'Test fixture outcome',
    metrics: [{ label: 'Fixture metric', value: 'Fixture value' }],
    lessons: ['Test fixture lesson'],
    image: { src: '/test-fixture.png', alt: 'Test fixture architecture screenshot' },
    technologies: [...projects[0].technologies, 'Fixture fifth technology'],
    demoUrl: 'https://example.test/demo',
  };
  render(
    <ProjectCaseStudy project={project} accent="var(--cyan)" reduceMotion onClose={vi.fn()} />,
  );
  const dialog = screen.getByRole('dialog');
  for (const text of [
    'Test fixture role',
    'Test fixture outcome',
    'Fixture metric',
    'Fixture value',
    'Test fixture lesson',
    'Fixture fifth technology',
  ]) {
    expect(within(dialog).getByText(text)).toBeTruthy();
  }
  expect(
    within(dialog)
      .getByAltText(project.image?.alt ?? '')
      .getAttribute('src'),
  ).toBe('/test-fixture.png');
  expect(within(dialog).getByRole('link', { name: 'Live demo' }).getAttribute('href')).toBe(
    project.demoUrl,
  );
  expect(projects[0].role).toBeUndefined();
});
