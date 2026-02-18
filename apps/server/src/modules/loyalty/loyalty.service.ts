import type { LoyaltyEventType } from '@rotg/shared-types';
import { PlayerCharacter } from '../character/character.model.js';
import { DynastyState } from '../dynasty-state/dynasty-state.model.js';
import { Player } from '../player/player.model.js';
import { calculateLoyaltyDelta, clampLoyalty, checkBetrayalCondition } from './loyalty.engine.js';
import { NotFoundError } from '../../utils/errors.js';

/** Apply a loyalty event to all living, non-main characters of a player. */
export async function applyLoyaltyEvent(playerId: string, event: LoyaltyEventType) {
  const delta = calculateLoyaltyDelta(event);
  const characters = await PlayerCharacter.find({
    playerId,
    isAlive: true,
    role: { $ne: 'main' },
  });

  const updates: Array<{ characterId: string; newLoyalty: number }> = [];

  for (const char of characters) {
    const newLoyalty = clampLoyalty(char.loyalty + delta);
    char.loyalty = newLoyalty;
    await char.save();
    updates.push({ characterId: char._id.toString(), newLoyalty });
  }

  return updates;
}

/**
 * Check each living character for betrayal.
 * Returns array of betrayal events (characters that defected).
 */
export async function processBetrayalIfTriggered(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const characters = await PlayerCharacter.find({
    playerId,
    isAlive: true,
    role: { $ne: 'main' },
  });

  const betrayals: Array<{
    characterId: string;
    characterName: string;
    territoriesLost: string[];
    stabilityDelta: number;
  }> = [];

  for (const char of characters) {
    if (checkBetrayalCondition({ loyalty: char.loyalty, ambition: char.ambition })) {
      // Mark character as defected (keep in DB but no longer active)
      char.role = 'officer'; // demote
      char.isAlive = false;
      await char.save();

      const stabilityDelta = -15;

      // Update dynasty stability
      const dynastyState = await DynastyState.findOne({ dynastyId: player.dynastyId });
      if (dynastyState) {
        dynastyState.stability = Math.max(0, dynastyState.stability + stabilityDelta);
        if (dynastyState.stability < 50) {
          dynastyState.corruption = Math.min(100, dynastyState.corruption + 2);
        }
        await dynastyState.save();
      }

      betrayals.push({
        characterId: char._id.toString(),
        characterName: char.name,
        territoriesLost: [],
        stabilityDelta,
      });
    }
  }

  return betrayals;
}

/** Idle loyalty decay — called on loyalty tick. */
export async function tickLoyaltyDecay(playerId: string) {
  const affectedCharacters = await applyLoyaltyEvent(playerId, 'idle_decay');
  const betrayals = await processBetrayalIfTriggered(playerId);
  return { affectedCharacters, betrayals };
}
