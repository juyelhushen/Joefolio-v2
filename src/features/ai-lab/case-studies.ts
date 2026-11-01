import { Network, ShieldCheck } from 'lucide-react';

export const caseStudies = [
  {
    name: 'Enterprise Knowledge Assistant',
    icon: Network,
    focus: 'Document-grounded retrieval',
    detail:
      'PDF ingestion, chunking, and embeddings feed a LangGraph retrieval, reasoning, and citation workflow backed by ChromaDB. SQLite stores document metadata and interaction audit logs.',
  },
  {
    name: 'Sentinel',
    icon: ShieldCheck,
    focus: 'Controlled agent workflows',
    detail:
      'LangGraph planner and investigator agents initiate incident investigations through registered, policy-controlled repository tools. Repair and verification are documented as an internal constrained workflow, not a public patch API.',
  },
] as const;
