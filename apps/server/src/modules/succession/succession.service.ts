import { Player } from '../player/player.model.js';
import { PlayerCharacter } from '../character/character.model.js';
import { DynastyState } from '../dynasty-state/dynasty-state.model.js';
import { resolveSuccession } from './succession.engine.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

/** Mark the current active character as deceased and set succession flag. */
export async function triggerDeath(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (player.successionPending) return; // already pending

  // Kill active character if set
  if (player.activeCharacterId) {
    await PlayerCharacter.findByIdAndUpdate(player.activeCharacterId, { isAlive: false });
  }

  player.successionPending = true;
  await player.save();
}

/** Return current succession state for the frontend confirmation screen. */
export async function getSuccessionState(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  if (!player.successionPending) {
    return {
      pending: false,
      deceasedName: null,
      candidates: [],
      stabilityDelta: 0,
      moraleDelta: 0,
      legitimacyDelta: 0,
    };
  }

  const deceased = player.activeCharacterId
    ? await PlayerCharacter.findById(player.activeCharacterId)
    : null;

  const livingCharacters = await PlayerCharacter.find({
    playerId,
    isAlive: true,
    role: { $ne: 'main' },
  });

  const successionResult = resolveSuccession(
    livingCharacters.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      role: c.role,
      loyalty: c.loyalty,
      isAlive: c.isAlive,
    })),
  );

  return {
    pending: true,
    deceasedName: deceased?.name ?? 'the fallen commander',
    candidates: livingCharacters.map((c) => ({
      _id: c._id.toString(),
      playerId: c.playerId.toString(),
      name: c.name,
      role: c.role,
      loyalty: c.loyalty,
      ambition: c.ambition,
      stats: c.stats,
      isAlive: c.isAlive,
      createdAt: c.createdAt,
    })),
    stabilityDelta: successionResult.stabilityDelta,
    moraleDelta: successionResult.moraleDelta,
    legitimacyDelta: successionResult.legitimacyDelta,
  };
}

/** Confirm succession: install a new active character and apply court deltas. */
export async function confirmSuccession(playerId: string, successorId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (!player.successionPending) throw new ConflictError('No pending succession');

  const successor = await PlayerCharacter.findOne({
    _id: successorId,
    playerId,
    isAlive: true,
  });
  if (!successor) throw new NotFoundError('Successor not found or not alive');

  // Promote successor to main
  successor.role = 'main';
  await successor.save();

  // Calculate deltas
  const allLiving = await PlayerCharacter.find({ playerId, isAlive: true, role: { $ne: 'main' } });
  const result = resolveSuccession(
    allLiving.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      role: c.role,
      loyalty: c.loyalty,
      isAlive: c.isAlive,
    })),
  );

  // Apply stability delta to dynasty state
  const dynastyState = await DynastyState.findOne({ dynastyId: player.dynastyId });
  if (dynastyState) {
    dynastyState.stability = Math.max(0, dynastyState.stability + result.stabilityDelta);
    await dynastyState.save();
  }

  // Update player
  player.activeCharacterId = successor._id as unknown as typeof player.activeCharacterId;
  player.successionPending = false;
  await player.save();

  return {
    player: player.toObject(),
    newCharacter: {
      _id: successor._id.toString(),
      playerId: successor.playerId.toString(),
      name: successor.name,
      role: successor.role,
      loyalty: successor.loyalty,
      ambition: successor.ambition,
      stats: successor.stats,
      isAlive: successor.isAlive,
      createdAt: successor.createdAt,
    },
    stabilityDelta: result.stabilityDelta,
    moraleDelta: result.moraleDelta,
    legitimacyDelta: result.legitimacyDelta,
  };
}
