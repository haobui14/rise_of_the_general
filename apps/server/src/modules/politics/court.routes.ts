import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getCourtState, executeCourtAction } from './court.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid player ID'),
});

const courtActionSchema = z.object({
  playerId: z.string().regex(objectIdRegex, 'Invalid player ID'),
  action: z.enum(['negotiate', 'purge', 'reform', 'propaganda']),
});

export const politicsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/politics/:id — get court state for a player
  fastify.get('/api/politics/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return getCourtState(id);
  });

  // POST /api/politics/action — execute a court action
  fastify.post(
    '/api/politics/action',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { playerId, action } = courtActionSchema.parse(request.body);
      const result = await executeCourtAction(playerId, action);
      return reply.code(200).send(result);
    },
  );
};
