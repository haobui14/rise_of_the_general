import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getArmy, createArmy, recruitTroops, changeFormation, changeTroopType } from './army.service.js';

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
});

export const armyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/player/:id/army',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      return getArmy(id);
    },
  );

  fastify.post(
    '/api/player/:id/army',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { troopType } = z.object({ troopType: z.enum(['infantry', 'cavalry', 'archer']) }).parse(request.body);
      return createArmy(id, troopType);
    },
  );

  fastify.patch(
    '/api/player/:id/army/formation',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { formation } = z.object({ formation: z.enum(['line', 'wedge', 'phalanx', 'skirmish']) }).parse(request.body);
      return changeFormation(id, formation);
    },
  );

  fastify.patch(
    '/api/player/:id/army/recruit',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { count } = z.object({ count: z.number().int().positive() }).parse(request.body);
      return recruitTroops(id, count);
    },
  );

  fastify.patch(
    '/api/player/:id/army/troop-type',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { troopType } = z.object({ troopType: z.enum(['infantry', 'cavalry', 'archer']) }).parse(request.body);
      return changeTroopType(id, troopType);
    },
  );
};
