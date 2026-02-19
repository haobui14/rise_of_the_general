import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { addBrotherhoodMember, createBrotherhood, listBrotherhoods, removeBrotherhoodMember } from './brotherhood.service.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const brotherhoodRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/brotherhood/:playerId', { preHandler: [fastify.authenticate] }, async (request) => {
    const { playerId } = z.object({ playerId: objectId }).parse(request.params);
    return listBrotherhoods(playerId);
  });

  fastify.post('/api/brotherhood/:playerId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { playerId } = z.object({ playerId: objectId }).parse(request.params);
    const { name, memberCharacterIds } = z.object({ name: z.string().min(2).max(60), memberCharacterIds: z.array(objectId).min(2).max(3) }).parse(request.body);
    const result = await createBrotherhood(playerId, name, memberCharacterIds);
    return reply.code(201).send(result);
  });

  fastify.post('/api/brotherhood/:id/add', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = z.object({ id: objectId }).parse(request.params);
    const { characterId } = z.object({ characterId: objectId }).parse(request.body);
    return addBrotherhoodMember(id, characterId);
  });

  fastify.delete('/api/brotherhood/:id/remove', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = z.object({ id: objectId }).parse(request.params);
    const { characterId } = z.object({ characterId: objectId }).parse(request.body);
    return removeBrotherhoodMember(id, characterId);
  });
};
