import type { DestinyType, DuelOutcome, DuelTriggerType, IBaseStats } from '@rotg/shared-types';
import { getDestinyProbabilityModifier } from '../destiny/destiny.engine.js';

export function calculateDuelPower(
  stats: IBaseStats,
  destiny: DestinyType,
  mythicBonus: number,
  brotherhoodLevel: number,
): number {
  const base = stats.strength * 3 + stats.defense * 1.5 + stats.speed * 2 + stats.strategy + stats.leadership * 0.5;
  const destinyMod = 1 + getDestinyProbabilityModifier(destiny);
  const brotherhoodBonus = 1 + Math.min(0.25, brotherhoodLevel * 0.05);
  return base * destinyMod * mythicBonus * brotherhoodBonus;
}

export function canTriggerDuel(romanceMode: boolean, trigger: DuelTriggerType): boolean {
  if (!romanceMode) return false;
  return ['insult', 'ambush', 'challenge', 'honor_dispute'].includes(trigger);
}

export function resolveDuel(ctx: {
  challengerPower: number;
  opponentPower: number;
}): { outcome: DuelOutcome; rounds: Array<{ round: number; challengerPower: number; opponentPower: number; winner: 'challenger' | 'opponent' | 'draw' }>; merit: number; exp: number } {
  let challengerWins = 0;
  let opponentWins = 0;
  const rounds: Array<{ round: number; challengerPower: number; opponentPower: number; winner: 'challenger' | 'opponent' | 'draw' }> = [];

  for (let r = 1; r <= 3; r++) {
    const c = ctx.challengerPower * (0.9 + Math.random() * 0.2);
    const o = ctx.opponentPower * (0.9 + Math.random() * 0.2);
    const winner = c > o ? 'challenger' : o > c ? 'opponent' : 'draw';
    if (winner === 'challenger') challengerWins++;
    if (winner === 'opponent') opponentWins++;
    rounds.push({ round: r, challengerPower: Math.round(c), opponentPower: Math.round(o), winner });
  }

  const outcome: DuelOutcome = challengerWins > opponentWins ? 'win' : opponentWins > challengerWins ? 'loss' : 'draw';
  const merit = outcome === 'win' ? 30 : outcome === 'draw' ? 10 : 0;
  const exp = outcome === 'win' ? 50 : outcome === 'draw' ? 20 : 8;
  return { outcome, rounds, merit, exp };
}
