import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, Search, X } from 'lucide-react';
import { navItems } from './navItems';
import './Navbar.css';

type NavigationId = (typeof navItems)[number]['id'];
const destinations = navItems.filter((item) => item.id !== 'home');

type NavbarProps = {
  activeSection: NavigationId;
  scrolled?: boolean;
  onNavigate: (id: NavigationId) => void;
  onSearch?: () => void;
  onSearchIntent?: () => void;
};

function OrbitMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 48" fill="none" aria-hidden="true">
      <ellipse
        className="brand-orbit"
        cx="32"
        cy="24"
        rx="29"
        ry="15"
        transform="rotate(-24 32 24)"
      />
      <path className="brand-monogram" d="M17 15h13v17c0 5-9 5-9 0M36 15v20m0-10h11m0-10v20" />
      <circle className="brand-satellite" cx="55" cy="12" r="3" />
    </svg>
  );
}

export default function Navbar({
  activeSection,
  scrolled = false,
  onNavigate,
  onSearch,
  onSearchIntent,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const activeLabel = navItems.find((item) => item.id === activeSection)?.label ?? 'Home';
  const closeMenu = useCallback(() => {
    if (menuRef.current?.open) menuRef.current.close();
    setMenuOpen(false);
    menuToggleRef.current?.focus({ preventScroll: true });
  }, []);

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
        if (menuOpen) closeMenu();
        onSearch?.();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, [closeMenu, menuOpen, onSearch]);

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;
    let disposed = false;
    const updateIndicator = () => {
      if (disposed || window.matchMedia?.('(max-width: 1100px)').matches) return;
      const activeLink = navigation.querySelector<HTMLAnchorElement>(
        `[data-nav-id="${activeSection}"]`,
      );
      if (!activeLink) return;
      navigation.style.setProperty('--active-indicator-left', `${activeLink.offsetLeft}px`);
      navigation.style.setProperty('--active-indicator-width', `${activeLink.offsetWidth}px`);
    };
    updateIndicator();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateIndicator);
    observer?.observe(navigation);
    document.fonts?.ready.then(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeSection]);

  useEffect(() => {
    if (!menuOpen) return;
    const menu = menuRef.current;
    if (!menu) return;
    const overflow = document.body.style.overflow;
    const gutter = document.documentElement.style.scrollbarGutter;
    menu.showModal();
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
    (
      menu.querySelector<HTMLAnchorElement>('a[aria-current="location"]') ??
      menu.querySelector<HTMLAnchorElement>('nav a')
    )?.focus({ preventScroll: true });
    const desktop = window.matchMedia?.('(min-width: 1101px)');
    const onDesktop = () => {
      if (desktop?.matches) {
        closeMenu();
        brandRef.current?.focus({ preventScroll: true });
      }
    };
    desktop?.addEventListener('change', onDesktop);
    return () => {
      desktop?.removeEventListener('change', onDesktop);
      if (menu.open) menu.close();
      document.body.style.overflow = overflow;
      document.documentElement.style.scrollbarGutter = gutter;
    };
  }, [closeMenu, menuOpen]);

  const navigate = (id: NavigationId) => {
    if (menuOpen) closeMenu();
    onNavigate(id);
  };
  const search = () => {
    if (menuOpen) closeMenu();
    onSearch?.();
  };

  return (
    <>
      <header className="site-header" data-scrolled={scrolled}>
        <div className="orbit-dock">
          <a
            ref={brandRef}
            href="#home"
            className="brand"
            aria-label="Juyel Hushen home"
            aria-current={activeSection === 'home' ? 'location' : undefined}
            onClick={() => navigate('home')}
          >
            <OrbitMark />
            <span className="brand-copy">
              <span className="brand-name">JOEFOLIO</span>
              <span className="brand-caption">EXPLORER / 02.0</span>
            </span>
          </a>
          <nav
            ref={navigationRef}
            className="main-nav"
            id="main-navigation"
            aria-label="Main navigation"
            data-active={activeSection !== 'home'}
          >
            {destinations.map(({ label, id }) => (
              <a
                key={id}
                href={`#${id}`}
                data-nav-id={id}
                aria-current={activeSection === id ? 'location' : undefined}
                onClick={() => navigate(id)}
              >
                {label}
              </a>
            ))}
            <span className="main-nav-indicator" aria-hidden="true" />
          </nav>
          <div className="dock-actions">
            <button
              type="button"
              className="button button-secondary header-search"
              aria-label="Search portfolio"
              aria-keyshortcuts="Control+k Meta+k"
              onMouseEnter={onSearchIntent}
              onFocus={onSearchIntent}
              onClick={search}
            >
              <Search aria-hidden="true" />
              <span>Search</span>
              <kbd>Ctrl K</kbd>
            </button>
            <a
              className="button button-primary header-cta"
              href="#contact"
              onClick={() => navigate('contact')}
            >
              <span>Get in Touch</span>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <button
              ref={menuToggleRef}
              className="button button-secondary button-icon menu-toggle"
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="orbit-navigation-panel"
            >
              <Menu aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <dialog
        ref={menuRef}
        id="orbit-navigation-panel"
        className="orbit-menu"
        aria-labelledby="orbit-menu-title"
        inert={!menuOpen}
        onClose={(event) => {
          if (!event.currentTarget.open) setMenuOpen(false);
        }}
        onCancel={(event) => {
          event.preventDefault();
          closeMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            closeMenu();
        }}
      >
        <div className="orbit-menu-heading">
          <span className="orbit-menu-eyebrow">ORBIT NAVIGATION</span>
          <button
            className="button button-secondary button-icon"
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <h2 id="orbit-menu-title">Choose your orbit.</h2>
        <p className="orbit-menu-intro">Explore the work. Follow the connections.</p>
        <nav className="orbit-destinations" aria-label="Exploration navigation">
          {destinations.map(({ label, id }, index) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={activeSection === id ? 'location' : undefined}
              onClick={() => navigate(id)}
            >
              <span className="orbit-destination-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="orbit-destination-marker" aria-hidden="true" />
              <span>{label}</span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="orbit-menu-footer">
          <p className="orbit-section-signal">Viewing / {activeLabel}</p>
          <button
            type="button"
            className="button button-secondary mobile-search"
            aria-label="Search portfolio from menu"
            onMouseEnter={onSearchIntent}
            onFocus={onSearchIntent}
            onClick={search}
          >
            <Search aria-hidden="true" />
            Search portfolio
            <kbd>Ctrl K</kbd>
          </button>
          <a className="button button-primary" href="#contact" onClick={() => navigate('contact')}>
            Start a conversation
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </dialog>
    </>
  );
}
