import { PlayerInjury } from './injury.model.js';

export async function getInjuries(playerId: string) {
  const injuries = await PlayerInjury.find({ playerId, battlesRemaining: { $gt: 0 } });
  return { injuries };
}
