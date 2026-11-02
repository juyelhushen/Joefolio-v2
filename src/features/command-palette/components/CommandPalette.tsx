import { useEffect, useMemo, useRef, useState } from 'react';
import { PUBLIC_EMAIL } from '../../../lib/profile';
import {
  filterItems,
  getPaletteItems,
  type NavigationId,
  type PaletteItem,
} from '../palette-items';
import './CommandPalette.css';

export type CommandPaletteProps = {
  onClose: () => void;
  onNavigate: (id: NavigationId) => void;
  reducedEffects: boolean;
  onToggleEffects: () => void;
  opener: HTMLElement | null;
};

export default function CommandPalette({
  onClose,
  onNavigate,
  reducedEffects,
  onToggleEffects,
  opener,
}: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [allItems] = useState(() => getPaletteItems(__HAS_RESUME__));
  const items = useMemo(() => filterItems(allItems, query), [allItems, query]);
  const selected = items[active];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    mountedRef.current = true;
    const overflow = document.body.style.overflow;
    const gutter = document.documentElement.style.scrollbarGutter;
    dialog.showModal();
    inputRef.current?.focus();
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
    return () => {
      mountedRef.current = false;
      dialog.close();
      document.body.style.overflow = overflow;
      document.documentElement.style.scrollbarGutter = gutter;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [opener]);

  useEffect(() => {
    if (selected)
      document.getElementById(`command-${selected.id}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);

  const run = async (item: PaletteItem) => {
    if (item.kind === 'copy') {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(PUBLIC_EMAIL);
        if (mountedRef.current) setFeedback('Email copied');
      } catch {
        if (mountedRef.current)
          setFeedback(`Copy failed. Select and copy the address: ${PUBLIC_EMAIL}`);
      }
      return;
    }
    if (item.kind === 'effects') {
      onToggleEffects();
      setFeedback(reducedEffects ? 'Effects restored' : 'Effects reduced');
      return;
    }
    onClose();
    if (item.kind === 'section') {
      onNavigate(item.section);
      window.location.hash = item.section;
    } else if (item.kind === 'project') {
      onNavigate('projects');
      history.pushState(history.state, '', `#projects/${item.projectId}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };

  const groups = ['Sections', 'Projects', 'Actions'] as const;
  return (
    <dialog
      ref={dialogRef}
      className="command-palette"
      aria-labelledby="command-title"
      data-reduced={reducedEffects}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="command-panel">
        <div className="command-toolbar">
          <h2 id="command-title">Search portfolio</h2>
          <button type="button" onClick={onClose} aria-label="Close search">
            Esc
          </button>
        </div>
        <label className="visually-hidden" htmlFor="command-query">
          Search sections, projects and actions
        </label>
        <input
          ref={inputRef}
          id="command-query"
          type="search"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="command-results"
          aria-activedescendant={selected ? `command-${selected.id}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setFeedback('');
          }}
          onKeyDown={(event) => {
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault();
              setActive((index) =>
                !items.length
                  ? 0
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? items.length - 1
                      : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) %
                        items.length,
              );
            } else if (event.key === 'Enter' && selected) {
              event.preventDefault();
              if (selected.kind === 'link')
                document.getElementById(`command-${selected.id}`)?.click();
              else void run(selected);
            }
          }}
        />
        <p className="command-status" role="status" aria-live="polite" aria-atomic="true">
          {feedback || `${items.length} ${items.length === 1 ? 'result' : 'results'}`}
        </p>
        <div id="command-results" role="listbox" aria-label="Search results">
          {groups.map((group) => {
            const results = items.filter((item) => item.group === group);
            return results.length ? (
              <div role="group" aria-labelledby={`command-group-${group}`} key={group}>
                <h3 id={`command-group-${group}`}>{group}</h3>
                {results.map((item) => {
                  const properties = {
                    id: `command-${item.id}`,
                    role: 'option',
                    'aria-selected': selected?.id === item.id,
                    className: 'command-option',
                    tabIndex: -1,
                    onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
                    onMouseEnter: () => setActive(items.indexOf(item)),
                  };
                  return item.kind === 'link' ? (
                    <a
                      key={item.id}
                      {...properties}
                      href={item.href}
                      download={item.download}
                      target={item.download ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      onClick={onClose}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      key={item.id}
                      {...properties}
                      type="button"
                      onClick={() => void run(item)}
                    >
                      {item.label}
                      {item.kind === 'effects' && <span>{reducedEffects ? 'On' : 'Off'}</span>}
                    </button>
                  );
                })}
              </div>
            ) : null;
          })}
        </div>
        {!items.length && <p className="command-empty">No matches</p>}
      </div>
    </dialog>
  );
}
