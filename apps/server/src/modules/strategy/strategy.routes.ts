import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { performAction } from './strategy.service.js';
import type { StrategicActionType } from '@rotg/shared-types';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const baseActionSchema = z.object({
  playerId: z.string().regex(objectIdRegex, 'Invalid player ID'),
  territoryId: z.string().regex(objectIdRegex, 'Invalid territory ID').optional(),
});

function makeHandler(action: StrategicActionType): FastifyPluginAsync {
  return async (fastify) => {
    fastify.post(
      `/api/strategy/${action}`,
      { preHandler: [fastify.authenticate] },
      async (request, reply) => {
        const { playerId, territoryId } = baseActionSchema.parse(request.body);
        const result = await performAction(playerId, action, { territoryId });
        return reply.code(201).send(result);
      },
    );
  };
}

export const strategyRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(makeHandler('rest'));
  await fastify.register(makeHandler('drill'));
  await fastify.register(makeHandler('fortify'));
  await fastify.register(makeHandler('spy'));
};
