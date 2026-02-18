import { describe, it, expect } from 'vitest';
import {
  checkDivergenceTriggers,
  buildDivergentWorld,
  type DivergenceCheckInput,
} from '../modules/timeline/timeline.engine.js';

function makeInput(overrides: Partial<DivergenceCheckInput> = {}): DivergenceCheckInput {
  return {
    totalTerritories: 10,
    playerControlledTerritories: 5,
    playerFactionId: 'faction1',
    killedGeneralWasLegendary: false,
    dynastyStability: 50,
    currentTimeline: 'historical',
    ...overrides,
  };
}

describe('checkDivergenceTriggers', () => {
  it('returns map_dominance when player controls >80% of territories', () => {
    const trigger = checkDivergenceTriggers(makeInput({ playerControlledTerritories: 9 }));
    expect(trigger).toBe('map_dominance');
  });

  it('returns null when player controls exactly 80%', () => {
    const trigger = checkDivergenceTriggers(makeInput({ playerControlledTerritories: 8 }));
    expect(trigger).toBeNull();
  });

  it('returns legendary_kill when a legendary general was killed', () => {
    const trigger = checkDivergenceTriggers(
      makeInput({
        playerControlledTerritories: 3,
        killedGeneralWasLegendary: true,
      }),
    );
    expect(trigger).toBe('legendary_kill');
  });

  it('returns dynasty_collapse when stability drops below 20', () => {
    const trigger = checkDivergenceTriggers(
      makeInput({
        playerControlledTerritories: 2,
        dynastyStability: 19,
      }),
    );
    expect(trigger).toBe('dynasty_collapse');
  });

  it('returns null when no trigger condition is met', () => {
    const trigger = checkDivergenceTriggers(makeInput());
    expect(trigger).toBeNull();
  });

  it('returns null when timeline is already divergent (one-way door)', () => {
    const trigger = checkDivergenceTriggers(
      makeInput({
        playerControlledTerritories: 9,
        currentTimeline: 'divergent',
      }),
    );
    expect(trigger).toBeNull();
  });

  it('prioritizes map_dominance over other simultaneous triggers', () => {
    const trigger = checkDivergenceTriggers(
      makeInput({
        playerControlledTerritories: 9,
        dynastyStability: 15,
        killedGeneralWasLegendary: true,
      }),
    );
    expect(trigger).toBe('map_dominance');
  });
});

describe('buildDivergentWorld', () => {
  it('returns detail and newAiFactionAggression for each trigger', () => {
    const triggers = ['map_dominance', 'legendary_kill', 'dynasty_collapse'] as const;
    for (const trigger of triggers) {
      const result = buildDivergentWorld(trigger);
      expect(result).toHaveProperty('detail');
      expect(result).toHaveProperty('newAiFactionAggression');
      expect(typeof result.detail).toBe('string');
      expect(result.detail.length).toBeGreaterThan(0);
      expect(result.newAiFactionAggression).toBeGreaterThanOrEqual(0);
      expect(result.newAiFactionAggression).toBeLessThanOrEqual(100);
    }
  });
});
