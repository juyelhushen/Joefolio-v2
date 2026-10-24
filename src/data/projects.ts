export type ProjectVisual = 'agents' | 'links' | 'knowledge';

export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  number: string;
  name: string;
  category: string;
  problem: string;
  summary: string;
  engineeringFocus: string;
  technologies: readonly string[];
  visual: ProjectVisual;
  links: readonly ProjectLink[];
};

export const projects: readonly Project[] = [
  {
    number: '01',
    name: 'Sentinel',
    category: 'AGENT SYSTEMS',
    problem:
      'Engineering incident investigations need controlled repository access and traceable execution.',
    summary:
      'A FastAPI service starts investigations coordinated by LangGraph planner and investigator agents, with Ollama and a policy-controlled repository tool gateway.',
    engineeringFocus:
      'The public API covers incident creation and investigation. The repository describes repair and verification as a constrained internal workflow, not a public patch API.',
    technologies: ['Python', 'FastAPI', 'LangGraph', 'Ollama', 'MCP'],
    visual: 'agents',
    links: [{ label: 'Repository', href: 'https://github.com/juyelhushen/sentinel' }],
  },
  {
    number: '02',
    name: 'Cut2Short',
    category: 'FULL-STACK PLATFORM',
    problem:
      'Long URLs are harder to share and manage, while link owners need a way to review usage.',
    summary:
      'A URL-shortening application with link management, QR-code generation, and usage analytics, built with a React frontend and Java/Spring backend.',
    engineeringFocus:
      'The project README documents JWT cookies and OAuth2 authentication, Kafka and WebSocket notifications, and Redis caching.',
    technologies: ['Java 21', 'Spring Boot', 'React 19', 'Kafka', 'WebSockets', 'Redis'],
    visual: 'links',
    links: [
      {
        label: 'Backend repository',
        href: 'https://github.com/juyelhushen/Cut2Short-backend',
      },
      {
        label: 'Frontend repository',
        href: 'https://github.com/juyelhushen/cut2short-front',
      },
    ],
  },
  {
    number: '03',
    name: 'Enterprise Knowledge Assistant',
    category: 'RETRIEVAL / RAG',
    problem:
      'Answering questions across enterprise documents calls for relevant context and inspectable sources.',
    summary:
      'A document Q&A application that ingests PDFs, retrieves relevant content, and returns answers with source citations.',
    engineeringFocus:
      'A layered FastAPI application uses LangGraph for retrieval, reasoning, and citation agents, with ChromaDB for vectors and SQLite for audit logs and document metadata.',
    technologies: ['Python 3.13', 'FastAPI', 'LangGraph', 'ChromaDB', 'Ollama', 'Pytest'],
    visual: 'knowledge',
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/juyelhushen/enterprise-knowledge-assistant',
      },
    ],
  },
];
