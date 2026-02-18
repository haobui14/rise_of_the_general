import type { IBaseStats, InjuryType } from '@rotg/shared-types';

interface InjuryDefinition {
  type: InjuryType;
  statPenalty: Partial<IBaseStats>;
  durationBattles: number;
}

const INJURY_DEFINITIONS: InjuryDefinition[] = [
  { type: 'wound', statPenalty: { strength: -2, defense: -1 }, durationBattles: 3 },
  { type: 'broken_arm', statPenalty: { strength: -3, speed: -2 }, durationBattles: 5 },
  { type: 'fatigue', statPenalty: { speed: -2, strategy: -1, leadership: -1 }, durationBattles: 2 },
];

/**
 * Roll for injury on battle loss. Chance scales with difficulty (5-25%).
 */
export function rollInjury(difficulty: number): InjuryDefinition | null {
  const chance = 0.05 + (difficulty - 1) * 0.05; // 5% at diff 1, 25% at diff 5
  if (Math.random() > chance) return null;

  return INJURY_DEFINITIONS[Math.floor(Math.random() * INJURY_DEFINITIONS.length)];
}

/**
 * Sum all active injury penalties into a single stat modifier object.
 */
export function sumInjuryPenalties(
  injuries: Array<{ statPenalty: Partial<IBaseStats> }>,
): Partial<IBaseStats> {
  const totals: Partial<IBaseStats> = {};
  for (const inj of injuries) {
    for (const [stat, val] of Object.entries(inj.statPenalty)) {
      if (val) {
        (totals as any)[stat] = ((totals as any)[stat] ?? 0) + val;
      }
    }
  }
  return totals;
}
