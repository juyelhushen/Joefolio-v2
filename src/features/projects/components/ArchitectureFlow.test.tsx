import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import ArchitectureFlow from './ArchitectureFlow';
import { projects } from '../data/projects';

it('presents architecture lanes and their steps as a static ordered list', () => {
  const architecture = projects[0].architecture;
  render(<ArchitectureFlow architecture={architecture} />);

  for (const lane of architecture.lanes) {
    const region = screen.getByRole('region', { name: lane.label });
    expect(within(region).getAllByRole('listitem')).toHaveLength(lane.steps.length);
    for (const step of lane.steps) expect(within(region).getByText(step)).toBeTruthy();
  }
  expect(screen.queryByRole('button', { name: /replay/i })).toBeNull();
});
