import type { Formation } from '@rotg/shared-types';

const FORMATION_MULTIPLIERS: Record<Formation, number> = {
  line: 1.0,
  wedge: 1.1,
  phalanx: 1.15,
  skirmish: 0.9,
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
