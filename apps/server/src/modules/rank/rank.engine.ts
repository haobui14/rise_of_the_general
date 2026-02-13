import type { IPlayer, IRankDefinition } from '@rotg/shared-types';

export function checkPromotionEligibility(
  player: Pick<IPlayer, 'merit' | 'stats'>,
  nextRank: Pick<IRankDefinition, 'requiredMerit' | 'requiredLeadership'>,
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
  return { eligible: true };
}
