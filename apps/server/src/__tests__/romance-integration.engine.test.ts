import { describe, it, expect } from 'vitest';
import { calculateFinalPower } from '../modules/battle/battle.engine.js';

describe('romance integration', () => {
  it('brotherhood bonus increases final battle power', () => {
    const baseCtx = {
      stats: { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 10 },
      level: 5,
      equippedItemBonuses: {},
      injuryPenalties: {},
      army: { troopCount: 100, morale: 80, formation: 'line' as const },
      generalMultipliers: [1],
      synergyMultiplier: 1,
      legacyBonusMultiplier: 1,
      brotherhoodBonus: 1,
      warExhaustion: 0,
      courtPowerModifier: 1,
      troopCounterMultiplier: 1,
    };
    const noBrotherhood = calculateFinalPower(baseCtx).finalPower;
    const withBrotherhood = calculateFinalPower({ ...baseCtx, brotherhoodBonus: 1.2 }).finalPower;
    expect(withBrotherhood).toBeGreaterThan(noBrotherhood);
  });
});
