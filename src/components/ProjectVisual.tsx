import { ArrowDown, ArrowRight, Check, FileText, Play, Search, Shield, Upload } from 'lucide-react';
import type { ProjectVisual as ProjectVisualType } from '../data/projects';
import './ProjectVisual.css';

type ProjectVisualProps = {
  visual: ProjectVisualType;
};

export default function ProjectVisual({ visual }: ProjectVisualProps) {
  return (
    <div className={`mission-visual mission-visual-${visual}`} aria-hidden="true">
      {visual === 'agents' && (
        <div className="visual-pipeline">
          <span className="visual-pipeline-source">INCIDENT</span>
          <div className="visual-pipeline-line" />
          <span className="visual-pipeline-node">PLANNER</span>
          <ArrowRight />
          <span className="visual-pipeline-node visual-pipeline-node-active">INVESTIGATOR</span>
          <ArrowRight />
          <span className="visual-pipeline-tool">
            <Shield />
            CONTROLLED TOOL
          </span>
          <div className="visual-pipeline-status">
            <Check /> TRACEABLE WORKFLOW
          </div>
        </div>
      )}

      {visual === 'links' && (
        <div className="visual-link-flow">
          <div className="visual-link-address">
            <span>LONG URL</span>
            <i />
            <i />
            <i />
          </div>
          <ArrowRight className="visual-flow-arrow" />
          <div className="visual-link-short">
            <span>SHORT LINK</span>
            <strong>go / link</strong>
          </div>
          <ArrowRight className="visual-flow-arrow" />
          <div className="visual-link-destination">DESTINATION</div>
          <div className="visual-link-caption">LINK MANAGEMENT · REDIRECT FLOW</div>
        </div>
      )}

      {visual === 'knowledge' && (
        <div className="visual-knowledge-flow">
          <div className="visual-doc-stack">
            <FileText />
            <FileText />
            <FileText />
            <span>DOCUMENTS</span>
          </div>
          <ArrowRight />
          <div className="visual-retrieval">
            <Search />
            <span>RETRIEVAL</span>
            <i />
            <i />
            <i />
          </div>
          <ArrowRight />
          <div className="visual-grounded-answer">
            <span>GROUNDED ANSWER</span>
            <small>SOURCE [01]</small>
            <small>SOURCE [02]</small>
          </div>
        </div>
      )}

      {visual === 'library' && (
        <div className="visual-library">
          <div className="visual-library-shelf">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="visual-library-shelf visual-library-shelf-lower">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="visual-library-search">
            <Search />
            <span>CATALOGUE</span>
          </div>
          <div className="visual-library-flow">
            <span>BOOK RECORD</span>
            <ArrowRight />
            <span>ORDER</span>
            <ArrowRight />
            <span>RETURN</span>
          </div>
        </div>
      )}

      {visual === 'video' && (
        <div className="visual-video-browser">
          <div className="visual-video-feature">
            <span className="visual-video-timeline-label">PLAYBACK TIMELINE</span>
            <span className="visual-video-play">
              <Play fill="currentColor" />
            </span>
            <span className="visual-video-progress">
              <i />
            </span>
          </div>
          <div className="visual-video-queue">
            <i />
            <i />
            <i />
          </div>
          <div className="visual-video-storage">
            <Upload />
            <span>UPLOAD</span>
            <strong>AWS S3</strong>
          </div>
          <div className="visual-video-nav">
            <span>VIDEO</span>
            <ArrowDown />
            <span>BROWSE</span>
          </div>
        </div>
      )}
    </div>
  );
}
