import { PlayerInventory } from './playerInventory.model.js';
import { Item } from '../item/item.model.js';
import { Player } from './player.model.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

export async function equipItem(playerId: string, itemId: string) {
  const inventory = await PlayerInventory.findOne({ playerId }).populate('items.itemId');
  if (!inventory) throw new NotFoundError('Inventory not found');

  const entry = inventory.items.find((i) => i.itemId && (i.itemId as any)._id.toString() === itemId);
  if (!entry) throw new NotFoundError('Item not in inventory');

  const item = entry.itemId as any;

  // Mythic constraint: max 1 mythic equipped across all slots
  if (item.rarity === 'mythic') {
    const equippedMythic = inventory.items.find((i) => i.equipped && i.itemId && (i.itemId as any).rarity === 'mythic' && (i.itemId as any)._id.toString() !== itemId);
    if (equippedMythic) {
      throw new ValidationError('Only one mythic item may be equipped at a time');
    }
  }

  // Unequip any existing item of the same type (max 1 weapon + 1 armor)
  for (const other of inventory.items) {
    if (other.equipped && other.itemId) {
      const otherItem = other.itemId as any;
      if (otherItem.type === item.type) {
        other.equipped = false;
      }
    }
  }

  // Once mythic is equipped, it binds permanently to active character when present
  if (item.rarity === 'mythic' && !item.boundToCharacterId) {
    const activeCharId = (await Player.findById(playerId))?.activeCharacterId;
    if (activeCharId) {
      const found = await Item.findById(itemId);
      if (found && !found.boundToCharacterId) {
        found.boundToCharacterId = activeCharId as any;
        await found.save();
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
