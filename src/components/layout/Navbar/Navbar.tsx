import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { navItems } from './navItems';
import EffectsPreferenceToggle from '../../common/EffectsPreferenceToggle';
import './Navbar.css';

type NavigationId = (typeof navItems)[number]['id'];

type NavbarProps = {
  activeSection: NavigationId;
  onNavigate: (id: NavigationId) => void;
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
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
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
        onSearch?.();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, [onSearch]);

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    const updateIndicator = () => {
      const activeLink = navigation.querySelector<HTMLAnchorElement>(
        `[data-nav-id="${activeSection}"]`,
      );
      if (!activeLink) return;
      navigation.style.setProperty(
        '--active-indicator-left',
        `${activeLink.offsetLeft + (activeLink.offsetWidth - 17) / 2}px`,
      );
    };

    updateIndicator();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateIndicator);
    observer?.observe(navigation);
    document.fonts?.ready.then(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeSection, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const navigate = (id: NavigationId) => {
    onNavigate(id);
    if (menuOpen) window.setTimeout(() => menuToggleRef.current?.focus(), 0);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="site-header">
        <a
          href="#home"
          className="brand"
          aria-label="Juyel Hushen home"
          onClick={() => navigate('home')}
        >
          <span className="brand-mark">
            <span className="brand-mark-text">
              JH<span className="brand-spark">•</span>
            </span>
            <span className="brand-orbit" aria-hidden="true">
              <span />
            </span>
          </span>
          <span className="brand-name">JUYEL HUSHEN</span>
        </a>
        <nav
          ref={navigationRef}
          className={`main-nav ${menuOpen ? 'is-open' : ''}`}
          id="main-navigation"
          aria-label="Main navigation"
          onBlurCapture={(event) => {
            const nextTarget = event.relatedTarget;
            if (
              menuOpen &&
              !(nextTarget instanceof Node && navigationRef.current?.contains(nextTarget)) &&
              nextTarget !== menuToggleRef.current
            ) {
              setMenuOpen(false);
              menuToggleRef.current?.focus();
            }
          }}
        >
          {navItems.map(({ label, id }) => (
            <a
              key={id}
              href={`#${id}`}
              data-nav-id={id}
              className={activeSection === id ? 'active' : ''}
              aria-current={activeSection === id ? 'location' : undefined}
              onClick={() => navigate(id)}
            >
              {label}
            </a>
          ))}
          <EffectsPreferenceToggle className="mobile-effects-toggle" />
          <button
            type="button"
            className="mobile-search"
            aria-label="Search portfolio from menu"
            onMouseEnter={onSearchIntent}
            onFocus={onSearchIntent}
            onClick={() => {
              menuToggleRef.current?.focus();
              setMenuOpen(false);
              onSearch?.();
            }}
          >
            Search portfolio
          </button>
          <span className="main-nav-indicator" aria-hidden="true" />
        </nav>
        <button
          type="button"
          className="header-search"
          aria-label="Search portfolio"
          aria-keyshortcuts="Control+k Meta+k"
          onMouseEnter={onSearchIntent}
          onFocus={onSearchIntent}
          onClick={onSearch}
        >
          <span className="search-icon" aria-hidden="true" />
          <span>Search</span>
          <kbd>Ctrl K</kbd>
        </button>
        <a className="header-cta" href="#contact" onClick={() => navigate('contact')}>
          <span>Get in Touch</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <button
          ref={menuToggleRef}
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      {menuOpen && (
        <button
          type="button"
          className="menu-backdrop"
          tabIndex={-1}
          aria-label="Close navigation menu"
          onClick={() => {
            setMenuOpen(false);
            menuToggleRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
