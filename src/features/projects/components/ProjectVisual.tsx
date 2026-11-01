import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  FileCode2,
  FileSearch,
  FileText,
  GitBranch,
  Link2,
  Play,
  QrCode,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { ProjectVisual as ProjectVisualType } from '../data/projects';
import './ProjectVisual.css';

type ProjectVisualProps = {
  visual: ProjectVisualType;
};

function Connectors({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`visual-connectors ${className}`}
      viewBox="0 0 500 240"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M92 120h102m112 0h102M250 70v-28m0 168v-30" />
      <circle cx="194" cy="120" r="3" />
      <circle cx="306" cy="120" r="3" />
    </svg>
  );
}

export default function ProjectVisual({ visual }: ProjectVisualProps) {
  return (
    <div className={`mission-visual mission-visual-${visual}`} aria-hidden="true">
      {visual === 'agents' && (
        <div className="visual-art visual-art-agents">
          <Connectors />
          <div className="visual-art-node visual-agent-planner">
            <GitBranch />
          </div>
          <div className="visual-art-node visual-agent-core">
            <FileSearch />
          </div>
          <div className="visual-art-node visual-agent-repository">
            <FileCode2 />
          </div>
          <div className="visual-art-node visual-agent-verify">
            <ShieldCheck />
          </div>
        </div>
      )}

      {visual === 'links' && (
        <div className="visual-art visual-art-links">
          <Connectors />
          <div className="visual-art-node visual-link-source">
            <Link2 />
          </div>
          <div className="visual-art-node visual-link-short">
            <Link2 />
          </div>
          <div className="visual-art-node visual-link-destination">
            <ArrowRight />
          </div>
          <div className="visual-art-node visual-link-qr">
            <QrCode />
          </div>
        </div>
      )}

      {visual === 'knowledge' && (
        <div className="visual-art visual-art-knowledge">
          <Connectors />
          <div className="visual-art-node visual-knowledge-document">
            <FileText />
          </div>
          <div className="visual-art-node visual-knowledge-search">
            <Search />
          </div>
          <div className="visual-art-node visual-knowledge-citation">
            <BadgeCheck />
          </div>
        </div>
      )}

      {visual === 'library' && (
        <div className="visual-art visual-art-library">
          <div className="visual-library-stack" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="visual-art-node visual-library-book">
            <BookOpen />
          </div>
          <div className="visual-art-node visual-library-catalogue">
            <Search />
          </div>
        </div>
      )}

      {visual === 'video' && (
        <div className="visual-art visual-art-video">
          <div className="visual-video-frame">
            <span className="visual-video-play">
              <Play fill="currentColor" />
            </span>
            <span className="visual-video-track">
              <i />
            </span>
          </div>
          <div className="visual-video-frames" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
      )}
    </div>
  );
}
