import { useEffect, useRef, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { navItems } from './navItems';
import ThemeControls from '../ThemeControls';
import './Navbar.css';

type NavigationId = (typeof navItems)[number]['id'];

type NavbarProps = {
  activeSection: NavigationId | 'home';
  scrolled?: boolean;
  onNavigate: (id: NavigationId | 'home') => void;
  onSearch?: () => void;
  onSearchIntent?: () => void;
};

export default function Navbar({
  activeSection,
  onNavigate,
  onSearch,
  onSearchIntent,
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
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
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

  const navigate = (id: NavigationId | 'home') => {
    if (menuOpen) toggleRef.current?.focus({ preventScroll: true });
    setMenuOpen(false);
    onNavigate(id);
  };
  const search = () => {
    if (menuOpen) toggleRef.current?.focus({ preventScroll: true });
    setMenuOpen(false);
    onSearch?.();
  };
  const links = (
    <nav className="main-nav" id="main-navigation" aria-label="Main navigation">
      {navItems.map(({ label, id }, index) => (
        <a
          ref={index === 0 ? firstLinkRef : undefined}
          key={id}
          href={`#${id}`}
          aria-current={activeSection === id ? 'location' : undefined}
          onClick={() => navigate(id)}
        >
          {label}
        </a>
      ))}
    </nav>
  );
  const controls = (
    <div className="header-controls">
      <button
        type="button"
        className="button header-search"
        aria-label="Search"
        aria-keyshortcuts="Control+k Meta+k"
        onMouseEnter={onSearchIntent}
        onFocus={onSearchIntent}
        onClick={search}
      >
        <Search aria-hidden="true" />
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>
      <ThemeControls />
    </div>
  );

  return (
    <>
      <header className="site-header">
        <div className="header-inner page-column">
          <a className="brand" href="#home" onClick={() => navigate('home')}>
            Juyel Hushen
          </a>
          {links}
          {controls}
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
      </header>
      {menuOpen && (
        <div className="mobile-menu-layer">
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Dismiss mobile menu"
            onClick={() => {
              setMenuOpen(false);
              toggleRef.current?.focus();
            }}
          />
          <div className="mobile-menu page-column" id="mobile-menu">
            {links}
            {controls}
          </div>
        </div>
      )}
    </>
  );
}
