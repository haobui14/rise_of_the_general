import { describe, it, expect } from 'vitest';
import { checkPromotionEligibility } from '../modules/rank/rank.engine.js';

describe('checkPromotionEligibility', () => {
  const nextRank = { requiredMerit: 50, requiredLeadership: 5, title: 'Squad Leader' };

  it('is eligible when merit and leadership meet requirements', () => {
    const player = { merit: 50, level: 1, battlesWon: 0, stats: { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 5 } };
    const result = checkPromotionEligibility(player, nextRank);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('is eligible when exceeding requirements', () => {
    const player = { merit: 100, level: 5, battlesWon: 10, stats: { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 20 } };
    const result = checkPromotionEligibility(player, nextRank);
    expect(result.eligible).toBe(true);
  });

  it('is ineligible with insufficient merit', () => {
    const player = { merit: 30, level: 1, battlesWon: 0, stats: { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 10 } };
    const result = checkPromotionEligibility(player, nextRank);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('merit');
  });

  it('is ineligible with insufficient leadership', () => {
    const player = { merit: 100, level: 1, battlesWon: 0, stats: { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 2 } };
    const result = checkPromotionEligibility(player, nextRank);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('leadership');
  });

  it('checks merit before leadership', () => {
    const player = { merit: 10, level: 1, battlesWon: 0, stats: { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 1 } };
    const result = checkPromotionEligibility(player, nextRank);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('merit');
  });

  it('gates on minBattlesWon when set', () => {
    const rankWithBattleReq = { ...nextRank, minBattlesWon: 5 };
    const player = { merit: 100, level: 5, battlesWon: 2, stats: { strength: 10, defense: 10, strategy: 10, speed: 10, leadership: 10 } };
    const result = checkPromotionEligibility(player, rankWithBattleReq);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('battles won');
  });
});
