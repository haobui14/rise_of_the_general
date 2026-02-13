import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { listGenerals, recruitGeneral } from './general.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid ID'),
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
};
