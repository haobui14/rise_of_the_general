import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { listCampaigns, startCampaign, getActiveCampaign } from './campaign.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const startCampaignSchema = z.object({
  playerId: z.string().regex(objectIdRegex, 'Invalid player ID'),
  campaignId: z.string().regex(objectIdRegex, 'Invalid campaign ID'),
});

const playerParamSchema = z.object({
  playerId: z.string().regex(objectIdRegex, 'Invalid player ID'),
});

export const campaignRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/campaigns', { preHandler: [fastify.authenticate] }, async () => {
    return listCampaigns();
  });

  fastify.get(
    '/api/campaigns/:playerId/active',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { playerId } = playerParamSchema.parse(request.params);
      return getActiveCampaign(playerId);
    },
  );

  fastify.post(
    '/api/campaigns/start',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = startCampaignSchema.parse(request.body);
      const result = await startCampaign(body);
      return reply.code(201).send(result);
    },
  );
};
