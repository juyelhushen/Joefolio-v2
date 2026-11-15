export type SkillDomainId = 'backend' | 'frontend' | 'data' | 'ai';

export type SkillGroup = Readonly<{
  id: SkillDomainId;
  name: string;
  skills: readonly string[];
}>;

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
