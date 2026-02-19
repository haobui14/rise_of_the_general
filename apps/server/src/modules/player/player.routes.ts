import type { FastifyPluginAsync } from 'fastify';
import { playerIdNamedParamSchema, playerIdParamSchema, toggleRomanceModeSchema } from './player.schema.js';
import { getPlayer, promotePlayer, toggleRomanceMode } from './player.service.js';

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

  fastify.patch('/api/player/:id/romance-mode', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = playerIdParamSchema.parse(request.params);
    const { romanceMode } = toggleRomanceModeSchema.parse(request.body);
    return toggleRomanceMode(id, romanceMode);
  });

  fastify.patch('/api/player/:playerId/romance-mode', { preHandler: [fastify.authenticate] }, async (request) => {
    const { playerId } = playerIdNamedParamSchema.parse(request.params);
    const { romanceMode } = toggleRomanceModeSchema.parse(request.body);
    return toggleRomanceMode(playerId, romanceMode);
  });
};
