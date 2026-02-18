import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getInjuries } from './injury.service.js';

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
});

export const injuryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/player/:id/injuries',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      return getInjuries(id);
    },
  );
};
