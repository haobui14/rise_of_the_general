import { Duel } from './duel.model.js';
import { Player } from '../player/player.model.js';
import { PlayerCharacter } from '../character/character.model.js';
import { PlayerInventory } from '../player/playerInventory.model.js';
import { Brotherhood } from '../brotherhood/brotherhood.model.js';
import { calculateDuelPower, canTriggerDuel, resolveDuel } from './duel.engine.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';

export async function challengeDuel(data: {
  playerId: string;
  challengerCharacterId: string;
  opponentName: string;
  opponentStats: { strength: number; defense: number; strategy: number; speed: number; leadership: number };
  trigger: 'insult' | 'ambush' | 'challenge' | 'honor_dispute';
}) {
  const player = await Player.findById(data.playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (!canTriggerDuel(player.romanceMode, data.trigger)) throw new ForbiddenError('Romance mode is disabled for duels');

  const character = await PlayerCharacter.findOne({ _id: data.challengerCharacterId, playerId: data.playerId, isAlive: true });
  if (!character) throw new NotFoundError('Challenger character not found');

  const inventory = await PlayerInventory.findOne({ playerId: data.playerId }).populate('items.itemId');
  const mythicWeapon = inventory?.items
    .filter((i) => i.equipped && i.itemId)
    .map((i: any) => i.itemId)
    .find((item: any) => item.rarity === 'mythic' && item.type === 'weapon');
  const mythicBonus = mythicWeapon?.duelBonus?.strengthMultiplier ?? 1;

  const brotherhood = await Brotherhood.findOne({ playerId: data.playerId, memberCharacterIds: character._id });
  const brotherhoodLevel = brotherhood?.bondLevel ?? 0;

  const challengerPower = calculateDuelPower(character.stats, character.destiny ?? 'unknown', mythicBonus, brotherhoodLevel);
  const opponentPower = calculateDuelPower(data.opponentStats, 'unknown', 1, 0);
  const result = resolveDuel({ challengerPower, opponentPower });

  player.merit += result.merit;
  player.experience += result.exp;
  await player.save();

  const duel = await Duel.create({
    playerId: data.playerId,
    challengerCharacterId: data.challengerCharacterId,
    opponentName: data.opponentName,
    opponentStats: data.opponentStats,
    trigger: data.trigger,
    outcome: result.outcome,
    rounds: result.rounds,
    rewardMerit: result.merit,
    rewardExp: result.exp,
  });

  return { duel };
}

export async function listDuels(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (!player.romanceMode) throw new ForbiddenError('Romance mode is disabled for duels');

  const duels = await Duel.find({ playerId }).sort({ createdAt: -1 });
  return { duels };
}

export async function getDuel(duelId: string) {
  const duel = await Duel.findById(duelId);
  if (!duel) throw new NotFoundError('Duel not found');
  const player = await Player.findById(duel.playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (!player.romanceMode) throw new ForbiddenError('Romance mode is disabled for duels');
  return { duel };
}
