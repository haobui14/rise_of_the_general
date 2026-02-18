import type { LoyaltyEventType } from '@rotg/shared-types';

// Points gained/lost per loyalty event type
const LOYALTY_DELTAS: Record<LoyaltyEventType, number> = {
  battle_victory: 5,
  battle_defeat: -8,
  promotion: 10,
  betrayal_rumor: -15,
  idle_decay: -2,
};

export interface LoyaltyCharacterSnapshot {
  loyalty: number;
  ambition: number;
}

/** Returns the loyalty delta for a given event. Pure — no DB access. */
export function calculateLoyaltyDelta(event: LoyaltyEventType): number {
  return LOYALTY_DELTAS[event] ?? 0;
}

/** Clamps loyalty to the 0–100 range. Pure. */
export function clampLoyalty(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Returns true when a character should betray their lord.
 * Condition: loyalty < 30 AND ambition > 70.
 */
export function checkBetrayalCondition(character: LoyaltyCharacterSnapshot): boolean {
  return character.loyalty < 30 && character.ambition > 70;
}
