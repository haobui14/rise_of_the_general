import type { CourtActionType } from '@rotg/shared-types';

export interface CourtSnapshot {
  stability: number;
  legitimacy: number;
  morale: number;
  corruption: number;
}

export interface CourtActionDeltas {
  stability: number;
  legitimacy: number;
  morale: number;
  corruption: number;
  detail: string;
}

const ACTION_EFFECTS: Record<CourtActionType, CourtActionDeltas> = {
  negotiate: {
    stability: 5,
    legitimacy: 10,
    morale: 5,
    corruption: -2,
    detail: 'Diplomatic negotiations bolstered court legitimacy.',
  },
  purge: {
    stability: -20,
    legitimacy: 5,
    morale: -10,
    corruption: -15,
    detail: "The purge rooted out corruption but shook the court's stability.",
  },
  reform: {
    stability: 15,
    legitimacy: 5,
    morale: 5,
    corruption: -5,
    detail: 'Administrative reforms strengthened the dynasty.',
  },
  propaganda: {
    stability: 5,
    legitimacy: 5,
    morale: 15,
    corruption: 2,
    detail: 'Propaganda campaigns lifted troop morale but deepened corruption.',
  },
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Apply a court action and return new court values + deltas. Pure. */
export function applyCourtAction(
  action: CourtActionType,
  court: CourtSnapshot,
): { updated: CourtSnapshot; deltas: CourtActionDeltas } {
  const fx = ACTION_EFFECTS[action];
  return {
    updated: {
      stability: clamp(court.stability + fx.stability),
      legitimacy: clamp(court.legitimacy + fx.legitimacy),
      morale: clamp(court.morale + fx.morale),
      corruption: clamp(court.corruption + fx.corruption),
    },
    deltas: fx,
  };
}

/** Passive decay applied when no action is taken. Pure. */
export function calculatePassiveDecay(court: CourtSnapshot): CourtSnapshot {
  return {
    stability: clamp(court.stability - 1),
    legitimacy: clamp(court.legitimacy - 1),
    morale: clamp(court.morale - 1),
    corruption: clamp(court.corruption + 1),
  };
}

/**
 * Calculate how court conditions modify battle power.
 *
 * Kingdom manga principle — a fractured court produces fractured armies.
 * High morale inspires soldiers; instability and corruption sap their will.
 *
 * Returns a multiplier in range [0.85, 1.10].
 */
export function calculateBattlePowerModifier(court: CourtSnapshot): number {
  let modifier = 1.0;

  // Morale effects
  if (court.morale >= 80) modifier += 0.10;       // Inspired troops  +10%
  else if (court.morale >= 60) modifier += 0.04;  // Good morale      +4%
  else if (court.morale < 30) modifier -= 0.10;   // Broken morale    -10%
  else if (court.morale < 45) modifier -= 0.05;   // Low morale       -5%

  // Stability effects
  if (court.stability < 30) modifier -= 0.08;     // Civil unrest     -8%
  else if (court.stability >= 75) modifier += 0.03; // Solid foundation +3%

  // Corruption penalty — soldiers know when gold meant for them disappears
  if (court.corruption > 70) modifier -= 0.07;    // Rampant corruption -7%
  else if (court.corruption > 50) modifier -= 0.03; // Notable corruption -3%

  return Math.max(0.75, Math.min(1.10, modifier));
}
