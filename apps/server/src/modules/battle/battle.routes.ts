import type { FastifyPluginAsync } from 'fastify';
import { startBattleSchema } from './battle.schema.js';
import { listTemplates, startAndResolveBattle } from './battle.service.js';

export const battleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/battle/templates',
    { preHandler: [fastify.authenticate] },
    async () => {
      return listTemplates();
    },
  );

  fastify.post(
    '/api/battle/fight',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = startBattleSchema.parse(request.body);
      const result = await startAndResolveBattle(body);
      return reply.code(201).send(result);
    },
  );
};
