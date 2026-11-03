import { expect, it } from 'vitest';
import { filterItems, getPaletteItems, matchScore } from './palette-items';
import { navItems } from '../../components/layout/Navbar/navItems';
import { projects } from '../projects/data/projects';
import { PROFILE_LINKS, RESUME_PATH } from '../../lib/profile';

it('derives destinations from the authoritative navigation, projects and profile modules', () => {
  const items = getPaletteItems(true);
  expect(items.some((item) => /copy email|reduce effects/i.test(item.label))).toBe(false);
  expect(items.every((item) => ['section', 'project', 'link'].includes(item.kind))).toBe(true);
  expect(items.filter((item) => item.group === 'Sections').map((item) => item.label)).toEqual(
    navItems.map((item) => item.label),
  );
  expect(items.filter((item) => item.group === 'Projects').map((item) => item.label)).toEqual(
    projects.map((item) => item.name),
  );
  for (const href of Object.values(PROFILE_LINKS)) {
    expect(items.some((item) => item.kind === 'link' && item.href === href)).toBe(true);
  }
  expect(items.find((item) => item.id === 'resume')).toMatchObject({ href: RESUME_PATH });
  expect(getPaletteItems(false).some((item) => item.id === 'resume')).toBe(false);
});

it('matches case-insensitive words and subsequences, prefers direct matches, and excludes misses', () => {
  expect(matchScore('Software Engineer', 'SWE')).toBeLessThan(Infinity);
  expect(matchScore('Software Engineer', 'engineer soft')).toBeLessThan(Infinity);
  expect(matchScore('Projects', 'project')).toBeLessThan(matchScore('Personal project', 'project'));
  expect(matchScore('Projects', 'xyz')).toBe(Infinity);
  const items = getPaletteItems(false);
  expect(filterItems(items, '   ')).toEqual(items);
  expect(filterItems(items, 'sentinel').map((item) => item.id)).toEqual([
    `project-${projects[0].id}`,
  ]);
  expect(filterItems(items, 'doesnotexist')).toEqual([]);
});
