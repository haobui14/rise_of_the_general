import { describe, it, expect } from 'vitest';
import {
  resolveDeathCondition,
  resolveSuccession,
} from '../modules/succession/succession.engine.js';

function makeCharacter(
  overrides: Partial<{
    _id: string;
    name: string;
    role: string;
    loyalty: number;
    isAlive: boolean;
  }> = {},
) {
  return {
    _id: 'char1',
    name: 'Test Character',
    role: 'officer',
    loyalty: 80,
    isAlive: true,
    ...overrides,
  };
}

describe('resolveDeathCondition', () => {
  it('returns true when exhaustion >= 90 and last battle was a loss', () => {
    expect(resolveDeathCondition(90, true)).toBe(true);
    expect(resolveDeathCondition(100, true)).toBe(true);
  });

  it('returns false when exhaustion is high but last battle was not a loss', () => {
    expect(resolveDeathCondition(95, false)).toBe(false);
  });

  it('returns false when last battle was a loss but exhaustion < 90', () => {
    expect(resolveDeathCondition(89, true)).toBe(false);
    expect(resolveDeathCondition(0, true)).toBe(false);
  });

  it('returns false when both conditions unmet', () => {
    expect(resolveDeathCondition(50, false)).toBe(false);
  });
});

describe('resolveSuccession', () => {
  it('prefers the heir role when available', () => {
    const heir = makeCharacter({ _id: 'heir', role: 'heir', loyalty: 50 });
    const officer = makeCharacter({ _id: 'off', role: 'officer', loyalty: 90 });
    const result = resolveSuccession([heir, officer]);
    expect(result.successorId).toBe('heir');
    expect(result.noCandidates).toBe(false);
  });

  it('falls back to highest-loyalty character when no heir', () => {
    const lowLoyalty = makeCharacter({ _id: 'low', loyalty: 40 });
    const highLoyalty = makeCharacter({ _id: 'high', loyalty: 85 });
    const result = resolveSuccession([lowLoyalty, highLoyalty]);
    expect(result.successorId).toBe('high');
    expect(result.noCandidates).toBe(false);
  });

  it('returns noCandidates when all characters are dead', () => {
    const dead = makeCharacter({ isAlive: false });
    const result = resolveSuccession([dead]);
    expect(result.successorId).toBeNull();
    expect(result.noCandidates).toBe(true);
  });

  it('returns noCandidates for empty character list', () => {
    const result = resolveSuccession([]);
    expect(result.successorId).toBeNull();
    expect(result.noCandidates).toBe(true);
  });

  it('applies correct stability deltas for heir succession', () => {
    const heir = makeCharacter({ role: 'heir' });
    const result = resolveSuccession([heir]);
    expect(result.stabilityDelta).toBe(-10);
    expect(result.moraleDelta).toBe(-10);
    expect(result.legitimacyDelta).toBe(-5);
  });

  it('applies larger deltas for officer succession', () => {
    const officer = makeCharacter({ role: 'officer', loyalty: 70 });
    const result = resolveSuccession([officer]);
    expect(result.stabilityDelta).toBe(-20);
    expect(result.moraleDelta).toBe(-15);
    expect(result.legitimacyDelta).toBe(-10);
  });

  it('applies most severe deltas when no candidates', () => {
    const result = resolveSuccession([]);
    expect(result.stabilityDelta).toBe(-30);
    expect(result.moraleDelta).toBe(-25);
    expect(result.legitimacyDelta).toBe(-20);
  });
});
