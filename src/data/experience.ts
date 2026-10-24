export type Experience = {
  employer: string;
  role: string;
  dates?: string;
  summary: string;
  contributions: readonly string[];
  technologies: readonly string[];
};

export const experience: readonly Experience[] = [];
