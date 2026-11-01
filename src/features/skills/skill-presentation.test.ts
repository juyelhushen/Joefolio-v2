import { expect, it } from 'vitest';
import { skillPlanets } from './data/skills';
import { getCounterRotationStyle, getOrbitStyle, getTechnologyIcon } from './skill-presentation';

it('keeps the orbital and counter-rotation clocks synchronized in opposite directions', () => {
  for (const planet of skillPlanets) {
    const orbit = getOrbitStyle(planet, false);
    const counter = getCounterRotationStyle(planet, false);
    expect(orbit.animationDuration).toBe(`${planet.durationSeconds}s`);
    expect(orbit.animationDelay).toBe(`${-(planet.durationSeconds * planet.phaseDegrees) / 360}s`);
    expect(counter.animationDuration).toBe(orbit.animationDuration);
    expect(counter.animationDelay).toBe(orbit.animationDelay);
    expect(counter.animationDirection).toBe(
      orbit.animationDirection === 'normal' ? 'reverse' : 'normal',
    );
  }
});

it('uses static phases without animation for reduced motion', () => {
  for (const planet of skillPlanets) {
    const orbit = getOrbitStyle(planet, true);
    const counter = getCounterRotationStyle(planet, true);
    expect(orbit.transform).toBe(`translate(-50%, -50%) rotate(${planet.phaseDegrees}deg)`);
    expect(counter.transform).toBe(`rotate(${-planet.phaseDegrees}deg)`);
    expect(orbit.animationDuration).toBeUndefined();
    expect(counter.animationDuration).toBeUndefined();
  }
});

it('resolves every declared technology icon, with the existing Cloud alternative for AWS', () => {
  for (const planet of skillPlanets) {
    const icon = getTechnologyIcon(planet.icon);
    if (planet.icon === 'aws') {
      expect(icon).toBeNull();
    } else {
      expect(icon?.path).toBeTruthy();
    }
  }
});
