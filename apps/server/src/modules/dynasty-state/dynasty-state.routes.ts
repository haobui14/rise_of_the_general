import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDynastyState, getActiveDynastyState } from './dynasty-state.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const dynastyParamSchema = z.object({
  dynastyId: z.string().regex(objectIdRegex, 'Invalid dynasty ID'),
});

export const dynastyStateRoutes: FastifyPluginAsync = async (fastify) => {
  // Returns the active dynasty state (no ID needed)
  fastify.get('/api/dynasty-state', { preHandler: [fastify.authenticate] }, async () => {
    return getActiveDynastyState();
  });

  fastify.get(
    '/api/dynasty-state/:dynastyId',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { dynastyId } = dynastyParamSchema.parse(request.params);
      return getDynastyState(dynastyId);
    },
  );
};
