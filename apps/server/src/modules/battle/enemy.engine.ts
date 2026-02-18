/**
 * enemy.engine.ts
 * Pure functions for computing enemy-side combat power.
 * Zero DB calls — all inputs are plain data.
 */

export interface EnemyGeneralInput {
  powerMultiplier: number;
  level: number;
  alive: boolean;
}

export interface TerritoryInput {
  defenseRating: number;
  strategicValue: number;
}

/**
 * Stack enemy general multipliers using the same additive pattern as player generals:
 *   [1.2, 1.3] => 1 + 0.2 + 0.3 = 1.5
 * Only living generals contribute.
 */
export function applyEnemyGeneralMultipliers(generals: EnemyGeneralInput[]): number {
  const living = generals.filter((g) => g.alive);
  return living.reduce((acc, g) => acc + (g.powerMultiplier - 1), 1.0);
}

/**
 * Calculate the final enemy power for a territory assault.
 * Formula: basePower * territoryDefense * generalMultiplier
 */
export function calculateEnemyPower(
  basePower: number,
  territory: TerritoryInput,
  generals: EnemyGeneralInput[],
): number {
  const defenseMultiplier = 1 + territory.defenseRating / 100;
  const generalMultiplier = applyEnemyGeneralMultipliers(generals);
  return Math.round(basePower * defenseMultiplier * generalMultiplier * 100) / 100;
}

/**
 * Select the strongest living general from a list (for boss-encounter logic).
 * Returns null when no generals are present or all are dead.
 */
export function pickPrimaryGeneral(generals: EnemyGeneralInput[]): EnemyGeneralInput | null {
  const living = generals.filter((g) => g.alive);
  if (living.length === 0) return null;
  return living.reduce(
    (best, g) => (g.powerMultiplier > best.powerMultiplier ? g : best),
    living[0],
  );
}
