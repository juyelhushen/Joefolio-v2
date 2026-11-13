import { expect, it } from 'vitest';
import { ParticleUniverse, projectFoldPoint } from './universe-particles';
import { calculateCameraState, calculateRenderingProfile } from '../VirtualCamera';

function seeded() {
  let state = 173;
  return () => ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
}

const camera = calculateCameraState(0);

it.each([1440, 390, 360])(
  'bends different depths differently and converges exactly at %ipx',
  (width) => {
    const far = { x: 0, y: 0 };
    const near = { x: 0, y: 0 };
    projectFoldPoint(width * 0.7, 300, 0.06, width, 844, 1200, far);
    projectFoldPoint(width * 0.7, 300, 1, width, 844, 1200, near);
    expect(Math.hypot(far.x - near.x, far.y - near.y)).toBeGreaterThan(10);
    for (const elapsed of [3199, 3200, 5000]) {
      projectFoldPoint(width * 0.7, 300, 1, width, 844, elapsed, near);
      expect(near.x).toBeCloseTo(width * 0.7, 3);
      expect(near.y).toBeCloseTo(300, 3);
    }
  },
);

it('moves distant, lateral and approaching stars at measurably different speeds', () => {
  const sky = new ParticleUniverse(
    1440,
    900,
    calculateRenderingProfile({ width: 1440, height: 900 }, 1, false),
    seeded(),
  );
  const far = sky.stars[1];
  const near = sky.stars[19];
  const approaching = sky.stars[16];
  const farX = far.x;
  const nearX = near.x;
  const radius = approaching.radius;
  for (let frame = 0; frame < 60; frame++) sky.advance(1 / 60, camera);
  expect(Math.abs(near.x - nearX)).toBeGreaterThan(Math.abs(far.x - farX) * 10);
  expect(approaching.radius).toBeGreaterThan(radius);
  expect(new Set(sky.stars.map((star) => star.depth)).size).toBe(4);
});

it.each([1440, 390])('schedules varied events with bounded concurrency at %ipx', (width) => {
  const sky = new ParticleUniverse(
    width,
    900,
    calculateRenderingProfile({ width, height: 900 }, 1, false),
    seeded(),
  );
  let maximumActive = 0;
  const trajectories = new Set<number>();
  const births: number[] = [];
  let previousEvents = 0;
  for (let frame = 0; frame < 3600; frame++) {
    sky.advance(0.05, camera);
    const active = sky.meteors.filter((meteor) => meteor.active);
    maximumActive = Math.max(maximumActive, active.length);
    expect(active.length).toBeLessThanOrEqual(sky.profile.maxMeteors);
    if (sky.meteorEvents !== previousEvents) {
      births.push(sky.elapsed);
      previousEvents = sky.meteorEvents;
      for (const meteor of active) trajectories.add(meteor.angle);
      const gap = sky.nextMeteorAt - sky.elapsed;
      expect(gap).toBeGreaterThan(0);
      expect(gap).toBeLessThanOrEqual(sky.profile.meteorInterval[1]);
    }
  }
  expect(maximumActive).toBeGreaterThanOrEqual(2);
  expect(trajectories.size).toBeGreaterThan(10);
  const meanGap = (births.at(-1)! - births[0]) / (births.length - 1);
  expect(meanGap).toBeGreaterThan(width > 1000 ? 2 : 3.5);
  expect(meanGap).toBeLessThan(width > 1000 ? 4 : 6);
});

it('does not move the camera, stars, dust or meteor clock under reduced motion', () => {
  const sky = new ParticleUniverse(
    390,
    844,
    calculateRenderingProfile({ width: 390, height: 844 }, 1, false),
    seeded(),
  );
  const before = JSON.stringify({ stars: sky.stars, dust: sky.dust });
  sky.advance(5, calculateCameraState(1, 0, 0, true));
  expect(JSON.stringify({ stars: sky.stars, dust: sky.dust })).toBe(before);
  expect(sky.elapsed).toBe(0);
  expect(sky.meteorEvents).toBe(0);
});

it('rescales existing star positions on orientation changes and retires old trajectories', () => {
  const sky = new ParticleUniverse(
    390,
    844,
    calculateRenderingProfile({ width: 390, height: 844 }, 1, false),
    seeded(),
  );
  const star = sky.stars[19];
  const normalizedX = star.x / 390;
  sky.advance(3, camera);
  const x = star.x;
  sky.resize(844, 390);
  expect(sky.stars[19]).toBe(star);
  expect(star.x).toBeCloseTo((x / 390) * 844);
  expect(normalizedX).toBeGreaterThan(0);
  expect(sky.meteors.every((meteor) => !meteor.active)).toBe(true);
});
