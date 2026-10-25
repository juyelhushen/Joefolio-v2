export type CareerChapter = 1 | 2 | 3 | 4;

export type Experience = {
  id: string;
  chapter: CareerChapter;
  employer: string;
  role: string;
  dates?: string;
  current?: boolean;
};

export const experience: readonly Experience[] = [
  {
    id: 'apexon',
    chapter: 4,
    employer: 'Apexon',
    role: 'Software Engineer II',
    dates: 'December 2025 – Present',
    current: true,
  },
  {
    id: 'cdac',
    chapter: 3,
    employer: 'C-DAC',
    role: 'Project Engineer',
    dates: 'September 2024 – December 2025',
  },
  {
    id: 'nayamsoft',
    chapter: 2,
    employer: 'Nayamsoft',
    role: 'Software Engineer',
    dates: 'April 2022 – June 2024',
  },
  {
    id: 'test-yantra',
    chapter: 1,
    employer: 'Test Yantra',
    role: 'Java Developer Intern',
  },
];
