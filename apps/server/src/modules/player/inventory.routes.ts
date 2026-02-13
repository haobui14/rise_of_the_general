import type { FastifyPluginAsync } from 'fastify';
import { playerIdParamSchema } from './player.schema.js';
import { PlayerInventory } from './playerInventory.model.js';
import { NotFoundError } from '../../utils/errors.js';

export const inventoryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/player/:id/inventory',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = playerIdParamSchema.parse(request.params);
      const inventory = await PlayerInventory.findOne({ playerId: id }).populate('items.itemId');
      if (!inventory) throw new NotFoundError('Inventory not found');
      return { inventory };
    },
  );
};
