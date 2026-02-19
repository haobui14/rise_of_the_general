import { describe, it, expect } from 'vitest';
import { getDestinyProbabilityModifier, shouldRevealDestiny } from '../modules/destiny/destiny.engine.js';

describe('destiny.engine', () => {
  it('returns expected destiny modifiers', () => {
    expect(getDestinyProbabilityModifier('heaven-favored')).toBe(0.1);
    expect(getDestinyProbabilityModifier('doomed')).toBe(-0.1);
    expect(getDestinyProbabilityModifier('unknown')).toBe(0);
  });

  it('reveals destiny only on specific omen types', () => {
    expect(shouldRevealDestiny('prophecy', { destinyRevealed: false })).toBe(true);
    expect(shouldRevealDestiny('comet', { destinyRevealed: false })).toBe(false);
  });
});
