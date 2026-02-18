/**
 * territory.engine.ts
 * Pure functions for territory capture logic.
 * Zero DB calls — all inputs are plain data.
 */

export interface TerritoryData {
  _id: string;
  strategicValue: number;
  defenseRating: number;
  ownerFactionId: string;
}

export interface TerritoryUpdate {
  territoryId: string;
  newOwnerFactionId: string;
  defenseRating: number;
}

/**
 * Merit bonus granted on capture: scales with strategic value.
 * Base bonus = strategicValue * 5 (e.g. value 10 → +50 merit)
 */
export function calculateCaptureRewardBonus(
  territory: Pick<TerritoryData, 'strategicValue'>,
): number {
  return Math.round(territory.strategicValue * 5);
}

/**
 * Resolve a successful territory capture.
 * Defense drops by 40% on capture (the defender was routed).
 * The new owner rebuilds over time via fortify actions.
 */
export function resolveTerritoryCapture(
  territory: TerritoryData,
  newOwnerFactionId: string,
): TerritoryUpdate {
  return {
    territoryId: territory._id,
    newOwnerFactionId,
    defenseRating: Math.max(1, Math.round(territory.defenseRating * 0.6)),
  };
}

/**
 * Check whether a player faction currently owns the territory.
 */
export function isCapturable(territory: TerritoryData, attackerFactionId: string): boolean {
  return territory.ownerFactionId !== attackerFactionId;
}
