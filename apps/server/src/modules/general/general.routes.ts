import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { listGenerals, recruitGeneral, getActiveGenerals, deployGeneral, withdrawGeneral } from './general.service.js';
import { calculateSynergyBonus } from './synergy.engine.js';
import { SYNERGY_PAIRS } from './synergy.config.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid ID'),
});

const generalIdSchema = z.object({
  generalId: z.string().regex(objectIdRegex, 'Invalid general ID'),
});

export const generalRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/generals/:id',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      return listGenerals(id);
    },
  );

  fastify.post(
    '/api/generals/:id/recruit',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id: generalId } = idParamSchema.parse(request.params);
      const playerId = request.user.playerId;
      return recruitGeneral(playerId, generalId);
    },
  );

  fastify.get(
    '/api/player/:id/generals/active',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      return getActiveGenerals(id);
    },
  );

  fastify.post(
    '/api/player/:id/generals/deploy',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { generalId } = generalIdSchema.parse(request.body);
      return deployGeneral(id, generalId);
    },
  );

  fastify.post(
    '/api/player/:id/generals/withdraw',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { generalId } = generalIdSchema.parse(request.body);
      return withdrawGeneral(id, generalId);
    },
  );

  // Synergy endpoints
  fastify.get('/api/synergies', async () => {
    return { synergies: SYNERGY_PAIRS };
  });

  fastify.get(
    '/api/player/:id/synergies/active',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { activeGenerals } = await getActiveGenerals(id);
      const names = activeGenerals.map((g: any) => g.name);
      return calculateSynergyBonus(names);
    },
  );
};
