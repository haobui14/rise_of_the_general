import type { FastifyPluginAsync } from 'fastify';
import { playerIdParamSchema } from './player.schema.js';
import { getPlayer, promotePlayer } from './player.service.js';

export const playerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/player/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = playerIdParamSchema.parse(request.params);
    return getPlayer(id);
  });

  fastify.post(
    '/api/player/:id/promote',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = playerIdParamSchema.parse(request.params);
      return promotePlayer(id);
    },
  );
};
