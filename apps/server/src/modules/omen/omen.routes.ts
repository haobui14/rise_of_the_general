import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { listOmens, resolveOmen, triggerOmen } from './omen.service.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const omenRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/omens/:dynastyId', { preHandler: [fastify.authenticate] }, async (request) => {
    const { dynastyId } = z.object({ dynastyId: objectId }).parse(request.params);
    return listOmens(dynastyId);
  });

  fastify.post('/api/omens/:dynastyId/trigger', { preHandler: [fastify.authenticate] }, async (request) => {
    const { dynastyId } = z.object({ dynastyId: objectId }).parse(request.params);
    return triggerOmen(dynastyId);
  });

  fastify.post('/api/omens/:omenId/resolve', { preHandler: [fastify.authenticate] }, async (request) => {
    const { omenId } = z.object({ omenId: objectId }).parse(request.params);
    return resolveOmen(omenId);
  });
};
