export type ProjectVisual = 'agents' | 'links' | 'knowledge' | 'library' | 'video';

export type ProjectLink = {
  label: string;
  href: string;
};

export type ProjectWorkflowLane = {
  label: string;
  steps: readonly string[];
};

export type ProjectArchitecture = {
  lanes: readonly ProjectWorkflowLane[];
  sourceLinks: readonly ProjectLink[];
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
  repositoryUrl: string;
  demoUrl?: string;
  architecture: ProjectArchitecture;
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
      'An AI-assisted incident investigation system that uses agents to inspect repositories through controlled tools.',
    engineeringFocus:
      'The public API covers incident creation and investigation. The repository describes repair and verification as a constrained internal workflow, not a public patch API.',
    technologies: ['Python', 'FastAPI', 'LangGraph', 'MCP'],
    visual: 'agents',
    repositoryUrl: 'https://github.com/juyelhushen/sentinel',
    architecture: {
      lanes: [
        {
          label: 'Investigation API · public path',
          steps: [
            'Authenticated incident request',
            'FastAPI starts the investigation',
            'LangGraph planner and investigator',
            'Policy-checked repository tools',
            'Incident and execution status',
          ],
        },
        {
          label: 'Repair and verification · internal workflow',
          steps: [
            'Optional repair plan',
            'Approval gate',
            'Constrained tool execution',
            'Verification with bounded retries',
          ],
        },
      ],
      sourceLinks: [
        {
          label: 'Investigation API',
          href: 'https://github.com/juyelhushen/sentinel/blob/1b0f3f7473f9b49fb590fefcb1c2ccabe79b3ffa/src/sentinel/api.py',
        },
        {
          label: 'LangGraph workflow',
          href: 'https://github.com/juyelhushen/sentinel/blob/1b0f3f7473f9b49fb590fefcb1c2ccabe79b3ffa/src/sentinel/workflows/sentinel_graph.py',
        },
        {
          label: 'Tool execution boundary',
          href: 'https://github.com/juyelhushen/sentinel/blob/1b0f3f7473f9b49fb590fefcb1c2ccabe79b3ffa/src/sentinel/tools/executor.py',
        },
        {
          label: 'API and internal workflow notes',
          href: 'https://github.com/juyelhushen/sentinel/blob/1b0f3f7473f9b49fb590fefcb1c2ccabe79b3ffa/docs/demo.md',
        },
      ],
    },
    links: [{ label: 'Repository', href: 'https://github.com/juyelhushen/sentinel' }],
  },
  {
    id: 'cut2short',
    number: '02',
    name: 'Cut2Short',
    category: 'FULL-STACK PLATFORM',
    problem:
      'Long URLs are harder to share and manage, while link owners need a way to review usage.',
    summary: 'Shorten and manage links, track redirect hits, and create QR codes.',
    engineeringFocus:
      'The reviewed controllers and service confirm URL creation and management, redirects with hit counts, and QR-code operations. The workflow below focuses on those source-verified paths.',
    technologies: ['Java', 'Spring Boot', 'React', 'PostgreSQL'],
    visual: 'links',
    repositoryUrl: 'https://github.com/juyelhushen/Cut2Short-backend',
    architecture: {
      lanes: [
        {
          label: 'Link lifecycle',
          steps: [
            'React link-management interface',
            'Spring Boot URL API',
            'Create, update, and delete short links',
            'Redirect endpoint records hits',
            'Spring Data JPA and PostgreSQL',
          ],
        },
        {
          label: 'Related workflows',
          steps: ['JWT and OAuth2 security', 'QR-code creation and retrieval'],
        },
      ],
      sourceLinks: [
        {
          label: 'URL API',
          href: 'https://github.com/juyelhushen/Cut2Short-backend/blob/9a6abd1b5c3a8d3d2bec5bfdb072fb3a278c7a59/src/main/java/com/url/shortner/controller/UrlController.java',
        },
        {
          label: 'URL service and hit tracking',
          href: 'https://github.com/juyelhushen/Cut2Short-backend/blob/9a6abd1b5c3a8d3d2bec5bfdb072fb3a278c7a59/src/main/java/com/url/shortner/service/imple/UrlServiceImpl.java',
        },
        {
          label: 'Backend dependencies',
          href: 'https://github.com/juyelhushen/Cut2Short-backend/blob/9a6abd1b5c3a8d3d2bec5bfdb072fb3a278c7a59/pom.xml',
        },
        {
          label: 'Dashboard entry points',
          href: 'https://github.com/juyelhushen/cut2short-front/blob/aafb141c85c299acde931bdfa6a06c27fe0139c5/src/modules/dashboard/Home.jsx',
        },
      ],
    },
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
      'Ask questions about PDFs and get answers grounded in retrieved passages with citations.',
    engineeringFocus:
      'PDFs are loaded and chunked before vector storage. Questions retrieve relevant chunks, pass through LangGraph retrieval, reasoning, and citation agents, and are recorded with source and latency metadata.',
    technologies: ['Python', 'FastAPI', 'LangGraph', 'ChromaDB'],
    visual: 'knowledge',
    repositoryUrl: 'https://github.com/juyelhushen/enterprise-knowledge-assistant',
    architecture: {
      lanes: [
        {
          label: 'Document ingestion',
          steps: [
            'PDF upload and validation',
            'Load documents and split into chunks',
            'Embed and store in ChromaDB',
            'Keep document metadata in SQLite',
          ],
        },
        {
          label: 'Question and citation workflow',
          steps: [
            'Similarity search retrieves chunks',
            'LangGraph coordinates retrieve and reason',
            'Ollama generates a grounded answer',
            'Citation agent adds source and page',
            'SQLite records the interaction audit',
          ],
        },
      ],
      sourceLinks: [
        {
          label: 'Document ingestion',
          href: 'https://github.com/juyelhushen/enterprise-knowledge-assistant/blob/c3bc46cff22ce70872adfe6406d24093e5f980ca/app/ingestion/ingestion_service.py',
        },
        {
          label: 'LangGraph workflow',
          href: 'https://github.com/juyelhushen/enterprise-knowledge-assistant/blob/c3bc46cff22ce70872adfe6406d24093e5f980ca/app/graph/workflow.py',
        },
        {
          label: 'Citation agent',
          href: 'https://github.com/juyelhushen/enterprise-knowledge-assistant/blob/c3bc46cff22ce70872adfe6406d24093e5f980ca/app/agents/citation_agent.py',
        },
        {
          label: 'Audit logging',
          href: 'https://github.com/juyelhushen/enterprise-knowledge-assistant/blob/c3bc46cff22ce70872adfe6406d24093e5f980ca/app/services/audit_log_service.py',
        },
      ],
    },
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
    summary: 'A library app for managing books and categories, with borrowing and returns.',
    engineeringFocus:
      'The Java 11 / Spring Boot 3.0.2 backend uses Spring Data JPA and PostgreSQL. Its Angular 15.2 client and Spring Security/JWT components support the application workflows.',
    technologies: ['Java', 'Spring Boot', 'Angular', 'PostgreSQL'],
    visual: 'library',
    repositoryUrl: 'https://github.com/juyelhushen/library.management',
    architecture: {
      lanes: [
        {
          label: 'Catalogue management',
          steps: [
            'Angular catalogue interface',
            'Spring MVC book and category APIs',
            'Service and repository operations',
            'Spring Data JPA with PostgreSQL',
          ],
        },
        {
          label: 'Borrowing workflow',
          steps: ['Create a book order', 'Review order records', 'Process a book return'],
        },
      ],
      sourceLinks: [
        {
          label: 'Book API',
          href: 'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/controller/BooksController.java',
        },
        {
          label: 'Category API',
          href: 'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/controller/CategoryController.java',
        },
        {
          label: 'Order and return API',
          href: 'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/controller/OrderController.java',
        },
        {
          label: 'JWT security configuration',
          href: 'https://github.com/juyelhushen/library.management/blob/master/backend/src/main/java/com/library/management/config/SecurityConfig.java',
        },
      ],
    },
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
    summary: 'A video-sharing app with uploads, playback, comments, likes, and subscriptions.',
    engineeringFocus:
      'The Java 17 / Spring Boot 3.1.4 Maven backend uses MongoDB and OAuth2 resource-server integration; its Angular 16.2 client pairs with an S3 service for uploaded files.',
    technologies: ['Java', 'Angular', 'MongoDB', 'AWS S3'],
    visual: 'video',
    repositoryUrl: 'https://github.com/juyelhushen/youtube-clone',
    architecture: {
      lanes: [
        {
          label: 'Video upload and playback',
          steps: [
            'Angular video client',
            'Spring MVC video API',
            'AWS S3 stores video and thumbnail files',
            'MongoDB stores video metadata',
            'Video endpoint returns playback details',
          ],
        },
        {
          label: 'User interactions',
          steps: [
            'OAuth2-backed user identity',
            'Comments, likes, and history',
            'Subscribe or unsubscribe',
          ],
        },
      ],
      sourceLinks: [
        {
          label: 'Video API',
          href: 'https://github.com/juyelhushen/youtube-clone/blob/e87afbe8698a01d8f98212696099d21369b8b4b9/backend/src/main/java/com/youtubeclone/controller/VideoController.java',
        },
        {
          label: 'Video service',
          href: 'https://github.com/juyelhushen/youtube-clone/blob/e87afbe8698a01d8f98212696099d21369b8b4b9/backend/src/main/java/com/youtubeclone/service/VideoServiceImpl.java',
        },
        {
          label: 'User and subscription API',
          href: 'https://github.com/juyelhushen/youtube-clone/blob/e87afbe8698a01d8f98212696099d21369b8b4b9/backend/src/main/java/com/youtubeclone/controller/UserController.java',
        },
        {
          label: 'AWS S3 file service',
          href: 'https://github.com/juyelhushen/youtube-clone/blob/e87afbe8698a01d8f98212696099d21369b8b4b9/backend/src/main/java/com/youtubeclone/service/S3Service.java',
        },
      ],
    },
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
