import { expect, it } from 'vitest';
import { createFlightPath } from './flight-path';

it('calculates the same cubic route in stage-relative coordinates', () => {
  expect(
    createFlightPath(
      { left: 10, top: 20, width: 800, height: 600 },
      { left: 20, top: 40, width: 40, height: 20 },
      { left: 410, top: 220, width: 100, height: 100 },
    ),
  ).toBe('M 30 30 C 172.8 20.2, 357.6 194.2, 450 250');
});

it('does not create a route before the stage and destinations have layout dimensions', () => {
  const bounds = { left: 0, top: 0, width: 100, height: 100 };
  expect(createFlightPath({ ...bounds, width: 0 }, bounds, bounds)).toBeNull();
  expect(createFlightPath(bounds, { ...bounds, width: 0 }, bounds)).toBeNull();
  expect(createFlightPath(bounds, bounds, { ...bounds, width: 0 })).toBeNull();
});
