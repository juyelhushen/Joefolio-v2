import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ImpactStat } from '../data/impact';
import ImpactStrip from './ImpactStrip';

const mockedData = vi.hoisted(() => ({ stats: [] as ImpactStat[] }));
vi.mock('../data/impact', () => ({ impactStats: mockedData.stats }));

afterEach(() => {
  cleanup();
  mockedData.stats.length = 0;
});

it('renders nothing without verified statistics', () => {
  const { container } = render(<ImpactStrip />);
  expect(container.firstChild).toBeNull();
});

it('renders final formatted values without motion', () => {
  mockedData.stats.push(
    { id: 'projects', value: 12, prefix: '~', label: 'Projects' },
    { id: 'accuracy', value: 98.6, suffix: '%', decimals: 1, label: 'Accuracy' },
  );
  render(<ImpactStrip />);
  expect(screen.getByText('~12')).toBeTruthy();
  expect(screen.getByText('98.6%')).toBeTruthy();
});
