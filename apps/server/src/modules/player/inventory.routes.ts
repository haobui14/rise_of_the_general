import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { playerIdParamSchema } from './player.schema.js';
import { PlayerInventory } from './playerInventory.model.js';
import { equipItem, unequipItem } from './inventory.service.js';
import { NotFoundError } from '../../utils/errors.js';

const equipSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID'),
});

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

  fastify.post(
    '/api/player/:id/inventory/equip',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = playerIdParamSchema.parse(request.params);
      const { itemId } = equipSchema.parse(request.body);
      return equipItem(id, itemId);
    },
  );

  fastify.post(
    '/api/player/:id/inventory/unequip',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = playerIdParamSchema.parse(request.params);
      const { itemId } = equipSchema.parse(request.body);
      return unequipItem(id, itemId);
    },
  );
};
