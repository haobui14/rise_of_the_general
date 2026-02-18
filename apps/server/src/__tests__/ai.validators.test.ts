import { describe, it, expect } from 'vitest';
import {
  campaignDraftSchema,
  officerDraftSchema,
  eventDraftSchema,
} from '../modules/ai-content/validators.js';

describe('campaignDraftSchema', () => {
  it('parses a valid campaign draft', () => {
    const valid = {
      name: 'Campaign Title',
      description: 'A detailed campaign description with enough content.',
      suggestedObjectives: ['Defeat the northern kingdom'],
      estimatedDifficulty: 3,
    };
    const result = campaignDraftSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects a draft with missing name', () => {
    const invalid = {
      description: 'Some description',
      suggestedObjectives: ['ok'],
      estimatedDifficulty: 2,
    };
    const result = campaignDraftSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects estimatedDifficulty above 5', () => {
    const result = campaignDraftSchema.safeParse({
      name: 'Hard Campaign',
      description: 'Very hard campaign',
      suggestedObjectives: ['Survive'],
      estimatedDifficulty: 6,
    });
    expect(result.success).toBe(false);
  });

  it('rejects estimatedDifficulty below 1', () => {
    const result = campaignDraftSchema.safeParse({
      name: 'Easy',
      description: 'Easy campaign',
      suggestedObjectives: ['Win'],
      estimatedDifficulty: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a draft with empty name', () => {
    const result = campaignDraftSchema.safeParse({
      name: '',
      description: 'ok',
      suggestedObjectives: ['ok'],
      estimatedDifficulty: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty suggestedObjectives array', () => {
    const result = campaignDraftSchema.safeParse({
      name: 'Campaign',
      description: 'ok',
      suggestedObjectives: [],
      estimatedDifficulty: 2,
    });
    expect(result.success).toBe(false);
  });
});

describe('officerDraftSchema', () => {
  it('parses a valid officer draft', () => {
    const valid = {
      name: 'General Wei',
      backstory: 'A hardened veteran from the eastern front with many victories.',
      suggestedStats: {
        strength: 10,
        defense: 8,
        strategy: 12,
        speed: 9,
        leadership: 11,
      },
      suggestedRole: 'officer',
    };
    const result = officerDraftSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects officer draft with missing name', () => {
    const result = officerDraftSchema.safeParse({
      backstory: 'Some story about a general.',
      suggestedStats: { strength: 5, defense: 5, strategy: 5, speed: 5, leadership: 5 },
      suggestedRole: 'advisor',
    });
    expect(result.success).toBe(false);
  });

  it('rejects officer draft with empty backstory', () => {
    const result = officerDraftSchema.safeParse({
      name: 'Test',
      backstory: '',
      suggestedStats: { strength: 5, defense: 5, strategy: 5, speed: 5, leadership: 5 },
      suggestedRole: 'officer',
    });
    expect(result.success).toBe(false);
  });

  it('rejects stats above max (15)', () => {
    const result = officerDraftSchema.safeParse({
      name: 'OP General',
      backstory: 'Overpowered soldier from the north.',
      suggestedStats: { strength: 20, defense: 5, strategy: 5, speed: 5, leadership: 5 },
      suggestedRole: 'officer',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid suggestedRole', () => {
    const result = officerDraftSchema.safeParse({
      name: 'Test',
      backstory: 'A test backstory that is long enough.',
      suggestedStats: { strength: 5, defense: 5, strategy: 5, speed: 5, leadership: 5 },
      suggestedRole: 'villain',
    });
    expect(result.success).toBe(false);
  });
});

describe('eventDraftSchema', () => {
  it('parses a valid event draft', () => {
    const valid = {
      title: 'Earthquake',
      description: 'The earth trembled across the plains causing widespread destruction.',
      effect: 'stability:-5',
    };
    const result = eventDraftSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects event draft with missing description', () => {
    const result = eventDraftSchema.safeParse({
      title: 'Storm',
      effect: 'morale:-10',
    });
    expect(result.success).toBe(false);
  });

  it('rejects event with empty title', () => {
    const result = eventDraftSchema.safeParse({
      title: '',
      description: 'Something happened.',
      effect: 'morale:-5',
    });
    expect(result.success).toBe(false);
  });
});
