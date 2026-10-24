export type SkillIcon = 'code' | 'layers' | 'data' | 'ai';

export type SkillGroup = {
  name: string;
  icon: SkillIcon;
  skills: readonly string[];
};

export const skillGroups: readonly SkillGroup[] = [
  {
    name: 'Backend & APIs',
    icon: 'code',
    skills: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'REST APIs'],
  },
  {
    name: 'Frontend',
    icon: 'layers',
    skills: ['React', 'TypeScript', 'JavaScript', 'Responsive interfaces'],
  },
  {
    name: 'Data & messaging',
    icon: 'data',
    skills: ['PostgreSQL', 'SQLite', 'ChromaDB', 'Redis', 'Kafka', 'WebSockets'],
  },
  {
    name: 'AI systems',
    icon: 'ai',
    skills: ['LangGraph', 'RAG', 'Ollama', 'MCP', 'Document retrieval'],
  },
];
