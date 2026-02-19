import { describe, it, expect } from 'vitest';
import { applyMoralityDelta, calculateMoralityDelta, getMoralityTitle } from '../modules/morality/morality.engine.js';

describe('morality.engine', () => {
  it('applies and clamps deltas', () => {
    const delta = calculateMoralityDelta('seize_power');
    const next = applyMoralityDelta({ benevolence: 2, righteousness: 3, moralAmbition: 95 }, delta);
    expect(next.benevolence).toBe(0);
    expect(next.moralAmbition).toBe(100);
  });

  it('returns morality title', () => {
    expect(getMoralityTitle({ benevolence: 80, righteousness: 75, moralAmbition: 20 })).toContain('Paragon');
  });
});
