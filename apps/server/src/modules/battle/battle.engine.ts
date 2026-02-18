import type { IBaseStats, IBattleTemplate, ItemRarity, IPowerBreakdown, Formation } from '@rotg/shared-types';
import { getFormationMultiplier, calculateArmyBonus } from '../army/army.engine.js';

export interface BattleContext {
  stats: IBaseStats;
  level: number;
  equippedItemBonuses: Partial<IBaseStats>;
  injuryPenalties: Partial<IBaseStats>;
  army: { troopCount: number; morale: number; formation: Formation } | null;
  generalMultipliers: number[];
  synergyMultiplier: number;
  legacyBonusMultiplier: number;
}

export function calculateFinalPower(ctx: BattleContext): IPowerBreakdown {
  // Effective stats = base + items + injuries (injuries are negative)
  const effective: IBaseStats = {
    strength: ctx.stats.strength + (ctx.equippedItemBonuses.strength ?? 0) + (ctx.injuryPenalties.strength ?? 0),
    defense: ctx.stats.defense + (ctx.equippedItemBonuses.defense ?? 0) + (ctx.injuryPenalties.defense ?? 0),
    strategy: ctx.stats.strategy + (ctx.equippedItemBonuses.strategy ?? 0) + (ctx.injuryPenalties.strategy ?? 0),
    speed: ctx.stats.speed + (ctx.equippedItemBonuses.speed ?? 0) + (ctx.injuryPenalties.speed ?? 0),
    leadership: ctx.stats.leadership + (ctx.equippedItemBonuses.leadership ?? 0) + (ctx.injuryPenalties.leadership ?? 0),
  };

  // Floor at 0
  for (const key of Object.keys(effective) as (keyof IBaseStats)[]) {
    if (effective[key] < 0) effective[key] = 0;
  }

  const basePower =
    effective.strength * 2 + effective.defense + effective.strategy * 1.5 + effective.leadership * 2 + ctx.level * 1.2;

  // Army bonus
  let armyBonus = 0;
  let formationMultiplier = 1.0;
  if (ctx.army) {
    armyBonus = calculateArmyBonus(ctx.army.troopCount, ctx.army.morale);
    formationMultiplier = getFormationMultiplier(ctx.army.formation);
  }

  // Additive stacking of general multipliers: [1.1, 1.15] => 1 + 0.1 + 0.15 = 1.25
  const generalBonus = ctx.generalMultipliers.reduce((acc, m) => acc + (m - 1), 1.0);

  const finalPower =
    (basePower + armyBonus) * formationMultiplier * generalBonus * ctx.synergyMultiplier * ctx.legacyBonusMultiplier;

  return {
    basePower: Math.round(basePower * 100) / 100,
    armyBonus: Math.round(armyBonus * 100) / 100,
    formationMultiplier,
    generalBonus: Math.round(generalBonus * 100) / 100,
    synergyMultiplier: ctx.synergyMultiplier,
    legacyBonus: Math.round((ctx.legacyBonusMultiplier - 1) * 100) / 100,
    finalPower: Math.round(finalPower * 100) / 100,
  };
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
