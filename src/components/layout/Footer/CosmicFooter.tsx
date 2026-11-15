import type { RefObject } from 'react';
import { Github, Linkedin } from 'lucide-react';
import { PROFILE_LINKS, PUBLIC_EMAIL } from '../../../lib/profile';
import ResumeDownload from '../../common/ResumeDownload';
import LocalTime from './LocalTime';
import './CosmicFooter.css';

type CosmicFooterProps = {
  homeHeadingRef: RefObject<HTMLHeadingElement | null>;
};

const currentYear = new Date().getFullYear();

export default function CosmicFooter({ homeHeadingRef }: CosmicFooterProps) {
  return (
    <footer className="site-footer page-column">
      <nav className="footer-social-links" aria-label="Social profiles">
        <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noopener noreferrer">
          <Linkedin aria-hidden="true" />
          LinkedIn
        </a>
        <a href={PROFILE_LINKS.github} target="_blank" rel="noopener noreferrer">
          <Github aria-hidden="true" />
          GitHub
        </a>
        <a href={`mailto:${PUBLIC_EMAIL}`}>Email</a>
        <a href={PROFILE_LINKS.leetcode} target="_blank" rel="noopener noreferrer">
          LeetCode
        </a>
      </nav>
      <div className="footer-meta">
        <p>© {currentYear} Juyel Hushen</p>
        <LocalTime />
        <a href="#home" onClick={() => homeHeadingRef.current?.focus({ preventScroll: true })}>
          Back to top
        </a>
        <ResumeDownload />
      </div>
    </footer>
  );
}
