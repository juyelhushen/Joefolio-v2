export type Project = {
  number: string;
  name: string;
  category: string;
  description: string;
  stack: string[];
  href?: string;
  status: 'verified-context' | 'needs-verification';
};

// Descriptions deliberately remain conservative until the repositories and live demos are reviewed.
export const projects: Project[] = [
  {
    number: '01',
    name: 'Cut2Short',
    category: 'FULL-STACK PLATFORM',
    description: 'A link-management product to showcase API design, application workflows, and the engineering choices behind a complete web experience.',
    stack: ['Java', 'Spring Boot', 'React', 'Kafka'],
    status: 'needs-verification',
  },
  {
    number: '02',
    name: 'Sentinel',
    category: 'AI ENGINEERING',
    description: 'An evolving engineering project. The portfolio case study will document its actual API, capabilities, integration boundaries, and current implementation status.',
    stack: ['API integration', 'AI workflows', 'Developer tooling'],
    status: 'needs-verification',
  },
  {
    number: '03',
    name: 'Finmart',
    category: 'PROFESSIONAL EXPERIENCE',
    description: 'Your previous portfolio describes work across frontend and backend for a financial marketplace. Public-facing details will be confirmed before publication.',
    stack: ['Frontend', 'Backend', 'Fintech'],
    href: 'https://finmart.ae',
    status: 'needs-verification',
  },
];
