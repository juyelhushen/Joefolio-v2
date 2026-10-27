import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import SkillsSection from './SkillsSection';
import { projects } from '../../data/projects';
import { skillGroups, skillPlanets } from '../../data/skills';

afterEach(cleanup);

function renderSkills(reduceMotion = false) {
  render(<SkillsSection reduceMotion={reduceMotion} />);
  return screen.getByRole('region', { name: 'The Skill Solar System.' });
}

it('renders orbiting technology planets from the existing skills inventory', () => {
  const section = renderSkills();
  const planetButtons = within(section).getAllByRole('button');

  expect(planetButtons).toHaveLength(skillPlanets.length);
  for (const planet of skillPlanets) {
    const group = skillGroups.find((item) => item.id === planet.domainId);
    expect(group?.skills).toContain(planet.name);
    expect(
      within(section).getByRole('button', { name: `Select ${planet.name} skill` }),
    ).toBeTruthy();
    expect(document.querySelector(`.skill-orbit-frame-${planet.orbit}`)).toBeTruthy();
  }
});

it('keeps every technology visible under its scannable category', () => {
  const section = renderSkills();

  for (const group of skillGroups) {
    expect(within(section).getByRole('heading', { level: 3, name: group.name })).toBeTruthy();
    for (const skill of group.skills) {
      expect(within(section).getByText(skill, { selector: '.skill-category li' })).toBeTruthy();
    }
  }
});

it('includes AWS with YouTube S3 evidence and Docker without an unsupported project claim', () => {
  const section = renderSkills();

  for (const name of ['AWS', 'Docker']) {
    expect(within(section).getByRole('button', { name: `Select ${name} skill` })).toBeTruthy();
    expect(skillGroups.find((group) => group.id === 'backend')?.skills).toContain(name);
  }

  fireEvent.click(within(section).getByRole('button', { name: 'Select AWS skill' }));
  expect(section.textContent).toContain('Amazon S3');
  const youtubeRepositoryLink = within(section)
    .getAllByRole('link')
    .find((link) => link.getAttribute('href') === 'https://github.com/juyelhushen/youtube-clone');
  expect(youtubeRepositoryLink).toBeTruthy();

  fireEvent.click(within(section).getByRole('button', { name: 'Select Docker skill' }));
  expect(section.textContent).toContain('no project-specific configuration is documented');
  expect(within(section).queryByRole('link')).toBeNull();
});

it('does not associate Redis or Kafka with the unsupported Cut2Short claims', () => {
  const section = renderSkills();

  for (const name of ['Redis', 'Kafka']) {
    fireEvent.click(within(section).getByRole('button', { name: `Select ${name} skill` }));
    expect(section.textContent).toContain(`${name} is included in the skills inventory`);
    expect(section.textContent).not.toContain('Cut2Short');
    expect(within(section).queryByRole('link')).toBeNull();
  }
});

it('configures distinct continuous orbital speeds and phase offsets', () => {
  renderSkills();

  const durations = new Set<number>();
  for (const planet of skillPlanets) {
    expect(planet.durationSeconds).toBeGreaterThanOrEqual(14);
    expect(planet.durationSeconds).toBeLessThanOrEqual(45);
    durations.add(planet.durationSeconds);
    const button = screen.getByRole('button', { name: `Select ${planet.name} skill` });
    const frame = button.parentElement;
    expect(frame?.getAttribute('data-orbit-duration')).toBe(String(planet.durationSeconds));
    expect((frame as HTMLElement | null)?.style.animationDuration).toBe(
      `${planet.durationSeconds}s`,
    );
    expect((frame as HTMLElement | null)?.style.animationDelay).toBe(
      `${-(planet.durationSeconds * planet.phaseDegrees) / 360}s`,
    );
  }
  expect(durations.size).toBe(skillPlanets.length);
});

it('updates the details panel when a planet is selected with the keyboard', () => {
  const section = renderSkills();
  const initial = screen.getByRole('button', { name: 'Select Spring Boot skill' });
  const selected = screen.getByRole('button', { name: 'Select LangGraph skill' });

  expect(initial.getAttribute('aria-pressed')).toBe('true');
  selected.focus();
  expect(document.activeElement).toBe(selected);
  fireEvent.keyDown(selected, { key: 'Enter' });
  fireEvent.click(selected);

  expect(selected.getAttribute('aria-pressed')).toBe('true');
  expect(initial.getAttribute('aria-pressed')).toBe('false');
  expect(within(section).getByRole('heading', { level: 3, name: 'LangGraph' })).toBeTruthy();
  expect(section.textContent).toContain('coordinates investigation and retrieval workflows');
  expect(within(section).queryByRole('heading', { level: 4 })).toBeNull();
  expect(within(section).queryAllByRole('link')).toHaveLength(2);
});

it('shows only project links assigned to the selected planet', () => {
  const section = renderSkills();

  for (const planet of skillPlanets) {
    fireEvent.click(within(section).getByRole('button', { name: `Select ${planet.name} skill` }));
    const expectedLinks = planet.evidenceProjects.flatMap(({ projectName, linkLabel }) => {
      const project = projects.find((item) => item.name === projectName);
      return (
        project?.links
          ?.filter((link) => !linkLabel || link.label === linkLabel)
          .slice(0, 1)
          .map((link) => link.href) ?? []
      );
    });
    const links = within(section).queryAllByRole('link');

    expect(links.length).toBeLessThanOrEqual(2);
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
        projects.some((project) => project.links?.some((link) => link.href === href)),
      ),
    ).toBe(true);
    if (expectedLinks.length === 0) {
      expect(within(section).queryByRole('link')).toBeNull();
    }
  }
});

it('stops orbit animations for reduced motion while keeping all planet controls available', () => {
  const section = renderSkills(true);

  expect(section.querySelector('.skills-orbit-scene')?.getAttribute('data-reduced-motion')).toBe(
    'true',
  );
  for (const planet of skillPlanets) {
    const button = within(section).getByRole('button', { name: `Select ${planet.name} skill` });
    expect(button).toBeTruthy();
    expect(button.parentElement?.getAttribute('data-orbit-duration')).toBe(
      String(planet.durationSeconds),
    );
  }
  expect(
    (screen.getByRole('button', { name: 'Select Spring Boot skill' }).parentElement as HTMLElement)
      .style.transform,
  ).toContain('rotate(35deg)');
});
