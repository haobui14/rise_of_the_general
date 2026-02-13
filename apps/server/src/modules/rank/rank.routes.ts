import type { FastifyPluginAsync } from 'fastify';
import { RankDefinition } from './rank.model.js';

export const rankRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/ranks', { preHandler: [fastify.authenticate] }, async () => {
    const ranks = await RankDefinition.find().sort({ tier: 1 });
    return { ranks };
  });
};
