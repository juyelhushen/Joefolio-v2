import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Briefcase, Home, Menu, Search, Send, User, X } from 'lucide-react';
import { navItems } from './navItems';
import ThemeControls from '../ThemeControls';
import ResumeDownload from '../../common/ResumeDownload';
import './Navbar.css';

type NavigationId = (typeof navItems)[number]['id'];
const icons = { home: Home, about: User, projects: Briefcase, contact: Send };

type NavbarProps = {
  activeSection: NavigationId;
  onNavigate: (id: NavigationId) => void;
  onSearch?: () => void;
  onSearchIntent?: () => void;
  assistantButton?: ReactNode;
  socialLinks?: ReactNode;
  homeHeadingRef?: RefObject<HTMLHeadingElement | null>;
};

export default function Navbar({
  activeSection,
  onNavigate,
  onSearch,
  onSearchIntent,
  assistantButton,
  socialLinks,
  homeHeadingRef,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!menuOpen && wasOpenRef.current) toggleRef.current?.focus({ preventScroll: true });
    wasOpenRef.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    firstLinkRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === 'k' &&
        !(
          target instanceof HTMLElement &&
          (target.closest('input,textarea,select') || target.isContentEditable)
        )
      ) {
        event.preventDefault();
        if (menuOpen) toggleRef.current?.focus({ preventScroll: true });
        setMenuOpen(false);
        onSearch?.();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, [menuOpen, onSearch]);

  const navigate = (id: NavigationId) => {
    if (menuOpen) toggleRef.current?.focus({ preventScroll: true });
    setMenuOpen(false);
    onNavigate(id);
  };
  const links = (mobile: boolean) => (
    <nav className="main-nav" aria-label="Primary">
      {navItems.map(({ label, id }, index) => {
        const Icon = icons[id];
        return (
          <a
            ref={mobile && index === 0 ? firstLinkRef : undefined}
            key={id}
            href={`#${id}`}
            aria-current={activeSection === id ? 'location' : undefined}
            onClick={() => navigate(id)}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
            {label}
          </a>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="site-header">
        <div className="header-top">
          <a className="brand" href="#home" onClick={() => navigate('home')}>
            <span className="brand-mark" aria-hidden="true">
              JH
            </span>
            <span>Juyel Hushen</span>
          </a>
          <ThemeControls />
          {assistantButton}
          <button
            ref={toggleRef}
            className="button mobile-menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        <p className="sidebar-bio">
          I&apos;m <span>Juyel</span>, a software engineer building reliable backend systems.
        </p>
        <button
          type="button"
          className="button header-search"
          aria-label="Search"
          aria-keyshortcuts="Control+k Meta+k"
          onMouseEnter={onSearchIntent}
          onFocus={onSearchIntent}
          onClick={onSearch}
        >
          <Search aria-hidden="true" />
          <span>Search portfolio…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className="desktop-nav">{links(false)}</div>
        {socialLinks && (
          <div className="sidebar-bottom">
            {socialLinks}
            <div className="sidebar-small-links">
              <a
                href="#home"
                onClick={() => homeHeadingRef?.current?.focus({ preventScroll: true })}
              >
                Back to top
              </a>
              <ResumeDownload />
            </div>
          </div>
        )}
      </header>
      {menuOpen && (
        <div className="mobile-menu-layer">
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Dismiss mobile menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="mobile-menu" id="mobile-menu">
            {links(true)}
          </div>
        </div>
      )}
    </>
  );
}
