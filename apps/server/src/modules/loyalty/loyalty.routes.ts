import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { tickLoyaltyDecay } from './loyalty.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const tickBodySchema = z.object({
  playerId: z.string().regex(objectIdRegex, 'Invalid player ID'),
});

export const loyaltyRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/loyalty/tick — apply idle decay and check for betrayals
  fastify.post(
    '/api/loyalty/tick',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { playerId } = tickBodySchema.parse(request.body);
      const result = await tickLoyaltyDecay(playerId);
      return reply.code(200).send(result);
    },
  );
};
