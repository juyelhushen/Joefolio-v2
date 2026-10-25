export type ProjectVisual = 'agents' | 'links' | 'knowledge' | 'library' | 'video';

export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  id: string;
  number: string;
  name: string;
  category: string;
  problem: string;
  summary: string;
  engineeringFocus?: string;
  technologies: readonly string[];
  visual: ProjectVisual;
  links: readonly ProjectLink[];
};

export const projects: readonly Project[] = [
  {
    id: 'sentinel',
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
    id: 'cut2short',
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
    id: 'enterprise-knowledge-assistant',
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
  {
    id: 'library-management-system',
    number: '04',
    name: 'Library Management System',
    category: 'LIBRARY SYSTEM',
    problem:
      'A library catalogue needs book and category management alongside a straightforward order and return workflow.',
    summary:
      'A full-stack library application with book and category APIs, catalogue-management screens, and order and return endpoints.',
    engineeringFocus:
      'The Java 11 / Spring Boot 3.0.2 backend uses Spring Data JPA and PostgreSQL. Its Angular 15.2 client and Spring Security/JWT components support the application workflows.',
    technologies: [
      'Java 11',
      'Spring Boot 3.0.2',
      'Angular 15.2',
      'Spring Data JPA',
      'PostgreSQL JDBC',
      'Spring Security',
      'JWT',
    ],
    visual: 'library',
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/juyelhushen/library.management',
      },
      {
        label: 'Book API',
        href: 'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/controller/BooksController.java',
      },
      {
        label: 'Order API',
        href: 'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/controller/OrderController.java',
      },
    ],
  },
  {
    id: 'youtube-clone',
    number: '05',
    name: 'YouTube Clone',
    category: 'VIDEO PLATFORM',
    problem: 'A video platform needs connected upload, playback, user, and discussion experiences.',
    summary:
      'A full-stack video application with upload and playback flows, channels, comments, history, likes, and subscriptions.',
    engineeringFocus:
      'The Java 17 / Spring Boot 3.1.4 Maven backend uses MongoDB and OAuth2 resource-server integration; its Angular 16.2 client pairs with an S3 service for uploaded files.',
    technologies: [
      'Java 17',
      'Spring Boot 3.1.4',
      'Maven multi-module',
      'Angular 16.2',
      'MongoDB',
      'OAuth2 Resource Server',
      'AWS S3',
    ],
    visual: 'video',
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/juyelhushen/youtube-clone',
      },
      {
        label: 'S3 upload service',
        href: 'https://github.com/juyelhushen/youtube-clone/blob/master/backend/src/main/java/com/youtubeclone/service/S3Service.java',
      },
      {
        label: 'Frontend manifest',
        href: 'https://github.com/juyelhushen/youtube-clone/blob/master/frontend/ui/package.json',
      },
    ],
  },
];
