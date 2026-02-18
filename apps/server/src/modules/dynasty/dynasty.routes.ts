import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLegacy, completeDynasty } from './dynasty.service.js';

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
});

export const dynastyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/player/:id/legacy',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      return getLegacy(id);
    },
  );

  fastify.post(
    '/api/player/:id/dynasty/complete',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      return completeDynasty(id);
    },
  );
};
