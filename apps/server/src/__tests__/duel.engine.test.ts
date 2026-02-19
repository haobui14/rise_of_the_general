import { describe, it, expect } from 'vitest';
import { calculateDuelPower, canTriggerDuel } from '../modules/duel/duel.engine.js';

describe('duel.engine', () => {
  const stats = { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 10 };

  it('applies destiny and brotherhood modifiers', () => {
    const unknown = calculateDuelPower(stats, 'unknown', 1, 0);
    const favored = calculateDuelPower(stats, 'heaven-favored', 1.1, 2);
    expect(favored).toBeGreaterThan(unknown);
  });

  it('blocks duel when romance mode is off', () => {
    expect(canTriggerDuel(false, 'challenge')).toBe(false);
    expect(canTriggerDuel(true, 'challenge')).toBe(true);
  });
});
