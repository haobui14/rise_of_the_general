import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getWorldMap, getTerritoryById, attackTerritory } from './world.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const territoryParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid territory ID'),
});

const attackTerritorySchema = z.object({
  playerId: z.string().regex(objectIdRegex, 'Invalid player ID'),
  territoryId: z.string().regex(objectIdRegex, 'Invalid territory ID'),
});

export const worldRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/world/map', { preHandler: [fastify.authenticate] }, async () => {
    return getWorldMap();
  });

  fastify.get(
    '/api/world/territory/:id',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = territoryParamSchema.parse(request.params);
      return getTerritoryById(id);
    },
  );

  fastify.post(
    '/api/world/attack',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = attackTerritorySchema.parse(request.body);
      const result = await attackTerritory(body);
      return reply.code(201).send(result);
    },
  );
};
