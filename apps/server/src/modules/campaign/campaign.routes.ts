import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  createCampaign,
  listCampaigns,
  startCampaign,
  getActiveCampaign,
} from './campaign.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createCampaignSchema = z.object({
  playerId: z.string().regex(objectIdRegex, 'Invalid player ID'),
  name: z.string().min(1).max(80),
  territoriesRequired: z.number().int().min(1).max(50),
  generalsDefeated: z.number().int().min(0).max(50),
});

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

  fastify.post(
    '/api/campaigns',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = createCampaignSchema.parse(request.body);
      const result = await createCampaign(body);
      return reply.code(201).send(result);
    },
  );

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
