import type { LoyaltyEventType } from '@rotg/shared-types';

// Points gained/lost per loyalty event type
const LOYALTY_DELTAS: Record<LoyaltyEventType, number> = {
  battle_victory: 8,       // Increased from 5 — shared glory strengthens bonds
  battle_defeat: -8,       // Defeat tests loyalty
  promotion: 12,           // Increased from 10 — advancement earns deep gratitude
  betrayal_rumor: -15,     // Suspicion fractures trust
  idle_decay: -4,          // Increased from -2 — neglect breeds resentment faster
  great_victory: 18,       // Routing the enemy together is unforgettable
  crushing_defeat: -18,    // Near-death experience — some blame the lord
  general_promoted: 10,    // Seeing fellow generals rise inspires hope
};

export interface LoyaltyCharacterSnapshot {
  loyalty: number;
  ambition: number;
}

export interface BetrayalConsequence {
  stabilityDelta: number;
  moraleDelta: number;
  meritDelta: number;
  message: string;
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

/**
 * Calculate the consequences when a character betrays their lord.
 * Higher ambition = more calculated, more damaging betrayal.
 * Pure — no DB access.
 */
export function calculateBetrayalConsequence(
  character: LoyaltyCharacterSnapshot & { name: string },
): BetrayalConsequence {
  const isHighAmbition = character.ambition >= 85;

  if (isHighAmbition) {
    // Calculated traitor — took resources, secrets, and allies
    return {
      stabilityDelta: -25,
      moraleDelta: -20,
      meritDelta: -30,
      message: `${character.name} has defected, taking vital resources and officers with them. The court is in shock.`,
    };
  }

  // Desperate defector — hot-headed, less organized
  return {
    stabilityDelta: -15,
    moraleDelta: -12,
    meritDelta: -10,
    message: `${character.name} has abandoned your service, spreading dissent before departing.`,
  };
}
