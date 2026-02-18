export interface CharacterSuccessionSnapshot {
  _id: string;
  name: string;
  role: string;
  loyalty: number;
  isAlive: boolean;
}

export interface SuccessionResult {
  successorId: string | null;
  stabilityDelta: number;
  moraleDelta: number;
  legitimacyDelta: number;
  noCandidates: boolean;
}

/**
 * Returns true when war exhaustion and last battle outcome warrant a death check.
 * Pure — no DB access.
 */
export function resolveDeathCondition(warExhaustion: number, lastBattleWasLoss: boolean): boolean {
  return warExhaustion >= 90 && lastBattleWasLoss;
}

/**
 * Picks the succession candidate and returns applied deltas.
 *
 * Priority:
 *   1. Living character with role === 'heir'
 *   2. Living officer / advisor with highest loyalty
 *   3. No candidates → apply larger stability penalty
 *
 * Pure — no DB access.
 */
export function resolveSuccession(characters: CharacterSuccessionSnapshot[]): SuccessionResult {
  const living = characters.filter((c) => c.isAlive);

  const heir = living.find((c) => c.role === 'heir');
  if (heir) {
    return {
      successorId: heir._id,
      stabilityDelta: -10, // smooth transition
      moraleDelta: -10,
      legitimacyDelta: -5,
      noCandidates: false,
    };
  }

  // Highest-loyalty non-main officer/advisor
  const candidates = living.filter((c) => c.role !== 'main').sort((a, b) => b.loyalty - a.loyalty);

  if (candidates.length > 0) {
    return {
      successorId: candidates[0]._id,
      stabilityDelta: -20,
      moraleDelta: -15,
      legitimacyDelta: -10,
      noCandidates: false,
    };
  }

  // No candidates — dynasty in crisis
  return {
    successorId: null,
    stabilityDelta: -30,
    moraleDelta: -25,
    legitimacyDelta: -20,
    noCandidates: true,
  };
}
