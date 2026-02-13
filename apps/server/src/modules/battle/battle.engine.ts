import type { IBaseStats, IBattleTemplate, ItemRarity } from '@rotg/shared-types';

export function calculatePlayerPower(stats: IBaseStats, level: number): number {
  return stats.strength * 2 + stats.defense + stats.strategy * 1.5 + stats.leadership * 2 + level * 1.2;
}

export function resolveBattleOutcome(playerPower: number, enemyPower: number): 'won' | 'lost' {
  return playerPower >= enemyPower ? 'won' : 'lost';
}

export function calculateCasualties(playerPower: number, enemyPower: number): number {
  if (playerPower === 0 && enemyPower === 0) return 0;
  const ratio = Math.abs(playerPower - enemyPower) / Math.max(playerPower, enemyPower);
  return Math.round(ratio * 100);
}

export function calculateRewards(
  template: Pick<IBattleTemplate, 'meritReward' | 'expReward'>,
  outcome: 'won' | 'lost',
): { meritGained: number; expGained: number } {
  if (outcome === 'won') {
    return { meritGained: template.meritReward, expGained: template.expReward };
  }
  return { meritGained: 0, expGained: Math.floor(template.expReward * 0.25) };
}

export function calculateStatGrowth(outcome: 'won' | 'lost'): Partial<IBaseStats> {
  if (outcome === 'won') {
    return { strength: 1, defense: 1, strategy: 1, speed: 1, leadership: 1 };
  }
  return { defense: 1 };
}

/**
 * Determines if an item drops and what rarity, based on battle difficulty.
 *
 * Drop chances by difficulty:
 *   1: 30%  |  2: 40%  |  3: 50%  |  4: 60%  |  5: 75%
 *
 * Rarity weights by difficulty:
 *   1-2: 80% common, 18% rare,  2% epic
 *   3:   50% common, 40% rare, 10% epic
 *   4-5: 20% common, 50% rare, 30% epic
 */
export function rollItemDrop(difficulty: number): { dropped: boolean; rarity: ItemRarity | null } {
  const dropChances: Record<number, number> = { 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6, 5: 0.75 };
  const dropChance = dropChances[difficulty] ?? 0.3;

  if (Math.random() > dropChance) {
    return { dropped: false, rarity: null };
  }

  const rarityWeights: Record<number, [number, number, number]> = {
    1: [0.8, 0.18, 0.02],
    2: [0.8, 0.18, 0.02],
    3: [0.5, 0.4, 0.1],
    4: [0.2, 0.5, 0.3],
    5: [0.2, 0.5, 0.3],
  };

  const [commonW, rareW] = rarityWeights[difficulty] ?? [0.8, 0.18, 0.02];
  const roll = Math.random();

  let rarity: ItemRarity;
  if (roll < commonW) rarity = 'common';
  else if (roll < commonW + rareW) rarity = 'rare';
  else rarity = 'epic';

  return { dropped: true, rarity };
}
