import { describe, it, expect } from 'vitest';
import { generateOmenEffects } from '../modules/omen/omen.engine.js';

describe('omen.engine', () => {
  it('generates effects by omen type', () => {
    expect(generateOmenEffects('comet').stabilityDelta).toBeLessThan(0);
    expect(generateOmenEffects('prophecy').moraleDelta).toBeGreaterThan(0);
  });
});
