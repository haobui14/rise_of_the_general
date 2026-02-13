import { Faction } from './faction.model.js';
import '../dynasty/dynasty.model.js';

export async function listFactions() {
  const factions = await Faction.find();
  return { factions };
}
