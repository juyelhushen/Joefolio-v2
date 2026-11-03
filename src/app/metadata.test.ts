import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const origin = 'https://juyel.vercel.app/';
const html = readFileSync(resolve('index.html'), 'utf8');

it('keeps canonical, social sharing and structured data on the verified production domain', () => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  expect(document.title).toBe('Juyel | Portfolio');
  expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBeTruthy();
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(origin);
  expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(origin);
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    expect(document.querySelector(selector)?.getAttribute('content')).toBe(
      `${origin}images/social-preview.png`,
    );
  }
  expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
    'summary_large_image',
  );
  expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
    '#090d19',
  );
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  const person = JSON.parse(
    document.querySelector('script[type="application/ld+json"]')?.textContent ?? '',
  );
  expect(person['@type']).toBe('Person');
  expect(person.name).toBe('Juyel Hushen');
  expect(person.url).toBe(origin);
  expect(html).not.toMatch(/localhost|127\.0\.0\.1|noindex/i);
});

it('publishes indexable crawler files and an existing correctly sized social image', () => {
  const robots = readFileSync(resolve('public/robots.txt'), 'utf8');
  expect(robots).toContain('Allow: /');
  expect(robots).not.toContain('Disallow: /');
  expect(robots).toContain(`Sitemap: ${origin}sitemap.xml`);
  const sitemap = new DOMParser().parseFromString(
    readFileSync(resolve('public/sitemap.xml'), 'utf8'),
    'application/xml',
  );
  expect(sitemap.querySelector('parsererror')).toBeNull();
  expect([...sitemap.querySelectorAll('loc')].map((loc) => loc.textContent)).toEqual([origin]);
  const preview = readFileSync(resolve('public/images/social-preview.png'));
  expect(preview.readUInt32BE(16)).toBe(1200);
  expect(preview.readUInt32BE(20)).toBe(630);
  expect(readFileSync(resolve('public/favicon.svg'), 'utf8')).toContain('<svg');
});
