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
