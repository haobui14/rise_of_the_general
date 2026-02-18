import type { TimelineType } from '@rotg/shared-types';

export type DivergenceTrigger =
  | 'map_dominance' // player controls >80% of territories
  | 'legendary_kill' // a legendary enemy general was killed
  | 'dynasty_collapse'; // dynasty stability < 20

export interface DivergenceCheckInput {
  totalTerritories: number;
  playerControlledTerritories: number;
  playerFactionId: string;
  killedGeneralWasLegendary: boolean;
  dynastyStability: number;
  currentTimeline: TimelineType;
}

/** Check if any divergence trigger has been crossed. Returns the first matching trigger or null. Pure. */
export function checkDivergenceTriggers(input: DivergenceCheckInput): DivergenceTrigger | null {
  // Only diverge once (historical → divergent is a one-way door)
  if (input.currentTimeline === 'divergent') return null;

  const playerShare =
    input.totalTerritories > 0 ? input.playerControlledTerritories / input.totalTerritories : 0;

  if (playerShare > 0.8) return 'map_dominance';
  if (input.killedGeneralWasLegendary) return 'legendary_kill';
  if (input.dynastyStability < 20) return 'dynasty_collapse';

  return null;
}

/** Describe what changes in the divergent world. Pure. */
export function buildDivergentWorld(trigger: DivergenceTrigger): {
  detail: string;
  newAiFactionAggression: number;
} {
  switch (trigger) {
    case 'map_dominance':
      return {
        detail:
          'Your overwhelming dominance has fractured history. A new challenger rises from the shadows.',
        newAiFactionAggression: 90,
      };
    case 'legendary_kill':
      return {
        detail:
          'The death of a legend has shattered the historical timeline. Unknown forces gather.',
        newAiFactionAggression: 80,
      };
    case 'dynasty_collapse':
      return {
        detail:
          'Chaos consumes the dynasty. The old order falls and a new era is born from the ashes.',
        newAiFactionAggression: 95,
      };
  }
}
