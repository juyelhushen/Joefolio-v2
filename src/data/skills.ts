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

export const skillGroups: readonly SkillGroup[] = [
  {
    id: 'backend',
    name: 'Backend & APIs',
    icon: 'code',
    description:
      'API and service-boundary work documented in incident investigation, link management, and document Q&A projects.',
    skills: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'REST APIs'],
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
