import type { Formation, TroopType } from '@rotg/shared-types';

const FORMATION_MULTIPLIERS: Record<Formation, number> = {
  line: 1.0,
  wedge: 1.1,
  phalanx: 1.15,
  skirmish: 0.9,
};

/**
 * Three Kingdoms troop counter triangle — Kingdom manga / Dynasty Warriors.
 *
 * Infantry  >  Archers   (shield wall closes distance, negates arrow advantage)
 * Archers   >  Cavalry   (volleys stop cavalry charges before they can engage)
 * Cavalry   >  Infantry  (mounted speed and charge breakthroughs rout infantry)
 *
 * Counter: ×1.10 (10% advantage)
 * Countered: ×0.92 (8% disadvantage) — asymmetric so aggression pays more than passivity
 * Neutral: ×1.00
 */
const TROOP_COUNTER: Record<TroopType, Record<TroopType, number>> = {
  infantry: { infantry: 1.00, archer: 1.10, cavalry: 0.92 },
  archer:   { archer: 1.00, cavalry: 1.10, infantry: 0.92 },
  cavalry:  { cavalry: 1.00, infantry: 1.10, archer: 0.92 },
};

export function getFormationMultiplier(formation: Formation): number {
  return FORMATION_MULTIPLIERS[formation] ?? 1.0;
}

export function getMoraleMultiplier(morale: number): number {
  if (morale >= 80) return 1.15;
  if (morale >= 50) return 1.0;
  if (morale >= 30) return 0.9;
  return 0.75;
}

export function calculateArmyBonus(troopCount: number, morale: number): number {
  return troopCount * getMoraleMultiplier(morale);
}

/**
 * Returns the multiplier for playerTroopType vs enemyTroopType.
 * Pass null for either to get 1.0 (unknown / mixed forces).
 */
export function getTroopCounterMultiplier(
  playerTroopType: TroopType | null | undefined,
  enemyTroopType: TroopType | null | undefined,
): number {
  if (!playerTroopType || !enemyTroopType) return 1.0;
  return TROOP_COUNTER[playerTroopType]?.[enemyTroopType] ?? 1.0;
}
