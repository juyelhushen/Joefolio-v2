import { useEffect, useRef, useState } from 'react';
import { Moon, Palette, Sun } from 'lucide-react';
import './ThemeControls.css';

const accents = [
  { id: 'cyan', label: 'Cyan' },
  { id: 'violet', label: 'Violet' },
  { id: 'green', label: 'Green' },
  { id: 'amber', label: 'Amber' },
  { id: 'rose', label: 'Rose' },
] as const;

type Theme = 'dark' | 'light';
type Accent = (typeof accents)[number]['id'];

function store(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The in-memory control still works when storage is unavailable.
  }
}

export default function ThemeControls() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );
  const [accent, setAccent] = useState<Accent>(
    () => accents.find(({ id }) => id === document.documentElement.dataset.accent)?.id ?? 'cyan',
  );
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    store('portfolio-theme', next);
  };

  const applyAccent = (next: Accent) => {
    setAccent(next);
    document.documentElement.dataset.accent = next;
    store('portfolio-accent', next);
  };

  const selectAccent = (next: Accent) => {
    applyAccent(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="theme-controls">
      <button
        className="button theme-toggle"
        type="button"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        aria-pressed={theme === 'light'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        <span>Theme</span>
      </button>
      <div className="accent-control">
        <button
          ref={triggerRef}
          className="button accent-trigger"
          type="button"
          aria-label="Choose accent colour"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls="accent-options"
          onClick={() => setOpen((value) => !value)}
        >
          <Palette aria-hidden="true" />
          <span>Colour</span>
        </button>
        {open && (
          <div className="accent-popover" id="accent-options">
            <div
              className="accent-options"
              role="radiogroup"
              aria-label="Accent colour"
              onKeyDown={(event) => {
                if (
                  !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const options = [
                  ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
                ];
                const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
                const selectedIndex = accents.findIndex(({ id }) => id === accent);
                const index = currentIndex < 0 ? selectedIndex : currentIndex;
                const nextIndex =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? options.length - 1
                      : (index +
                          (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) +
                          options.length) %
                        options.length;
                const option = options[nextIndex];
                const nextAccent = accents[nextIndex];
                if (option && nextAccent) {
                  applyAccent(nextAccent.id);
                  option.focus();
                }
              }}
            >
              {accents.map(({ id, label }) => (
                <button
                  className="accent-swatch"
                  key={id}
                  type="button"
                  role="radio"
                  aria-label={label}
                  aria-checked={accent === id}
                  data-accent-choice={id}
                  onClick={() => selectAccent(id)}
                >
                  <span aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
