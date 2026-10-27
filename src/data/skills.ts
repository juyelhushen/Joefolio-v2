export type SkillDomainId = 'backend' | 'frontend' | 'data' | 'ai';

export type SkillProjectEvidence = {
  projectName: string;
  linkLabel?: string;
};

export type SkillGroup = {
  id: SkillDomainId;
  name: string;
  skills: readonly string[];
};

export type SkillPlanet = {
  id: string;
  name: string;
  domainId: SkillDomainId;
  icon: string;
  color: string;
  orbit: 1 | 2 | 3 | 4 | 5 | 6;
  durationSeconds: number;
  phaseDegrees: number;
  direction: 'clockwise' | 'counterclockwise';
  description: string;
  evidenceProjects: readonly SkillProjectEvidence[];
};

export const skillGroups: readonly SkillGroup[] = [
  {
    id: 'backend',
    name: 'Backend & APIs',
    skills: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'REST APIs', 'AWS', 'Docker'],
  },
  {
    id: 'frontend',
    name: 'Frontend Engineering',
    skills: ['React', 'TypeScript', 'JavaScript', 'Responsive interfaces'],
  },
  {
    id: 'data',
    name: 'Data & Messaging',
    skills: ['PostgreSQL', 'SQLite', 'ChromaDB', 'Redis', 'Kafka', 'WebSockets'],
  },
  {
    id: 'ai',
    name: 'AI & Agentic Systems',
    skills: ['LangGraph', 'RAG', 'Ollama', 'MCP', 'Document retrieval'],
  },
];

export const skillPlanets: readonly SkillPlanet[] = [
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    domainId: 'backend',
    icon: 'springboot',
    color: '#6DB33F',
    orbit: 2,
    durationSeconds: 20,
    phaseDegrees: 35,
    direction: 'clockwise',
    description:
      'Spring Boot powers the documented Cut2Short backend API and server-side workflows.',
    evidenceProjects: [{ projectName: 'Cut2Short', linkLabel: 'Backend repository' }],
  },
  {
    id: 'react',
    name: 'React',
    domainId: 'frontend',
    icon: 'react',
    color: '#61DAFB',
    orbit: 4,
    durationSeconds: 31,
    phaseDegrees: 205,
    direction: 'counterclockwise',
    description: 'React powers the Cut2Short client interface for link management.',
    evidenceProjects: [{ projectName: 'Cut2Short', linkLabel: 'Frontend repository' }],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    domainId: 'frontend',
    icon: 'typescript',
    color: '#3178C6',
    orbit: 1,
    durationSeconds: 16,
    phaseDegrees: 240,
    direction: 'clockwise',
    description: 'TypeScript adds static typing to JavaScript application development.',
    evidenceProjects: [],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    domainId: 'data',
    icon: 'postgresql',
    color: '#8AB4D8',
    orbit: 5,
    durationSeconds: 38,
    phaseDegrees: 78,
    direction: 'clockwise',
    description: 'PostgreSQL provides relational persistence in the Cut2Short backend.',
    evidenceProjects: [{ projectName: 'Cut2Short', linkLabel: 'Backend repository' }],
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    domainId: 'data',
    icon: 'sqlite',
    color: '#7CC5F8',
    orbit: 3,
    durationSeconds: 26,
    phaseDegrees: 150,
    direction: 'clockwise',
    description:
      'The Enterprise Knowledge Assistant uses SQLite for document metadata and interaction audit logs.',
    evidenceProjects: [{ projectName: 'Enterprise Knowledge Assistant' }],
  },
  {
    id: 'redis',
    name: 'Redis',
    domainId: 'data',
    icon: 'redis',
    color: '#FF4438',
    orbit: 6,
    durationSeconds: 43,
    phaseDegrees: 315,
    direction: 'counterclockwise',
    description: 'Redis is included in the skills inventory; no project association is documented.',
    evidenceProjects: [],
  },
  {
    id: 'kafka',
    name: 'Kafka',
    domainId: 'data',
    icon: 'apachekafka',
    color: '#D7DCE5',
    orbit: 2,
    durationSeconds: 22,
    phaseDegrees: 190,
    direction: 'counterclockwise',
    description: 'Kafka is included in the skills inventory; no project association is documented.',
    evidenceProjects: [],
  },
  {
    id: 'python',
    name: 'Python',
    domainId: 'backend',
    icon: 'python',
    color: '#FFD43B',
    orbit: 5,
    durationSeconds: 35,
    phaseDegrees: 250,
    direction: 'counterclockwise',
    description: 'Python is used in the Sentinel and Enterprise Knowledge Assistant projects.',
    evidenceProjects: [
      { projectName: 'Sentinel' },
      { projectName: 'Enterprise Knowledge Assistant' },
    ],
  },
  {
    id: 'langgraph',
    name: 'LangGraph',
    domainId: 'ai',
    icon: 'langgraph',
    color: '#1C3C3C',
    orbit: 3,
    durationSeconds: 29,
    phaseDegrees: 310,
    direction: 'counterclockwise',
    description: 'LangGraph coordinates investigation and retrieval workflows in two AI projects.',
    evidenceProjects: [
      { projectName: 'Sentinel' },
      { projectName: 'Enterprise Knowledge Assistant' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    domainId: 'ai',
    icon: 'ollama',
    color: '#F3F0E8',
    orbit: 1,
    durationSeconds: 18,
    phaseDegrees: 140,
    direction: 'counterclockwise',
    description:
      'Ollama provides the model runtime for Sentinel and the Enterprise Knowledge Assistant.',
    evidenceProjects: [
      { projectName: 'Sentinel' },
      { projectName: 'Enterprise Knowledge Assistant' },
    ],
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    domainId: 'backend',
    icon: 'fastapi',
    color: '#009688',
    orbit: 4,
    durationSeconds: 34,
    phaseDegrees: 25,
    direction: 'clockwise',
    description:
      'FastAPI provides the service layer for Sentinel and the Enterprise Knowledge Assistant.',
    evidenceProjects: [
      { projectName: 'Sentinel' },
      { projectName: 'Enterprise Knowledge Assistant' },
    ],
  },
  {
    id: 'aws',
    name: 'AWS',
    domainId: 'backend',
    icon: 'aws',
    color: '#FF9900',
    orbit: 6,
    durationSeconds: 41,
    phaseDegrees: 95,
    direction: 'counterclockwise',
    description: 'The YouTube Clone uses Amazon S3 to store uploaded files.',
    evidenceProjects: [{ projectName: 'YouTube Clone' }],
  },
  {
    id: 'docker',
    name: 'Docker',
    domainId: 'backend',
    icon: 'docker',
    color: '#2496ED',
    orbit: 3,
    durationSeconds: 27,
    phaseDegrees: 5,
    direction: 'clockwise',
    description:
      'Docker is included in the skills inventory; no project-specific configuration is documented.',
    evidenceProjects: [],
  },
];
