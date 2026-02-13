import { describe, it, expect } from 'vitest';
import {
  calculatePlayerPower,
  resolveBattleOutcome,
  calculateCasualties,
  calculateRewards,
  calculateStatGrowth,
} from '../modules/battle/battle.engine.js';

describe('calculatePlayerPower', () => {
  it('calculates power correctly with known stats', () => {
    const stats = { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 10 };
    // (10*2) + 10 + (10*1.5) + (10*2) + (1*1.2) = 20 + 10 + 15 + 20 + 1.2 = 66.2
    expect(calculatePlayerPower(stats, 1)).toBeCloseTo(66.2);
  });

  it('calculates power with zero stats', () => {
    const stats = { strength: 0, defense: 0, strategy: 0, speed: 0, leadership: 0 };
    expect(calculatePlayerPower(stats, 0)).toBe(0);
  });

  it('scales with level', () => {
    const stats = { strength: 5, defense: 5, strategy: 5, speed: 5, leadership: 5 };
    const powerLevel1 = calculatePlayerPower(stats, 1);
    const powerLevel10 = calculatePlayerPower(stats, 10);
    expect(powerLevel10).toBeGreaterThan(powerLevel1);
    expect(powerLevel10 - powerLevel1).toBeCloseTo(9 * 1.2);
  });
});

describe('resolveBattleOutcome', () => {
  it('returns won when playerPower >= enemyPower', () => {
    expect(resolveBattleOutcome(100, 50)).toBe('won');
  });

  it('returns won when powers are equal', () => {
    expect(resolveBattleOutcome(100, 100)).toBe('won');
  });

  it('returns lost when playerPower < enemyPower', () => {
    expect(resolveBattleOutcome(50, 100)).toBe('lost');
  });
});

describe('calculateCasualties', () => {
  it('returns 0 when powers are equal', () => {
    expect(calculateCasualties(100, 100)).toBe(0);
  });

  it('returns 0 when both are zero', () => {
    expect(calculateCasualties(0, 0)).toBe(0);
  });

  it('returns proportional casualties', () => {
    // |200-100|/200 = 0.5 -> 50%
    expect(calculateCasualties(200, 100)).toBe(50);
  });
});

describe('calculateRewards', () => {
  const template = { meritReward: 100, expReward: 200 };

  it('gives full rewards on win', () => {
    const result = calculateRewards(template, 'won');
    expect(result.meritGained).toBe(100);
    expect(result.expGained).toBe(200);
  });

  it('gives partial XP and no merit on loss', () => {
    const result = calculateRewards(template, 'lost');
    expect(result.meritGained).toBe(0);
    expect(result.expGained).toBe(50); // 25% of 200
  });
});

describe('calculateStatGrowth', () => {
  it('gives all stat bonuses on win', () => {
    const growth = calculateStatGrowth('won');
    expect(growth.strength).toBe(1);
    expect(growth.defense).toBe(1);
    expect(growth.strategy).toBe(1);
    expect(growth.leadership).toBe(1);
  });

  it('gives only defense on loss', () => {
    const growth = calculateStatGrowth('lost');
    expect(growth.defense).toBe(1);
    expect(growth.strength).toBeUndefined();
  });
});
