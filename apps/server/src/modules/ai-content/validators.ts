import { z } from 'zod';

/** Validates campaign draft JSON from AI response. */
export const campaignDraftSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  suggestedObjectives: z.array(z.string()).min(1).max(5),
  estimatedDifficulty: z.number().int().min(1).max(5),
});

/** Validates officer draft JSON from AI response. */
export const officerDraftSchema = z.object({
  name: z.string().min(1).max(60),
  backstory: z.string().min(1).max(400),
  suggestedStats: z.object({
    strength: z.number().int().min(1).max(15),
    defense: z.number().int().min(1).max(15),
    strategy: z.number().int().min(1).max(15),
    speed: z.number().int().min(1).max(15),
    leadership: z.number().int().min(1).max(15),
  }),
  suggestedRole: z.enum(['main', 'heir', 'officer', 'advisor']),
});

/** Validates enemy general JSON from AI response. */
export const enemyGeneralDraftSchema = z.object({
  name: z.string().min(1).max(60),
  title: z.string().min(1).max(100),
  lore: z.string().min(1).max(400),
});

/** Event schema. */
export const eventDraftSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  effect: z.string().min(1).max(200),
});

export type CampaignDraft = z.infer<typeof campaignDraftSchema>;
export type OfficerDraft = z.infer<typeof officerDraftSchema>;
export type EnemyGeneralDraft = z.infer<typeof enemyGeneralDraftSchema>;
export type EventDraft = z.infer<typeof eventDraftSchema>;


export const oathNarrationSchema = z.object({
  text: z.string().min(1).max(600),
});

export const duelNarrationSchema = z.object({
  text: z.string().min(1).max(600),
});

export const omenNarrationSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
});

export const legendNarrationSchema = z.object({
  text: z.string().min(1).max(700),
});
