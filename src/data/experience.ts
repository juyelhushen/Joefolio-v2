export type Experience = {
  id: string;
  employer: string;
  role: string;
  dates?: string;
  current?: boolean;
};

export const experience: readonly Experience[] = [
  {
    id: 'apexon',
    employer: 'Apexon',
    role: 'Software Engineer II',
    dates: 'December 2025 – Present',
    current: true,
  },
  {
    id: 'cdac',
    employer: 'C-DAC',
    role: 'Project Engineer',
    dates: 'September 2024 – December 2025',
  },
  {
    id: 'nayamsoft',
    employer: 'Nayamsoft',
    role: 'Software Engineer',
    dates: 'April 2022 – June 2024',
  },
  {
    id: 'test-yantra',
    employer: 'Test Yantra',
    role: 'Java Developer Intern',
  },
];
