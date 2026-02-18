import { describe, it, expect } from 'vitest';
import {
  calculateExhaustionDelta,
  applyExhaustionPenalties,
} from '../modules/battle/exhaustion.engine.js';

describe('calculateExhaustionDelta', () => {
  it('decreases exhaustion on win (low casualties)', () => {
    const delta = calculateExhaustionDelta('won', 0, 50);
    expect(delta).toBeLessThan(0);
  });

  it('increases exhaustion on loss', () => {
    const delta = calculateExhaustionDelta('lost', 0, 50);
    expect(delta).toBeGreaterThan(0);
  });

  it('does not let warExhaustion go below 0', () => {
    const delta = calculateExhaustionDelta('won', 0, 0);
    expect(delta).toBeGreaterThanOrEqual(-0); // should be 0 (already at floor)
    expect(0 + delta).toBeGreaterThanOrEqual(0);
  });

  it('does not let warExhaustion go above 100', () => {
    const delta = calculateExhaustionDelta('lost', 100, 100);
    expect(100 + delta).toBeLessThanOrEqual(100);
  });

  it('heavy casualties on win still add exhaustion burden', () => {
    const lightCasualties = calculateExhaustionDelta('won', 0, 50);
    const heavyCasualties = calculateExhaustionDelta('won', 80, 50);
    // heavy casualties offset the recovery — final delta should be higher (less negative or positive)
    expect(heavyCasualties).toBeGreaterThan(lightCasualties);
  });

  it('loss delta larger than win delta at same casualty level', () => {
    const winDelta = calculateExhaustionDelta('won', 50, 30);
    const lossDelta = calculateExhaustionDelta('lost', 50, 30);
    expect(lossDelta).toBeGreaterThan(winDelta);
  });
});

describe('applyExhaustionPenalties', () => {
  it('returns no penalties at low exhaustion (< 70)', () => {
    const penalties = applyExhaustionPenalties(50);
    expect(penalties.injuryChanceBonus).toBe(0);
    expect(penalties.xpMultiplier).toBe(1.0);
    expect(penalties.moraleGainMultiplier).toBe(1.0);
  });

  it('returns moderate penalties at 70–89', () => {
    const penalties = applyExhaustionPenalties(75);
    expect(penalties.injuryChanceBonus).toBe(0.1);
    expect(penalties.xpMultiplier).toBe(0.8);
    expect(penalties.moraleGainMultiplier).toBe(1.0);
  });

  it('returns severe penalties at >= 90', () => {
    const penalties = applyExhaustionPenalties(95);
    expect(penalties.injuryChanceBonus).toBe(0.25);
    expect(penalties.xpMultiplier).toBe(0.6);
    expect(penalties.moraleGainMultiplier).toBe(0.5);
  });

  it('boundary: exactly 70 gets moderate penalties', () => {
    const penalties = applyExhaustionPenalties(70);
    expect(penalties.injuryChanceBonus).toBe(0.1);
  });

  it('boundary: exactly 90 gets severe penalties', () => {
    const penalties = applyExhaustionPenalties(90);
    expect(penalties.injuryChanceBonus).toBe(0.25);
  });

  it('boundary: 0 exhaustion has no penalties', () => {
    const penalties = applyExhaustionPenalties(0);
    expect(penalties.injuryChanceBonus).toBe(0);
    expect(penalties.xpMultiplier).toBe(1.0);
  });
});
