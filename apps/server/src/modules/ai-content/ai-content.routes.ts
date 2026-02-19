import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  generateCampaignDraft,
  generateNarrative,
  generateOfficer,
  spawnAiEnemyGeneral,
  spawnAllGenerals,
  generateOathNarration,
  generateDuelNarration,
  generateOmenNarration,
  generateLegendNarration,
} from './ai-content.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const generateCampaignSchema = z.object({
  playerId: z.string().regex(objectIdRegex),
  context: z.string().max(300).optional(),
});

const generateNarrativeSchema = z.object({
  playerId: z.string().regex(objectIdRegex),
  event: z.string().min(1).max(200),
  context: z.string().max(300).optional(),
});

const generateOfficerSchema = z.object({
  playerId: z.string().regex(objectIdRegex),
  role: z.enum(['main', 'heir', 'officer', 'advisor']).optional(),
});

export const aiContentRoutes: FastifyPluginAsync = async (fastify) => {

  const romanceSchema = z.object({ context: z.string().min(1).max(400) });

  fastify.post('/api/ai-content/generate-oath-narration', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { context } = romanceSchema.parse(request.body);
    const text = await generateOathNarration(context);
    if (!text) return reply.code(503).send({ message: 'AI oath generation unavailable' });
    return { text };
  });

  fastify.post('/api/ai-content/generate-duel-narration', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { context } = romanceSchema.parse(request.body);
    const text = await generateDuelNarration(context);
    if (!text) return reply.code(503).send({ message: 'AI duel generation unavailable' });
    return { text };
  });

  fastify.post('/api/ai-content/generate-omen', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { context } = romanceSchema.parse(request.body);
    const omen = await generateOmenNarration(context);
    if (!omen) return reply.code(503).send({ message: 'AI omen generation unavailable' });
    return omen;
  });

  fastify.post('/api/ai-content/generate-legend', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { context } = romanceSchema.parse(request.body);
    const text = await generateLegendNarration(context);
    if (!text) return reply.code(503).send({ message: 'AI legend generation unavailable' });
    return { text };
  });
  // POST /api/ai-content/generate-campaign
  fastify.post(
    '/api/ai-content/generate-campaign',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { playerId, context } = generateCampaignSchema.parse(request.body);
      const draft = await generateCampaignDraft(playerId, context);

      if (!draft) {
        return reply.code(503).send({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'AI content generation is not enabled or unavailable.',
        });
      }

      return reply.code(200).send({
        draftId: `draft-${Date.now()}`,
        ...draft,
      });
    },
  );

  // POST /api/ai-content/generate-narrative
  fastify.post(
    '/api/ai-content/generate-narrative',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { playerId, event, context } = generateNarrativeSchema.parse(request.body);
      const text = await generateNarrative(playerId, event, context);

      if (!text) {
        return reply.code(503).send({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'AI narrative generation is not enabled or unavailable.',
        });
      }

      return reply.code(200).send({ text });
    },
  );

  // POST /api/ai-content/generate-officer
  fastify.post(
    '/api/ai-content/generate-officer',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { playerId, role } = generateOfficerSchema.parse(request.body);
      const officer = await generateOfficer(playerId, role);

      if (!officer) {
        return reply.code(503).send({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'AI officer generation is not enabled or unavailable.',
        });
      }

      return reply.code(200).send(officer);
    },
  );

  // POST /api/ai-content/spawn-enemy-general
  fastify.post(
    '/api/ai-content/spawn-enemy-general',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const schema = z.object({
        territoryId: z.string().regex(objectIdRegex),
        faction: z.string().max(50).optional(),
        level: z.number().int().min(1).max(10).optional(),
      });
      const { territoryId, faction, level } = schema.parse(request.body);
      try {
        const result = await spawnAiEnemyGeneral(territoryId, faction, level ?? 1);
        return reply.code(201).send(result);
      } catch (err: any) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: err.message ?? 'Failed to spawn general.',
        });
      }
    },
  );

  // POST /api/ai-content/spawn-all-generals
  fastify.post(
    '/api/ai-content/spawn-all-generals',
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      const result = await spawnAllGenerals();
      return reply.code(200).send(result);
    },
  );
};
