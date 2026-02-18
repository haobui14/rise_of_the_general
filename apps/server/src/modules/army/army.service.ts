import { PlayerArmy } from './army.model.js';
import { Player } from '../player/player.model.js';
import { RankDefinition } from '../rank/rank.model.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type { Formation, TroopType } from '@rotg/shared-types';

const TROOP_COST = 10; // gold per troop

export async function getArmy(playerId: string) {
  const army = await PlayerArmy.findOne({ playerId });
  return { army };
}

export async function createArmy(playerId: string, troopType: TroopType) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const rank = await RankDefinition.findById(player.currentRankId);
  if ((rank?.tier ?? 1) < 3) {
    throw new ValidationError('Rank tier 3 required to create an army');
  }

  const existing = await PlayerArmy.findOne({ playerId });
  if (existing) throw new ValidationError('You already have an army');

  const army = await PlayerArmy.create({ playerId, troopType, troopCount: 0, morale: 50, formation: 'line' });
  return { army };
}

export async function recruitTroops(playerId: string, count: number) {
  if (count <= 0) throw new ValidationError('Count must be positive');

  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const army = await PlayerArmy.findOne({ playerId });
  if (!army) throw new NotFoundError('No army — create one first');

  const cost = count * TROOP_COST;
  if (player.gold < cost) {
    throw new ValidationError(`Need ${cost} gold, have ${player.gold}`);
  }

  player.gold -= cost;
  army.troopCount += count;
  await player.save();
  await army.save();

  return { army, goldSpent: cost };
}

export async function changeFormation(playerId: string, formation: Formation) {
  const army = await PlayerArmy.findOne({ playerId });
  if (!army) throw new NotFoundError('No army');

  army.formation = formation;
  await army.save();
  return { army };
}

export async function changeTroopType(playerId: string, troopType: TroopType) {
  const army = await PlayerArmy.findOne({ playerId });
  if (!army) throw new NotFoundError('No army');

  army.troopType = troopType;
  await army.save();
  return { army };
}
