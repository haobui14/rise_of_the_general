import type { IPlayer, IRankDefinition } from '@rotg/shared-types';

/**
 * Check whether a player is eligible for promotion to the next rank.
 *
 * Kingdom manga principle: rank is earned through battle, not just accumulated merit.
 * Checks merit, leadership, minimum battles won, and minimum level in that order.
 */
export function checkPromotionEligibility(
  player: Pick<IPlayer, 'merit' | 'stats' | 'level' | 'battlesWon'>,
  nextRank: Pick<IRankDefinition, 'requiredMerit' | 'requiredLeadership' | 'minBattlesWon' | 'minLevel' | 'title'>,
): { eligible: boolean; reason?: string } {
  if (player.merit < nextRank.requiredMerit) {
    return {
      eligible: false,
      reason: `Need ${nextRank.requiredMerit} merit, have ${player.merit}`,
    };
  }

  if (player.stats.leadership < nextRank.requiredLeadership) {
    return {
      eligible: false,
      reason: `Need ${nextRank.requiredLeadership} leadership, have ${player.stats.leadership}`,
    };
  }

  if (nextRank.minBattlesWon !== undefined) {
    const battlesWon = player.battlesWon ?? 0;
    if (battlesWon < nextRank.minBattlesWon) {
      return {
        eligible: false,
        reason: `Need ${nextRank.minBattlesWon} battles won for rank "${nextRank.title}", have ${battlesWon}. Rank is earned through battle.`,
      };
    }
  }

  if (nextRank.minLevel !== undefined && player.level < nextRank.minLevel) {
    return {
      eligible: false,
      reason: `Need level ${nextRank.minLevel} for rank "${nextRank.title}", currently level ${player.level}`,
    };
  }

  return { eligible: true };
}
