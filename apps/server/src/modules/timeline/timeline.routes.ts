import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDivergenceStatus } from './timeline.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const dynastyIdParamSchema = z.object({
  dynastyId: z.string().regex(objectIdRegex, 'Invalid dynasty ID'),
});

export const timelineRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/timeline/:dynastyId — get current timeline divergence status
  fastify.get(
    '/api/timeline/:dynastyId',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { dynastyId } = dynastyIdParamSchema.parse(request.params);
      return getDivergenceStatus(dynastyId);
    },
  );
};
