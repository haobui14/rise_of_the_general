import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Player } from '../player/player.model.js';
import { createPlayer } from '../player/player.service.js';

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  factionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid faction ID'),
});

const loginSchema = z.object({
  username: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const { player } = await createPlayer(body);
    const token = fastify.jwt.sign({ playerId: player._id.toString() });
    return reply.code(201).send({ token, player });
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const player = await Player.findOne({ username: body.username });
    if (!player) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Player not found',
      });
    }
    const token = fastify.jwt.sign({ playerId: player._id.toString() });
    return reply.send({ token, player });
  });
};
