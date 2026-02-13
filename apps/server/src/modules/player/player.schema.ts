import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createPlayerSchema = z.object({
  username: z.string().min(3).max(30),
  factionId: z.string().regex(objectIdRegex, 'Invalid faction ID'),
});

export const playerIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid player ID'),
});
