import { describe, it, expect } from 'vitest';
import {
  decideAiAction,
  resolveAiExpansion,
  resolveAiReinforcement,
  type AiFactionInput,
  type TerritorySnapshot,
  type TerritoryWithValue,
} from '../modules/ai/ai.engine.js';

function makeFaction(overrides: Partial<AiFactionInput> = {}): AiFactionInput {
  return {
    factionId: 'faction-wei',
    aggression: 50,
    expansionRate: 3,
    preferredRegions: ['north'],
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<TerritorySnapshot> = {}): TerritorySnapshot {
  return {
    _id: 'territory-1',
    ownerFactionId: 'faction-wei',
    region: 'north',
    defenseRating: 15,
    ...overrides,
  };
}

function makeSnapshotWithValue(overrides: Partial<TerritoryWithValue> = {}): TerritoryWithValue {
  return { ...makeSnapshot(overrides), strategicValue: 10, ...overrides };
}

describe('decideAiAction', () => {
  it('returns counterattack when player dominates preferred regions', () => {
    const territories: TerritorySnapshot[] = [
      makeSnapshot({ _id: 't1', ownerFactionId: 'faction-shu', region: 'north' }),
      makeSnapshot({ _id: 't2', ownerFactionId: 'faction-shu', region: 'north' }),
      makeSnapshot({ _id: 't3', ownerFactionId: 'faction-shu', region: 'north' }),
      makeSnapshot({ _id: 't4', ownerFactionId: 'faction-wei', region: 'north' }),
    ];
    const result = decideAiAction(
      makeFaction({ factionId: 'faction-wei', preferredRegions: ['north'] }),
      territories,
      { playerTerritoryCount: 3, totalTerritories: 4, battlesSinceLastTurn: 0 },
    );
    expect(result).toBe('counterattack');
  });

  it('returns expand when battle threshold is reached', () => {
    const territories: TerritorySnapshot[] = [
      makeSnapshot({ _id: 't1', ownerFactionId: 'faction-wei' }),
    ];
    const result = decideAiAction(makeFaction({ expansionRate: 3 }), territories, {
      playerTerritoryCount: 0,
      totalTerritories: 5,
      battlesSinceLastTurn: 3,
    });
    expect(result).toBe('expand');
  });

  it('returns defend when a territory has low defense', () => {
    const territories: TerritorySnapshot[] = [
      makeSnapshot({ _id: 't1', ownerFactionId: 'faction-wei', defenseRating: 3 }),
    ];
    const result = decideAiAction(makeFaction({ aggression: 30 }), territories, {
      playerTerritoryCount: 0,
      totalTerritories: 5,
      battlesSinceLastTurn: 0,
    });
    expect(result).toBe('defend');
  });

  it('returns expand for high-aggression faction with no other trigger', () => {
    const territories: TerritorySnapshot[] = [
      makeSnapshot({ _id: 't1', ownerFactionId: 'faction-wei', defenseRating: 20 }),
    ];
    const result = decideAiAction(makeFaction({ aggression: 80 }), territories, {
      playerTerritoryCount: 0,
      totalTerritories: 5,
      battlesSinceLastTurn: 0,
    });
    expect(result).toBe('expand');
  });

  it('falls back to defend when no conditions are met', () => {
    const territories: TerritorySnapshot[] = [makeSnapshot({ defenseRating: 20 })];
    const result = decideAiAction(makeFaction({ aggression: 30, expansionRate: 10 }), territories, {
      playerTerritoryCount: 0,
      totalTerritories: 10,
      battlesSinceLastTurn: 0,
    });
    expect(result).toBe('defend');
  });
});

describe('resolveAiExpansion', () => {
  it('returns null when no neutral territories available', () => {
    const result = resolveAiExpansion(makeFaction(), []);
    expect(result).toBeNull();
  });

  it('picks a preferred-region territory over non-preferred', () => {
    const neutral: TerritoryWithValue[] = [
      makeSnapshotWithValue({
        _id: 't-south',
        region: 'south',
        ownerFactionId: 'faction-shu',
        strategicValue: 20,
      }),
      makeSnapshotWithValue({
        _id: 't-north',
        region: 'north',
        ownerFactionId: 'faction-shu',
        strategicValue: 10,
      }),
    ];
    const result = resolveAiExpansion(makeFaction({ preferredRegions: ['north'] }), neutral);
    expect(result).toBe('t-north');
  });

  it('picks highest strategic value in preferred region', () => {
    const neutral: TerritoryWithValue[] = [
      makeSnapshotWithValue({
        _id: 'low',
        region: 'north',
        ownerFactionId: 'enemy',
        strategicValue: 5,
      }),
      makeSnapshotWithValue({
        _id: 'high',
        region: 'north',
        ownerFactionId: 'enemy',
        strategicValue: 20,
      }),
    ];
    const result = resolveAiExpansion(makeFaction({ preferredRegions: ['north'] }), neutral);
    expect(result).toBe('high');
  });
});

describe('resolveAiReinforcement', () => {
  it('returns null when faction owns nothing', () => {
    const result = resolveAiReinforcement(makeFaction(), [
      makeSnapshot({ ownerFactionId: 'enemy' }),
    ]);
    expect(result).toBeNull();
  });

  it('targets the territory with lowest defense', () => {
    const owned: TerritorySnapshot[] = [
      makeSnapshot({ _id: 'strong', ownerFactionId: 'faction-wei', defenseRating: 30 }),
      makeSnapshot({ _id: 'weak', ownerFactionId: 'faction-wei', defenseRating: 5 }),
    ];
    const result = resolveAiReinforcement(makeFaction(), owned);
    expect(result?.territoryId).toBe('weak');
  });

  it('power boost is positive', () => {
    const owned: TerritorySnapshot[] = [makeSnapshot({ ownerFactionId: 'faction-wei' })];
    const result = resolveAiReinforcement(makeFaction(), owned);
    expect(result?.powerBoost).toBeGreaterThan(0);
  });
});
