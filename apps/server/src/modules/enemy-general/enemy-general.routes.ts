import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getGeneralsInTerritory } from './enemy-general.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const territoryParamSchema = z.object({
  territoryId: z.string().regex(objectIdRegex, 'Invalid territory ID'),
});

export const enemyGeneralRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/enemy-generals/territory/:territoryId',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { territoryId } = territoryParamSchema.parse(request.params);
      return getGeneralsInTerritory(territoryId);
    },
  );
};
