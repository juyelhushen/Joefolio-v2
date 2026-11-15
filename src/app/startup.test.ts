import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

afterEach(() => {
  Reflect.deleteProperty(window, 'localStorage');
  vi.restoreAllMocks();
  document.getElementById('startup-error')?.remove();
});

it('applies stored theme and accent in the head before the application bundle', () => {
  const bootstrap = scripts[0]?.[1];
  expect(bootstrap).toBeTruthy();
  expect(html.indexOf('<script>')).toBeLessThan(html.indexOf('<script type="module"'));
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === 'portfolio-theme' ? 'light' : key === 'portfolio-accent' ? 'rose' : null,
    },
  });
  new Function('window', 'document', bootstrap ?? '')(window, document);
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(document.documentElement.dataset.accent).toBe('rose');
});

it('falls back to the default theme if storage is unavailable', () => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem() {
        throw new Error('Storage unavailable');
      },
    },
  });
  new Function('window', 'document', scripts[0]?.[1] ?? '')(window, document);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.dataset.accent).toBe('cyan');
});

it('keeps the no-JavaScript fallback factual and excludes the public email', () => {
  const noScript = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? '';
  expect(noScript).toContain('Juyel Hushen');
  expect(noScript).toContain('Software Engineer building reliable backend systems.');
  expect(noScript).toContain('GitHub');
  expect(noScript).toContain('LinkedIn');
  expect(noScript).toContain('LeetCode');
  expect(noScript).not.toContain('mailto:');
  expect(noScript).not.toContain('juyelhushen@gmail.com');
});

it('shows only the minimal startup error when the entry module fails', () => {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const message = parsed.getElementById('startup-error')!;
  message.hidden = true;
  document.body.append(message);
  new Function('window', 'document', scripts[1]?.[1] ?? '')(window, document);
  const entry = document.createElement('script');
  entry.type = 'module';
  document.body.append(entry);
  entry.dispatchEvent(new Event('error'));
  expect(message.hidden).toBe(false);
  expect(message.textContent).toBe('The portfolio could not start');
  entry.remove();
});
