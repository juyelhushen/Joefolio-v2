import type { RefObject } from 'react';
import ResumeDownload from '../../common/ResumeDownload';
import SocialLinks from '../SocialLinks';
import LocalTime from './LocalTime';
import './CosmicFooter.css';

type CosmicFooterProps = {
  homeHeadingRef: RefObject<HTMLHeadingElement | null>;
  showSocial: boolean;
};

const currentYear = new Date().getFullYear();

export default function CosmicFooter({ homeHeadingRef, showSocial }: CosmicFooterProps) {
  return (
    <footer className="site-footer page-column">
      <div className="footer-meta">
        <p>© {currentYear} Juyel Hushen</p>
        <LocalTime />
      </div>
      {showSocial && (
        <>
          <div className="footer-small-links">
            <a href="#home" onClick={() => homeHeadingRef.current?.focus({ preventScroll: true })}>
              Back to top
            </a>
            <ResumeDownload />
          </div>
          <SocialLinks />
        </>
      )}
    </footer>
  );
}
