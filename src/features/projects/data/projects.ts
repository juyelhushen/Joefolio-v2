export type ProjectVisual = 'agents' | 'links' | 'knowledge' | 'library' | 'video';

export type ProjectLink = Readonly<{
  label: string;
  href: string;
}>;

export type ProjectWorkflowLane = Readonly<{
  label: string;
  steps: readonly string[];
}>;

export type ProjectArchitecture = Readonly<{
  lanes: readonly ProjectWorkflowLane[];
  sourceLinks: readonly ProjectLink[];
}>;

export type Project = Readonly<{
  id: string;
  number: string;
  name: string;
  category: string;
  problem: string;
  summary: string;
  engineeringFocus?: string;
  decisions: readonly string[];
  tradeoffs: readonly string[];
  reliability: readonly string[];
  role?: string;
  outcome?: string;
  metrics?: readonly Readonly<{ label: string; value: string }>[];
  lessons?: readonly string[];
  image?: Readonly<{ src: string; alt: string }>;
  technologies: readonly string[];
  visual: ProjectVisual;
  repositoryUrl: string;
  demoUrl?: string;
  architecture: ProjectArchitecture;
  links: readonly ProjectLink[];
}>;

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
    role: 'Solo developer responsible for the application implementation.',
    decisions: [
      'Keep the FastAPI investigation boundary separate from the internal repair workflow, with LangGraph coordinating explicit workflow steps.',
      'Route repository operations through policy-checked tools and persist execution records so an investigation can be inspected afterward.',
    ],
    tradeoffs: [
      'The default internal approval gate is automatic, not a human approval interface. Repair remains an internal constrained workflow rather than a public patch API.',
      'Deterministic repair fixtures make failure paths reproducible, but do not measure live-model accuracy or establish general autonomous repair reliability.',
    ],
    reliability: [
      'The repository documents Pytest, Ruff and MyPy checks plus deterministic scenarios for repair, failed verification, retry exhaustion, approval rejection and persistence.',
      'Live Ollama planner tests are separate from the deterministic evaluation. No evaluation pass rate or production reliability figure is claimed here.',
    ],
    outcome:
      'A source-inspectable incident investigation API and internal repair demonstration. No measured user, traffic or business outcomes are published in this case study.',
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
          label: 'Evaluation scope and verification',
          href: 'https://github.com/juyelhushen/sentinel/blob/1b0f3f7473f9b49fb590fefcb1c2ccabe79b3ffa/README.md',
        },
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
    role: 'Solo developer responsible for the backend and React interface.',
    decisions: [
      'Separate the React management interface from Spring Boot APIs and persist links, ownership and QR-code data through JPA repositories.',
      'Increment redirect hit counts in the URL service rather than treating an analytics dashboard as an independent source of truth.',
    ],
    tradeoffs: [
      'The reviewed suffix generator loads existing short links to check for collisions. This is straightforward for a small dataset but is not evidence of high-concurrency scalability.',
      'Redirect lookup and hit recording share the request path; database latency and failed writes need load and failure testing before making throughput claims.',
    ],
    reliability: [
      'The reviewed backend test file contains a Spring context-load check and logging examples, not behavioral assertions for redirects or authentication.',
      'Collision handling, simultaneous redirects, access control and QR-code failures remain explicit test-coverage follow-ups; no load-test results are claimed.',
    ],
    outcome:
      'Source-backed link management, redirect hit tracking and QR-code workflows. No measured throughput or adoption results are claimed.',
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
          label: 'Current backend test coverage',
          href: 'https://github.com/juyelhushen/Cut2Short-backend/blob/9a6abd1b5c3a8d3d2bec5bfdb072fb3a278c7a59/src/test/java/com/url/shortner/UrlshortnerApplicationTests.java',
        },
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
    role: 'Solo developer responsible for the document ingestion and question-answering application.',
    decisions: [
      'Separate document ingestion from question answering, using ChromaDB for retrieval and SQLite for document metadata and interaction audits.',
      'Use distinct retrieval, reasoning and citation stages so returned answers can be traced to source passages and pages.',
    ],
    tradeoffs: [
      'Answer quality depends on PDF extraction, chunk boundaries, retrieval and the selected local model. Citations aid inspection but do not prove that every answer is correct.',
      'The local Ollama workflow avoids assuming an external hosted model service, but requires model setup and sufficient compute on the operator’s machine.',
    ],
    reliability: [
      'Repository tests cover ingestion, chunking, retrieval, citations and workflow behavior. The reviewed workflow test asserts answer content and a source/page citation for a sample document.',
      'These tests are implementation evidence, not a published retrieval benchmark; no accuracy percentage or latency improvement is claimed.',
    ],
    outcome:
      'An inspectable PDF-to-answer workflow with citations and interaction audit records. No production adoption or measured answer-quality result is claimed.',
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
          label: 'Answer and citation workflow test',
          href: 'https://github.com/juyelhushen/enterprise-knowledge-assistant/blob/c3bc46cff22ce70872adfe6406d24093e5f980ca/tests/test_workflow.py',
        },
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
    role: 'Solo developer responsible for the Angular application and Spring backend.',
    decisions: [
      'Keep catalogue, category and borrowing operations in separate controller/service/repository paths over PostgreSQL.',
      'Represent borrowing with order records and update book availability when an order or return is processed.',
    ],
    tradeoffs: [
      'The reviewed service performs order and availability updates as separate repository operations. Atomicity and simultaneous borrowing need explicit verification before production use.',
      'The application demonstrates the core catalogue and borrowing lifecycle; it does not establish a production circulation system or operational scale.',
    ],
    reliability: [
      'The reviewed backend test is a Spring context-load check, not an end-to-end borrowing or return test.',
      'Behavioral tests for invalid returns, duplicate borrowing, authorization and partial database failures remain follow-up work; no reliability metric is claimed.',
    ],
    outcome:
      'A repository implementation of catalogue management and borrowing/return workflows, without published usage or performance measurements.',
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
          label: 'Borrowing and availability implementation',
          href: 'https://github.com/juyelhushen/library.management/blob/e119f382d08eaf75af6e7ba9c3beef9e8a4e8a05/backend/src/main/java/com/library/management/service/OrderService.java',
        },
        {
          label: 'Current backend test coverage',
          href: 'https://github.com/juyelhushen/library.management/blob/e119f382d08eaf75af6e7ba9c3beef9e8a4e8a05/backend/src/test/java/com/library/management/ApplicationTests.java',
        },
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
    role: 'Solo developer responsible for the Angular client and Java backend.',
    decisions: [
      'Store uploaded media in S3 and keep video metadata in MongoDB rather than putting file bytes in the application database.',
      'Use an Angular client with Spring APIs for playback details and user interactions, with OAuth2 resource-server integration for identity.',
    ],
    tradeoffs: [
      'An upload spans object storage and metadata persistence; consistency and orphan-file cleanup need explicit failure-path verification.',
      'The reviewed S3 service uploads files and returns object URLs. It is not evidence of a transcoding pipeline, adaptive streaming or CDN delivery.',
    ],
    reliability: [
      'The reviewed backend test is a Spring context-load check; it does not exercise S3 failures, playback or authorization.',
      'Upload validation, failed storage writes, metadata consistency and user interaction tests remain follow-ups; no streaming-scale or performance metric is claimed.',
    ],
    outcome:
      'A source-backed video-sharing application covering uploads, playback details and user interactions, without published traffic or delivery-performance results.',
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
          label: 'Current backend test coverage',
          href: 'https://github.com/juyelhushen/youtube-clone/blob/e87afbe8698a01d8f98212696099d21369b8b4b9/backend/src/test/java/com/youtubeclone/YoutubeCloneApplicationTests.java',
        },
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
