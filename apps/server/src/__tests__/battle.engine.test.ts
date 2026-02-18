import { describe, it, expect } from 'vitest';
import {
  calculateFinalPower,
  resolveBattleOutcome,
  calculateCasualties,
  calculateRewards,
  calculateStatGrowth,
  type BattleContext,
} from '../modules/battle/battle.engine.js';

function makeContext(overrides: Partial<BattleContext> = {}): BattleContext {
  return {
    stats: { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 10 },
    level: 1,
    equippedItemBonuses: {},
    injuryPenalties: {},
    army: null,
    generalMultipliers: [],
    synergyMultiplier: 1.0,
    legacyBonusMultiplier: 1.0,
    ...overrides,
  };
}

describe('calculateFinalPower', () => {
  it('calculates power correctly with known stats', () => {
    const result = calculateFinalPower(makeContext());
    // (10*2) + 10 + (10*1.5) + (10*2) + (1*1.2) = 20 + 10 + 15 + 20 + 1.2 = 66.2
    expect(result.basePower).toBeCloseTo(66.2);
    expect(result.finalPower).toBeCloseTo(66.2);
  });

  it('calculates power with zero stats', () => {
    const result = calculateFinalPower(makeContext({
      stats: { strength: 0, defense: 0, strategy: 0, speed: 0, leadership: 0 },
      level: 0,
    }));
    expect(result.finalPower).toBe(0);
  });

  it('scales with level', () => {
    const stats = { strength: 5, defense: 5, strategy: 5, speed: 5, leadership: 5 };
    const power1 = calculateFinalPower(makeContext({ stats, level: 1 }));
    const power10 = calculateFinalPower(makeContext({ stats, level: 10 }));
    expect(power10.finalPower).toBeGreaterThan(power1.finalPower);
    expect(power10.basePower - power1.basePower).toBeCloseTo(9 * 1.2);
  });

  it('applies general multipliers additively', () => {
    const base = calculateFinalPower(makeContext());
    const withGenerals = calculateFinalPower(makeContext({ generalMultipliers: [1.1, 1.15] }));
    // 1 + 0.1 + 0.15 = 1.25
    expect(withGenerals.generalBonus).toBeCloseTo(1.25);
    expect(withGenerals.finalPower).toBeCloseTo(base.basePower * 1.25, 1);
  });

  it('applies injury penalties (negative stats)', () => {
    const result = calculateFinalPower(makeContext({
      injuryPenalties: { strength: -3, speed: -2 },
    }));
    // effective: str=7, def=10, strat=10, spd=8, ldr=10
    // (7*2) + 10 + (10*1.5) + (10*2) + (1*1.2) = 14 + 10 + 15 + 20 + 1.2 = 60.2
    expect(result.basePower).toBeCloseTo(60.2);
  });

  it('applies army bonus and formation multiplier', () => {
    const result = calculateFinalPower(makeContext({
      army: { troopCount: 100, morale: 80, formation: 'wedge' },
    }));
    // armyBonus = 100 * 1.15 (morale>=80) = 115
    // formationMult = 1.1
    // final = (66.2 + 115) * 1.1 = 199.32
    expect(result.armyBonus).toBeCloseTo(115);
    expect(result.formationMultiplier).toBe(1.1);
    expect(result.finalPower).toBeCloseTo(199.32, 0);
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
