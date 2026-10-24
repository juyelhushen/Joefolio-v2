import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import SkillsSection from './SkillsSection';
import { projects } from '../data/projects';
import { skillGroups } from '../data/skills';

afterEach(cleanup);

function renderSkills(reduceMotion = false) {
  render(<SkillsSection reduceMotion={reduceMotion} />);
  return screen.getByRole('region', { name: 'The Skill Galaxy.' });
}

it('renders each domain and skill from the typed inventory', () => {
  const section = renderSkills();

  expect(section.querySelectorAll('.skill-orbit-planet')).toHaveLength(skillGroups.length);
  for (const group of skillGroups) {
    const button = within(section).getByRole('button', { name: group.name });
    expect(button).toBeTruthy();
    fireEvent.click(button);

    const detail = document.getElementById('skill-detail');
    if (!detail) throw new Error('The selected skills detail panel should be rendered.');
    expect(within(detail).getByRole('heading', { name: group.name })).toBeTruthy();
    for (const skill of group.skills) {
      expect(within(detail).getByText(skill)).toBeTruthy();
    }
  }
});

it('keeps domain selectors focusable buttons with pressed state and keyboard activation semantics', () => {
  const section = renderSkills(true);
  const backend = within(section).getByRole('button', { name: 'Backend & APIs' });
  const ai = within(section).getByRole('button', { name: 'AI & Agentic Systems' });

  expect(backend.tagName).toBe('BUTTON');
  expect(backend.tabIndex).toBe(0);
  expect(backend.getAttribute('aria-pressed')).toBe('true');

  ai.focus();
  expect(document.activeElement).toBe(ai);
  fireEvent.click(ai);

  expect(ai.getAttribute('aria-pressed')).toBe('true');
  expect(backend.getAttribute('aria-pressed')).toBe('false');
  expect(document.getElementById('skill-detail')?.textContent).toContain(
    'document-grounded retrieval',
  );
});

it('shows only evidence links present in the project data for each domain', () => {
  const section = renderSkills();

  for (const group of skillGroups) {
    fireEvent.click(within(section).getByRole('button', { name: group.name }));
    const detail = document.getElementById('skill-detail');
    if (!detail) throw new Error('The selected skills detail panel should be rendered.');

    const expectedLinks = group.evidenceProjects.flatMap(({ projectName, linkLabel }) => {
      const project = projects.find((item) => item.name === projectName);
      return (
        project?.links
          .filter((link) => !linkLabel || link.label === linkLabel)
          .map((link) => link.href) ?? []
      );
    });
    const links = within(detail).getAllByRole('link');

    expect(links.map((link) => link.getAttribute('href'))).toEqual(expectedLinks);
    expect(
      links.every(
        (link) =>
          link.getAttribute('target') === '_blank' &&
          link.getAttribute('rel') === 'noopener noreferrer',
      ),
    ).toBe(true);
    expect(
      expectedLinks.every((href) =>
        projects.some((project) => project.links.some((link) => link.href === href)),
      ),
    ).toBe(true);
  }
});
