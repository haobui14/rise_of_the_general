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
    warExhaustion: 0,
    courtPowerModifier: 1.0,
    troopCounterMultiplier: 1.0,
    ...overrides,
  };
}

describe('calculateFinalPower', () => {
  it('calculates power correctly with known stats', () => {
    const result = calculateFinalPower(makeContext());
    // (10*2) + 10 + (10*1.5) + (10*1.0) + (10*2) + (1*1.2) = 20+10+15+10+20+1.2 = 76.2
    expect(result.basePower).toBeCloseTo(76.2);
    expect(result.finalPower).toBeCloseTo(76.2);
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
    // (7*2) + 10 + (10*1.5) + (8*1.0) + (10*2) + (1*1.2) = 14+10+15+8+20+1.2 = 68.2
    expect(result.basePower).toBeCloseTo(68.2);
  });

  it('applies army bonus and formation multiplier', () => {
    const result = calculateFinalPower(makeContext({
      army: { troopCount: 100, morale: 80, formation: 'wedge' },
    }));
    // armyBonus = 100 * 1.15 (morale>=80) = 115
    // formationMult = 1.1
    // final = (76.2 + 115) * 1.1 = 210.32
    expect(result.armyBonus).toBeCloseTo(115);
    expect(result.formationMultiplier).toBe(1.1);
    expect(result.finalPower).toBeCloseTo(210.32, 0);
  });
});

describe('resolveBattleOutcome', () => {
  it('returns won when player has decisive power advantage (variance 1.0)', () => {
    // 100 * 1.0 = 100 >= 50 → won
    expect(resolveBattleOutcome(100, 50, 1.0)).toBe('won');
  });

  it('returns won with equal powers at neutral variance', () => {
    // Equal powers, variance=1.0: 100 * 1.0 = 100 >= 100 → won
    expect(resolveBattleOutcome(100, 100, 1.0)).toBe('won');
  });

  it('returns lost at even powers with bad variance', () => {
    // Equal powers, variance=0.85: 100 * 0.85 = 85 < 100 → lost
    expect(resolveBattleOutcome(100, 100, 0.85)).toBe('lost');
  });

  it('returns lost when heavily outmatched even with best variance', () => {
    // 50 * 1.15 = 57.5 < 100 → lost
    expect(resolveBattleOutcome(50, 100, 1.15)).toBe('lost');
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
  it('overwhelming win (powerRatio >= 2.0) grows strategy and leadership', () => {
    const growth = calculateStatGrowth('won', 10, 200, 50); // ratio = 4.0
    expect(growth.strategy).toBe(2);
    expect(growth.leadership).toBe(1);
    expect(growth.defense).toBeUndefined();
  });

  it('pyrrhic win (casualties >= 60) grows strength and defense', () => {
    const growth = calculateStatGrowth('won', 70, 110, 100); // high casualties
    expect(growth.strength).toBe(2);
    expect(growth.defense).toBe(1);
  });

  it('clean decisive win (low casualties, powerRatio >= 1.3) grows speed and strategy', () => {
    const growth = calculateStatGrowth('won', 10, 150, 100); // ratio=1.5, low cas
    expect(growth.speed).toBe(1);
    expect(growth.strategy).toBe(1);
    expect(growth.leadership).toBe(1);
  });

  it('standard hard-fought win grows strength/strategy/leadership', () => {
    const growth = calculateStatGrowth('won', 40, 105, 100); // ratio=1.05, mid casualties
    expect(growth.strength).toBe(1);
    expect(growth.strategy).toBe(1);
    expect(growth.leadership).toBe(1);
  });

  it('gives only defense on loss', () => {
    const growth = calculateStatGrowth('lost', 0, 50, 100);
    expect(growth.defense).toBe(1);
    expect(growth.strength).toBeUndefined();
  });
});
