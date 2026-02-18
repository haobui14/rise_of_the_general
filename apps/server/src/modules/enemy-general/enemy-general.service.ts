import { EnemyGeneral } from './enemy-general.model.js';
import { NotFoundError } from '../../utils/errors.js';

export async function getGeneralsInTerritory(territoryId: string) {
  const generals = await EnemyGeneral.find({ territoryId, alive: true });
  return { generals };
}

export async function resolveGeneralDefeat(generalId: string) {
  const general = await EnemyGeneral.findById(generalId);
  if (!general) throw new NotFoundError('Enemy general not found');

  if (!general.alive) throw new NotFoundError('Enemy general is already defeated');

  // Boss generals with canRetreat may survive — they flee to an adjacent territory
  if (general.canRetreat && Math.random() > 0.5) {
    // Find another territory that belongs to the same faction (simplified: just leave them alive but displaced)
    return { general, retreated: true };
  }

  general.alive = false;
  await general.save();
  return { general, retreated: false };
}
