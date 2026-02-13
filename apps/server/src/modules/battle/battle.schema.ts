import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const startBattleSchema = z.object({
  playerId: z.string().regex(objectIdRegex, 'Invalid player ID'),
  templateId: z.string().regex(objectIdRegex, 'Invalid template ID'),
});

export const battleIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid battle ID'),
});
