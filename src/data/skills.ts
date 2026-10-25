export type SkillIcon = 'code' | 'layers' | 'data' | 'ai';

export type SkillDomainId = 'backend' | 'frontend' | 'data' | 'ai';

export type SkillProjectEvidence = {
  projectName: string;
  linkLabel?: string;
};

export type SkillGroup = {
  id: SkillDomainId;
  name: string;
  icon: SkillIcon;
  description: string;
  skills: readonly string[];
  evidenceProjects: readonly SkillProjectEvidence[];
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
    icon: 'code',
    description:
      'API and service-boundary work documented in incident investigation, link management, and document Q&A projects.',
    skills: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'REST APIs', 'AWS', 'Docker'],
    evidenceProjects: [
      { projectName: 'Sentinel' },
      { projectName: 'Cut2Short', linkLabel: 'Backend repository' },
      { projectName: 'Enterprise Knowledge Assistant' },
    ],
  },
  {
    id: 'frontend',
    name: 'Frontend Engineering',
    icon: 'layers',
    description:
      'Building responsive interfaces with React, TypeScript, and JavaScript, including the Cut2Short client.',
    skills: ['React', 'TypeScript', 'JavaScript', 'Responsive interfaces'],
    evidenceProjects: [{ projectName: 'Cut2Short', linkLabel: 'Frontend repository' }],
  },
  {
    id: 'data',
    name: 'Data & Messaging',
    icon: 'data',
    description:
      'Persistence, caching, vector storage, and asynchronous communication documented across the selected projects.',
    skills: ['PostgreSQL', 'SQLite', 'ChromaDB', 'Redis', 'Kafka', 'WebSockets'],
    evidenceProjects: [
      { projectName: 'Cut2Short', linkLabel: 'Backend repository' },
      { projectName: 'Enterprise Knowledge Assistant' },
    ],
  },
  {
    id: 'ai',
    name: 'AI & Agentic Systems',
    icon: 'ai',
    description:
      'Exploring document-grounded retrieval, agent orchestration, and controlled tool use through practical engineering projects.',
    skills: ['LangGraph', 'RAG', 'Ollama', 'MCP', 'Document retrieval'],
    evidenceProjects: [
      { projectName: 'Sentinel' },
      { projectName: 'Enterprise Knowledge Assistant' },
    ],
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
      'The documented Cut2Short backend uses Spring Boot to provide the application API and server-side behavior.',
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
    description:
      'The Cut2Short client uses React to present link management and related application workflows.',
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
    description:
      'TypeScript is included in the existing portfolio skills inventory. Project-specific TypeScript evidence is not called out in the current project summaries.',
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
    description:
      'PostgreSQL is included in the existing skills inventory. The current project summaries do not associate it with a specific repository.',
    evidenceProjects: [],
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
    description: 'Redis caching is documented in the Cut2Short backend project.',
    evidenceProjects: [{ projectName: 'Cut2Short', linkLabel: 'Backend repository' }],
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
    description: 'The Cut2Short backend documents Kafka-based asynchronous notifications.',
    evidenceProjects: [{ projectName: 'Cut2Short', linkLabel: 'Backend repository' }],
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
    description:
      'Python is the implementation language documented for Sentinel and the Enterprise Knowledge Assistant.',
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
    description:
      'LangGraph coordinates the documented investigation agents in Sentinel and retrieval workflow in the Enterprise Knowledge Assistant.',
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
      'Ollama is the model runtime documented by Sentinel and the Enterprise Knowledge Assistant.',
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
      'FastAPI provides the service layer documented in Sentinel and the Enterprise Knowledge Assistant.',
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
    description:
      'The YouTube Clone backend uses Amazon S3 for uploaded files through a dedicated S3 service.',
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
      'Docker is part of the skills inventory. No project-specific container configuration is associated with the inspected repositories.',
    evidenceProjects: [],
  },
];
