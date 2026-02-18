import type { CourtActionType } from '@rotg/shared-types';
import { CourtState } from './court.model.js';
import { Player } from '../player/player.model.js';
import { applyCourtAction } from './court.engine.js';
import { NotFoundError } from '../../utils/errors.js';
import { ValidationError } from '../../utils/errors.js';

async function getOrCreateCourt(dynastyId: string) {
  let court = await CourtState.findOne({ dynastyId });
  if (!court) {
    court = await CourtState.create({ dynastyId });
  }
  return court;
}

export async function getCourtState(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const court = await getOrCreateCourt(player.dynastyId.toString());

  return {
    court: {
      _id: court._id.toString(),
      dynastyId: court.dynastyId.toString(),
      stability: court.stability,
      legitimacy: court.legitimacy,
      morale: court.morale,
      corruption: court.corruption,
      lastActionType: court.lastActionType as CourtActionType | null,
      updatedAt: court.updatedAt,
    },
    politicalTurnsRemaining: player.politicalTurns,
  };
}

export async function executeCourtAction(playerId: string, action: CourtActionType) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  if (player.politicalTurns <= 0) {
    throw new ValidationError('No political turns remaining');
  }

  const court = await getOrCreateCourt(player.dynastyId.toString());

  const { updated, deltas } = applyCourtAction(action, {
    stability: court.stability,
    legitimacy: court.legitimacy,
    morale: court.morale,
    corruption: court.corruption,
  });

  court.stability = updated.stability;
  court.legitimacy = updated.legitimacy;
  court.morale = updated.morale;
  court.corruption = updated.corruption;
  court.lastActionType = action;
  await court.save();

  player.politicalTurns -= 1;
  await player.save();

  return {
    court: {
      _id: court._id.toString(),
      dynastyId: court.dynastyId.toString(),
      stability: court.stability,
      legitimacy: court.legitimacy,
      morale: court.morale,
      corruption: court.corruption,
      lastActionType: court.lastActionType as CourtActionType | null,
      updatedAt: court.updatedAt,
    },
    player: player.toObject(),
    action,
    deltas,
    detail: deltas.detail,
  };
}
