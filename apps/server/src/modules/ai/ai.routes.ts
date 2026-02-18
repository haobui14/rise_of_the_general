import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { advanceAiTurn, listAiFactions } from './ai.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const advanceAiSchema = z.object({
  factionId: z.string().regex(objectIdRegex, 'Invalid faction ID'),
});

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/ai/factions', { preHandler: [fastify.authenticate] }, async () => {
    return listAiFactions();
  });

  fastify.post(
    '/api/ai/advance',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { factionId } = advanceAiSchema.parse(request.body);
      const result = await advanceAiTurn(factionId);
      return reply.code(201).send(result);
    },
  );
};
