import { PlayerInventory } from './playerInventory.model.js';
import { Item } from '../item/item.model.js';
import { NotFoundError } from '../../utils/errors.js';

export async function equipItem(playerId: string, itemId: string) {
  const inventory = await PlayerInventory.findOne({ playerId }).populate('items.itemId');
  if (!inventory) throw new NotFoundError('Inventory not found');

  const entry = inventory.items.find((i) => i.itemId && (i.itemId as any)._id.toString() === itemId);
  if (!entry) throw new NotFoundError('Item not in inventory');

  const item = entry.itemId as any;

  // Unequip any existing item of the same type (max 1 weapon + 1 armor)
  for (const other of inventory.items) {
    if (other.equipped && other.itemId) {
      const otherItem = other.itemId as any;
      if (otherItem.type === item.type) {
        other.equipped = false;
      }
    }
  }

  entry.equipped = true;
  await inventory.save();

  const updated = await PlayerInventory.findOne({ playerId }).populate('items.itemId');
  return { inventory: updated };
}

export async function unequipItem(playerId: string, itemId: string) {
  const inventory = await PlayerInventory.findOne({ playerId }).populate('items.itemId');
  if (!inventory) throw new NotFoundError('Inventory not found');

  const entry = inventory.items.find((i) => i.itemId && (i.itemId as any)._id.toString() === itemId);
  if (!entry) throw new NotFoundError('Item not in inventory');

  entry.equipped = false;
  await inventory.save();

  const updated = await PlayerInventory.findOne({ playerId }).populate('items.itemId');
  return { inventory: updated };
}
