/**
 * exhaustion.engine.ts
 * Pure functions for war exhaustion mechanics.
 * Zero DB calls — all inputs are plain numbers.
 */

export interface ExhaustionPenalties {
  injuryChanceBonus: number; // added to injury roll probability
  xpMultiplier: number; // 0–1 multiplier on xp gained
  moraleGainMultiplier: number; // 0–1 multiplier on morale gains
}

/**
 * Calculate how much exhaustion changes after a battle.
 *
 * Rules:
 *  - Win:  -5 (light relief)   + casualties% / 20 (heavy losses still tire you)
 *  - Loss: +15                 + casualties% / 10
 *  Result is clamped so warExhaustion stays in [0, 100].
 */
export function calculateExhaustionDelta(
  outcome: 'won' | 'lost',
  casualties: number,
  currentExhaustion: number,
): number {
  const casualtyBurden = Math.round(casualties / (outcome === 'won' ? 20 : 10));
  const base = outcome === 'won' ? -5 : 15;
  const raw = base + casualtyBurden;

  // Clamp so total stays in [0, 100]
  const clamped = Math.max(-currentExhaustion, Math.min(100 - currentExhaustion, raw));
  return clamped;
}

/**
 * Derive active penalties from the current exhaustion level.
 *
 * Thresholds:
 *  0–69:  no penalties
 *  70–89: +10% injury chance, xp ×0.8, morale gain ×1.0
 *  90–100:+25% injury chance, xp ×0.6, morale gain ×0.5
 */
export function applyExhaustionPenalties(exhaustion: number): ExhaustionPenalties {
  if (exhaustion >= 90) {
    return { injuryChanceBonus: 0.25, xpMultiplier: 0.6, moraleGainMultiplier: 0.5 };
  }
  if (exhaustion >= 70) {
    return { injuryChanceBonus: 0.1, xpMultiplier: 0.8, moraleGainMultiplier: 1.0 };
  }
  return { injuryChanceBonus: 0, xpMultiplier: 1.0, moraleGainMultiplier: 1.0 };
}
