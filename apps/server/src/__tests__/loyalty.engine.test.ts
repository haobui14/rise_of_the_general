import { describe, it, expect } from 'vitest';
import {
  calculateLoyaltyDelta,
  clampLoyalty,
  checkBetrayalCondition,
} from '../modules/loyalty/loyalty.engine.js';
import type { LoyaltyEventType } from '@rotg/shared-types';

describe('calculateLoyaltyDelta', () => {
  const cases: Array<[LoyaltyEventType, number]> = [
    ['battle_victory', 5],
    ['battle_defeat', -8],
    ['promotion', 10],
    ['betrayal_rumor', -15],
    ['idle_decay', -2],
  ];

  for (const [event, expected] of cases) {
    it(`returns ${expected} for ${event}`, () => {
      expect(calculateLoyaltyDelta(event)).toBe(expected);
    });
  }
});

describe('clampLoyalty', () => {
  it('clamps value to 0 at minimum', () => {
    expect(clampLoyalty(-10)).toBe(0);
    expect(clampLoyalty(0)).toBe(0);
  });

  it('clamps value to 100 at maximum', () => {
    expect(clampLoyalty(110)).toBe(100);
    expect(clampLoyalty(100)).toBe(100);
  });

  it('returns value unchanged when within range', () => {
    expect(clampLoyalty(50)).toBe(50);
    expect(clampLoyalty(1)).toBe(1);
    expect(clampLoyalty(99)).toBe(99);
  });
});

describe('checkBetrayalCondition', () => {
  it('returns true when loyalty < 30 and ambition > 70', () => {
    expect(checkBetrayalCondition({ loyalty: 29, ambition: 71 })).toBe(true);
    expect(checkBetrayalCondition({ loyalty: 0, ambition: 100 })).toBe(true);
  });

  it('returns false when loyalty is exactly 30', () => {
    expect(checkBetrayalCondition({ loyalty: 30, ambition: 71 })).toBe(false);
  });

  it('returns false when ambition is exactly 70', () => {
    expect(checkBetrayalCondition({ loyalty: 29, ambition: 70 })).toBe(false);
  });

  it('returns false when both thresholds are not met', () => {
    expect(checkBetrayalCondition({ loyalty: 50, ambition: 50 })).toBe(false);
    expect(checkBetrayalCondition({ loyalty: 80, ambition: 90 })).toBe(false);
  });

  it('boundary — 29/71 triggers, 30/70 does not', () => {
    expect(checkBetrayalCondition({ loyalty: 29, ambition: 71 })).toBe(true);
    expect(checkBetrayalCondition({ loyalty: 30, ambition: 70 })).toBe(false);
  });
});
