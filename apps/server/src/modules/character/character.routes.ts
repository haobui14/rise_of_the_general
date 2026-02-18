import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  listCharacters,
  createCharacter,
  setActiveCharacter,
  promoteToHeir,
} from './character.service.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid player ID'),
});

const characterIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid player ID'),
  characterId: z.string().regex(objectIdRegex, 'Invalid character ID'),
});

const createCharacterSchema = z.object({
  name: z.string().min(1).max(50),
  role: z.enum(['main', 'heir', 'officer', 'advisor']).optional(),
});

const setActiveSchema = z.object({
  characterId: z.string().regex(objectIdRegex, 'Invalid character ID'),
});

export const characterRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/characters/:id — list all characters for a player
  fastify.get('/api/characters/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return listCharacters(id);
  });

  // POST /api/characters/:id — create a new character
  fastify.post(
    '/api/characters/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const { name, role } = createCharacterSchema.parse(request.body);
      const result = await createCharacter(id, name, role);
      return reply.code(201).send(result);
    },
  );

  // PATCH /api/characters/:id/active — set active character
  fastify.patch(
    '/api/characters/:id/active',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = idParamSchema.parse(request.params);
      const { characterId } = setActiveSchema.parse(request.body);
      return setActiveCharacter(id, characterId);
    },
  );

  // PATCH /api/characters/:id/:characterId/heir — promote to heir
  fastify.patch(
    '/api/characters/:id/:characterId/heir',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id, characterId } = characterIdParamSchema.parse(request.params);
      return promoteToHeir(id, characterId);
    },
  );
};
