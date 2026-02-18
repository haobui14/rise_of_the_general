import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getSuccessionState, confirmSuccession } from './succession.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid player ID'),
});

const confirmSuccessionSchema = z.object({
  successorId: z.string().regex(objectIdRegex, 'Invalid successor ID'),
});

export const successionRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/succession/:id — get current succession state
  fastify.get('/api/succession/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return getSuccessionState(id);
  });

  // POST /api/succession/:id/confirm — confirm succession choice
  fastify.post(
    '/api/succession/:id/confirm',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { successorId } = confirmSuccessionSchema.parse(request.body);
      return confirmSuccession(id, successorId);
    },
  );
};
