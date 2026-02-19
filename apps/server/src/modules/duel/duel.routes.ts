import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { challengeDuel, getDuel, listDuels } from './duel.service.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const duelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/duel/challenge', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = z.object({
      playerId: objectId,
      challengerCharacterId: objectId,
      opponentName: z.string().min(1).max(60),
      opponentStats: z.object({ strength: z.number().min(1), defense: z.number().min(1), strategy: z.number().min(1), speed: z.number().min(1), leadership: z.number().min(1) }),
      trigger: z.enum(['insult', 'ambush', 'challenge', 'honor_dispute']),
    }).parse(request.body);
    const result = await challengeDuel(body);
    return reply.code(201).send(result);
  });

  // canonical list route
  fastify.get('/api/duel/player/:playerId', { preHandler: [fastify.authenticate] }, async (request) => {
    const { playerId } = z.object({ playerId: objectId }).parse(request.params);
    return listDuels(playerId);
  });

  // backward-compatible route from previous implementation
  fastify.get('/api/duel/:playerId', { preHandler: [fastify.authenticate] }, async (request) => {
    const { playerId } = z.object({ playerId: objectId }).parse(request.params);
    return listDuels(playerId);
  });

  // canonical detail route
  fastify.get('/api/duel/:duelId/detail', { preHandler: [fastify.authenticate] }, async (request) => {
    const { duelId } = z.object({ duelId: objectId }).parse(request.params);
    return getDuel(duelId);
  });

  // backward-compatible detail route from previous implementation
  fastify.get('/api/duel/detail/:duelId', { preHandler: [fastify.authenticate] }, async (request) => {
    const { duelId } = z.object({ duelId: objectId }).parse(request.params);
    return getDuel(duelId);
  });
};
