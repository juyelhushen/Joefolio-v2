import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Experience } from '../data/experience';
import ExperienceTimeline from './ExperienceTimeline';

const mockedData = vi.hoisted(() => ({ entries: [] as Experience[] }));

vi.mock('../data/experience', () => ({ experience: mockedData.entries }));

afterEach(() => {
  cleanup();
  mockedData.entries.splice(0, mockedData.entries.length);
  vi.unstubAllGlobals();
});

it('renders optional experience fields only when present and labels the current role', () => {
  mockedData.entries.push(
    {
      id: 'annotated',
      chapter: 4,
      employer: 'Annotated Employer',
      role: 'Current Role',
      current: true,
      summary: 'A role summary.',
      highlights: [
        'One highlight.',
        'Two highlight.',
        'Three highlight.',
        'Four highlight.',
        'Fifth omitted.',
      ],
      stack: ['Java', 'Spring Boot'],
    },
    {
      id: 'plain',
      chapter: 3,
      employer: 'Plain Employer',
      role: 'Prior Role',
    },
  );
  render(<ExperienceTimeline reduceMotion />);

  const annotated = document.querySelector('#career-card-annotated');
  expect(screen.getByText('A role summary.')).toBeTruthy();
  expect(annotated?.querySelectorAll('.experience-highlights li')).toHaveLength(4);
  expect(annotated?.querySelector('.experience-highlights')?.tagName).toBe('UL');
  expect(annotated?.querySelectorAll('.experience-stack li')).toHaveLength(2);
  expect(screen.getByText('Current')).toBeTruthy();

  const plain = document.querySelector('#career-card-plain');
  expect(plain?.querySelector('.experience-summary')).toBeNull();
  expect(plain?.querySelector('.experience-highlights')).toBeNull();
  expect(plain?.querySelector('.experience-stack')).toBeNull();
  expect(plain?.querySelector('.experience-current')).toBeNull();
});
