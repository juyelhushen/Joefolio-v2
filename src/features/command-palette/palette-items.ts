import { navItems } from '../../components/layout/Navbar/navItems';
import { projects } from '../projects/data/projects';
import { PROFILE_LINKS, RESUME_FILENAME, RESUME_PATH } from '../../lib/profile';

export type NavigationId = (typeof navItems)[number]['id'];
export type PaletteItem = {
  readonly id: string;
  readonly label: string;
  readonly group: 'Sections' | 'Projects' | 'Actions';
  readonly keywords?: string;
} & (
  | { readonly kind: 'section'; readonly section: NavigationId }
  | { readonly kind: 'project'; readonly projectId: string }
  | { readonly kind: 'link'; readonly href: string; readonly download?: string }
);

export function getPaletteItems(hasResume: boolean): readonly PaletteItem[] {
  return [
    ...navItems.map(({ id, label }): PaletteItem => ({
      id: `section-${id}`,
      label,
      group: 'Sections',
      kind: 'section',
      section: id,
    })),
    ...projects.map((project): PaletteItem => ({
      id: `project-${project.id}`,
      label: project.name,
      keywords: project.technologies.join(' '),
      group: 'Projects',
      kind: 'project',
      projectId: project.id,
    })),
    ...(hasResume
      ? [
          {
            id: 'resume',
            label: 'Download résumé',
            group: 'Actions',
            kind: 'link',
            href: RESUME_PATH,
            download: RESUME_FILENAME,
          } as const,
        ]
      : []),
    ...Object.entries(PROFILE_LINKS).map(([name, href]): PaletteItem => ({
      id: name,
      label: `Open ${name === 'github' ? 'GitHub' : name === 'linkedin' ? 'LinkedIn' : 'LeetCode'}`,
      group: 'Actions',
      kind: 'link',
      href,
    })),
  ];
}

export function matchScore(label: string, query: string): number {
  const text = label.toLocaleLowerCase();
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return 0;
  let score = 0;
  for (const word of needle.split(/\s+/)) {
    const direct = text.indexOf(word);
    if (direct >= 0) {
      score += direct + (direct === 0 || text[direct - 1] === ' ' ? 0 : 10);
      continue;
    }
    let position = -1;
    for (const character of word) {
      position = text.indexOf(character, position + 1);
      if (position === -1) return Infinity;
      score += position + 20;
    }
  }
  return score;
}

export function filterItems(items: readonly PaletteItem[], query: string): readonly PaletteItem[] {
  const groups = ['Sections', 'Projects', 'Actions'];
  return items
    .map((item) => ({ item, score: matchScore(`${item.label} ${item.keywords ?? ''}`, query) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort(
      (a, b) => groups.indexOf(a.item.group) - groups.indexOf(b.item.group) || a.score - b.score,
    )
    .map(({ item }) => item);
}
