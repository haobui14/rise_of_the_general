import { describe, it, expect } from 'vitest';
import {
  calculateEnemyPower,
  applyEnemyGeneralMultipliers,
  pickPrimaryGeneral,
  type EnemyGeneralInput,
  type TerritoryInput,
} from '../modules/battle/enemy.engine.js';

function makeGeneral(overrides: Partial<EnemyGeneralInput> = {}): EnemyGeneralInput {
  return { powerMultiplier: 1.2, level: 3, alive: true, ...overrides };
}

function makeTerritory(overrides: Partial<TerritoryInput> = {}): TerritoryInput {
  return { defenseRating: 10, strategicValue: 10, ...overrides };
}

describe('applyEnemyGeneralMultipliers', () => {
  it('returns 1.0 when no generals', () => {
    expect(applyEnemyGeneralMultipliers([])).toBe(1.0);
  });

  it('stacks multipliers additively like player generals', () => {
    const generals = [makeGeneral({ powerMultiplier: 1.2 }), makeGeneral({ powerMultiplier: 1.3 })];
    // 1 + 0.2 + 0.3 = 1.5
    expect(applyEnemyGeneralMultipliers(generals)).toBeCloseTo(1.5);
  });

  it('ignores dead generals', () => {
    const generals = [
      makeGeneral({ powerMultiplier: 1.5, alive: false }),
      makeGeneral({ powerMultiplier: 1.2 }),
    ];
    // only living: 1 + 0.2 = 1.2
    expect(applyEnemyGeneralMultipliers(generals)).toBeCloseTo(1.2);
  });

  it('returns 1.0 when all generals are dead', () => {
    const generals = [makeGeneral({ alive: false }), makeGeneral({ alive: false })];
    expect(applyEnemyGeneralMultipliers(generals)).toBe(1.0);
  });
});

describe('calculateEnemyPower', () => {
  it('scales with territory defense rating', () => {
    const low = calculateEnemyPower(100, makeTerritory({ defenseRating: 10 }), []);
    const high = calculateEnemyPower(100, makeTerritory({ defenseRating: 50 }), []);
    expect(high).toBeGreaterThan(low);
  });

  it('no generals means no general multiplier boost', () => {
    const power = calculateEnemyPower(100, makeTerritory({ defenseRating: 0 }), []);
    // defenseMultiplier = 1 + 0/100 = 1.0; generalMultiplier = 1.0
    expect(power).toBeCloseTo(100);
  });

  it('increases when generals are added', () => {
    const withoutGenerals = calculateEnemyPower(100, makeTerritory(), []);
    const withGeneral = calculateEnemyPower(100, makeTerritory(), [
      makeGeneral({ powerMultiplier: 1.3 }),
    ]);
    expect(withGeneral).toBeGreaterThan(withoutGenerals);
  });

  it('computes a known value correctly', () => {
    // basePower=100, defense=10 → defMult=1.1, general=[1.2] → genMult=1.2
    // 100 * 1.1 * 1.2 = 132
    const result = calculateEnemyPower(100, makeTerritory({ defenseRating: 10 }), [
      makeGeneral({ powerMultiplier: 1.2 }),
    ]);
    expect(result).toBeCloseTo(132);
  });
});

describe('pickPrimaryGeneral', () => {
  it('returns null when empty', () => {
    expect(pickPrimaryGeneral([])).toBeNull();
  });

  it('returns null when all are dead', () => {
    expect(pickPrimaryGeneral([makeGeneral({ alive: false })])).toBeNull();
  });

  it('picks the general with highest powerMultiplier', () => {
    const generals = [
      makeGeneral({ powerMultiplier: 1.1 }),
      makeGeneral({ powerMultiplier: 1.5 }),
      makeGeneral({ powerMultiplier: 1.3 }),
    ];
    expect(pickPrimaryGeneral(generals)?.powerMultiplier).toBe(1.5);
  });
});
