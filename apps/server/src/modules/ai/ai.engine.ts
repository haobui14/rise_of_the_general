/**
 * ai.engine.ts
 * Pure, deterministic rule-based AI decision logic.
 * Zero DB calls — all inputs are plain data.
 */
import type { AiAction, Region } from '@rotg/shared-types';

export interface AiFactionInput {
  factionId: string;
  aggression: number;
  expansionRate: number;
  preferredRegions: Region[];
}

export interface TerritorySnapshot {
  _id: string;
  ownerFactionId: string;
  region: Region;
  defenseRating: number;
}

export interface PlayerProgressInput {
  /** Count of territories the player currently controls. */
  playerTerritoryCount: number;
  /** Total territories in this region to compare ratio against. */
  totalTerritories: number;
  /** Battle count since last AI turn — used for expansion trigger. */
  battlesSinceLastTurn: number;
}

/**
 * Decide what the AI faction should do this turn.
 *
 * Rules (evaluated top-down, first match wins):
 *  1. Player owns >60% of faction's preferred-region territories → counterattack
 *  2. battlesSinceLastTurn >= expansionRate → expand
 *  3. Any owned territory has defenseRating < 5 → defend
 *  4. aggression > 70 → expand (aggressive factions prefer action)
 *  5. fallback → defend
 */
export function decideAiAction(
  faction: AiFactionInput,
  territories: TerritorySnapshot[],
  progress: PlayerProgressInput,
): AiAction {
  const preferredOwned = territories.filter(
    (t) => faction.preferredRegions.includes(t.region) && t.ownerFactionId === faction.factionId,
  ).length;
  const preferredTotal = territories.filter((t) =>
    faction.preferredRegions.includes(t.region),
  ).length;

  const playerDominance =
    preferredTotal > 0 ? progress.playerTerritoryCount / progress.totalTerritories : 0;

  if (playerDominance > 0.6 && preferredOwned < preferredTotal * 0.4) {
    return 'counterattack';
  }

  if (progress.battlesSinceLastTurn >= faction.expansionRate) {
    return 'expand';
  }

  const hasWeakTerritory = territories.some(
    (t) => t.ownerFactionId === faction.factionId && t.defenseRating < 5,
  );
  if (hasWeakTerritory) {
    return 'defend';
  }

  if (faction.aggression > 70) {
    return 'expand';
  }

  return 'defend';
}

/**
 * Pick the best neutral territory to expand into.
 * "Best" = highest strategicValue in a preferred region; falls back to any neutral.
 * Returns null if there is nothing to expand into.
 */
export interface TerritoryWithValue extends TerritorySnapshot {
  strategicValue: number;
}

export function resolveAiExpansion(
  faction: AiFactionInput,
  neutralTerritories: TerritoryWithValue[],
): string | null {
  const preferred = neutralTerritories
    .filter((t) => faction.preferredRegions.includes(t.region))
    .sort((a, b) => b.strategicValue - a.strategicValue);

  if (preferred.length > 0) return preferred[0]._id;

  const fallback = neutralTerritories.sort((a, b) => b.strategicValue - a.strategicValue);
  return fallback.length > 0 ? fallback[0]._id : null;
}

/**
 * Pick the weakest owned territory to reinforce.
 * Returns null if the faction owns no territories.
 */
export function resolveAiReinforcement(
  faction: AiFactionInput,
  ownedTerritories: TerritorySnapshot[],
): { territoryId: string; powerBoost: number } | null {
  const owned = ownedTerritories
    .filter((t) => t.ownerFactionId === faction.factionId)
    .sort((a, b) => a.defenseRating - b.defenseRating);

  if (owned.length === 0) return null;

  // Power boost is proportional to faction aggression (10–30% defense increase)
  const powerBoost = Math.round(5 + (faction.aggression / 100) * 15);
  return { territoryId: owned[0]._id, powerBoost };
}
