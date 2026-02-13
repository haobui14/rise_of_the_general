import type { FastifyPluginAsync } from 'fastify';
import { listFactions } from './faction.service.js';

export const factionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/factions', async () => {
    return listFactions();
  });
};
