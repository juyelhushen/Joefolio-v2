import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

function block(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const contents = tokens.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1];
  if (!contents) throw new Error(`Missing token block: ${selector}`);
  return contents;
}

function color(contents: string, name: string) {
  const value = contents.match(new RegExp(`--${name}:\\s*(#[\\da-fA-F]{6})`))?.[1];
  if (!value) throw new Error(`Missing color token: --${name}`);
  return value;
}

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

it('keeps every accent above WCAG AA text contrast on both themes and surfaces', () => {
  const dark = block(':root');
  const light = block(":root[data-theme='light']");
  const accents = ['cyan', 'violet', 'green', 'amber', 'rose'];
  const themes = [
    { name: 'dark', values: dark },
    { name: 'light', values: light },
  ];

  for (const theme of themes) {
    const backgrounds = [color(theme.values, 'color-bg'), color(theme.values, 'color-surface')];
    for (const accent of accents) {
      const foreground = color(theme.values, `accent-${accent}`);
      for (const background of backgrounds) {
        expect(
          contrast(foreground, background),
          `${accent} on ${theme.name} background ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});
