import { describe, it, expect } from 'vitest';
import {
  calculateCaptureRewardBonus,
  resolveTerritoryCapture,
  isCapturable,
  type TerritoryData,
} from '../modules/battle/territory.engine.js';

function makeTerritory(overrides: Partial<TerritoryData> = {}): TerritoryData {
  return {
    _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    strategicValue: 10,
    defenseRating: 20,
    ownerFactionId: 'faction-wei',
    ...overrides,
  };
}

describe('calculateCaptureRewardBonus', () => {
  it('returns strategicValue * 5', () => {
    expect(calculateCaptureRewardBonus({ strategicValue: 10 })).toBe(50);
    expect(calculateCaptureRewardBonus({ strategicValue: 20 })).toBe(100);
  });

  it('returns 0 for zero strategic value', () => {
    expect(calculateCaptureRewardBonus({ strategicValue: 0 })).toBe(0);
  });

  it('scales linearly', () => {
    const a = calculateCaptureRewardBonus({ strategicValue: 5 });
    const b = calculateCaptureRewardBonus({ strategicValue: 10 });
    expect(b).toBe(a * 2);
  });
});

describe('resolveTerritoryCapture', () => {
  it('assigns new owner', () => {
    const result = resolveTerritoryCapture(makeTerritory(), 'faction-shu');
    expect(result.newOwnerFactionId).toBe('faction-shu');
  });

  it('reduces defense rating by 40%', () => {
    const result = resolveTerritoryCapture(makeTerritory({ defenseRating: 20 }), 'faction-shu');
    expect(result.defenseRating).toBe(12); // 20 * 0.6
  });

  it('floors defense rating at 1', () => {
    const result = resolveTerritoryCapture(makeTerritory({ defenseRating: 1 }), 'faction-shu');
    expect(result.defenseRating).toBeGreaterThanOrEqual(1);
  });

  it('preserves territory ID', () => {
    const territory = makeTerritory({ _id: 'test-id-123' });
    const result = resolveTerritoryCapture(territory, 'faction-shu');
    expect(result.territoryId).toBe('test-id-123');
  });
});

describe('isCapturable', () => {
  it('returns true when territory belongs to a different faction', () => {
    expect(isCapturable(makeTerritory({ ownerFactionId: 'faction-wei' }), 'faction-shu')).toBe(
      true,
    );
  });

  it('returns false when player already owns the territory', () => {
    expect(isCapturable(makeTerritory({ ownerFactionId: 'faction-shu' }), 'faction-shu')).toBe(
      false,
    );
  });
});
