import { useEffect, useMemo, useRef, useState } from 'react';
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
  reduceMotion: boolean;
  opener: HTMLElement | null;
};

export default function CommandPalette({
  onClose,
  onNavigate,
  reduceMotion,
  opener,
}: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [allItems] = useState(() => getPaletteItems(__HAS_RESUME__));
  const items = useMemo(() => filterItems(allItems, query), [allItems, query]);
  const selected = items[active];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    const gutter = document.documentElement.style.scrollbarGutter;
    dialog.showModal();
    inputRef.current?.focus();
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
    return () => {
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

  const run = (item: PaletteItem) => {
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
      data-reduced={reduceMotion}
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
          <button
            className="button button-secondary"
            type="button"
            onClick={onClose}
            aria-label="Close search"
          >
            Esc
          </button>
        </div>
        <label className="visually-hidden" htmlFor="command-query">
          Search sections, projects and actions
        </label>
        <input
          className="form-control"
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
          {`${items.length} ${items.length === 1 ? 'result' : 'results'}`}
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
