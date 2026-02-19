import { describe, it, expect } from 'vitest';
import { calculateBrotherhoodPowerBonus, checkBondLevelUp } from '../modules/brotherhood/brotherhood.engine.js';

describe('brotherhood.engine', () => {
  it('scales bonus by bond level', () => {
    expect(calculateBrotherhoodPowerBonus(1, 2)).toBe(1.05);
    expect(calculateBrotherhoodPowerBonus(5, 2)).toBe(1.25);
  });

  it('checks level up threshold', () => {
    expect(checkBondLevelUp({ bondLevel: 1, bondExperience: 100 }).leveledUp).toBe(true);
  });
});
