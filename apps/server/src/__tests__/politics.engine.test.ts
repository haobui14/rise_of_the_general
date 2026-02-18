import { describe, it, expect } from 'vitest';
import { applyCourtAction, calculatePassiveDecay } from '../modules/politics/court.engine.js';
import type { CourtSnapshot } from '../modules/politics/court.engine.js';

function makeCourt(overrides: Partial<CourtSnapshot> = {}): CourtSnapshot {
  return {
    stability: 50,
    legitimacy: 50,
    morale: 50,
    corruption: 20,
    ...overrides,
  };
}

describe('applyCourtAction', () => {
  it('negotiate: raises stability, legitimacy, morale; reduces corruption', () => {
    const { updated } = applyCourtAction('negotiate', makeCourt());
    expect(updated.stability).toBeGreaterThan(50);
    expect(updated.legitimacy).toBeGreaterThan(50);
    expect(updated.morale).toBeGreaterThan(50);
    expect(updated.corruption).toBeLessThan(20);
  });

  it('reform: strongly raises stability and legitimacy', () => {
    const { updated } = applyCourtAction('reform', makeCourt());
    expect(updated.stability).toBeGreaterThan(50);
    expect(updated.legitimacy).toBeGreaterThan(50);
  });

  it('propaganda: raises morale but increases corruption', () => {
    const { updated } = applyCourtAction('propaganda', makeCourt());
    expect(updated.morale).toBeGreaterThan(50);
    expect(updated.corruption).toBeGreaterThan(20);
  });

  it('purge: drops morale and stability but reduces corruption', () => {
    const { updated } = applyCourtAction('purge', makeCourt({ morale: 90, stability: 90 }));
    expect(updated.morale).toBeLessThan(90);
    expect(updated.stability).toBeLessThan(90);
    expect(updated.corruption).toBeLessThan(20);
  });

  it('clamps all values between 0 and 100', () => {
    const atMin = makeCourt({ stability: 0, legitimacy: 0, morale: 0, corruption: 0 });
    const { updated: min } = applyCourtAction('purge', atMin);
    expect(min.stability).toBeGreaterThanOrEqual(0);
    expect(min.morale).toBeGreaterThanOrEqual(0);
    expect(min.corruption).toBeGreaterThanOrEqual(0);

    const atMax = makeCourt({ stability: 100, legitimacy: 100, morale: 100, corruption: 100 });
    const { updated: max } = applyCourtAction('propaganda', atMax);
    expect(max.morale).toBeLessThanOrEqual(100);
    expect(max.corruption).toBeLessThanOrEqual(100);
  });

  it('returns deltas with a non-empty detail string', () => {
    const { deltas } = applyCourtAction('reform', makeCourt());
    expect(typeof deltas.detail).toBe('string');
    expect(deltas.detail.length).toBeGreaterThan(0);
  });
});

describe('calculatePassiveDecay', () => {
  it('reduces at least one stat when idle', () => {
    const before = makeCourt({ stability: 80, morale: 80, legitimacy: 80 });
    const after = calculatePassiveDecay(before);
    // Passive decay should change the court (not a no-op)
    const isSame =
      after.stability === before.stability &&
      after.morale === before.morale &&
      after.legitimacy === before.legitimacy &&
      after.corruption === before.corruption;
    expect(isSame).toBe(false);
  });

  it('returns values clamped to valid range', () => {
    const near0 = makeCourt({ stability: 0, legitimacy: 0, morale: 0, corruption: 0 });
    const result = calculatePassiveDecay(near0);
    expect(result.stability).toBeGreaterThanOrEqual(0);
    expect(result.morale).toBeGreaterThanOrEqual(0);
    expect(result.legitimacy).toBeGreaterThanOrEqual(0);
    expect(result.corruption).toBeGreaterThanOrEqual(0);
  });
});
