import type { CharacterRole } from '@rotg/shared-types';
import { PlayerCharacter } from './character.model.js';
import { Player } from '../player/player.model.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export async function listCharacters(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const characters = await PlayerCharacter.find({ playerId, isAlive: true }).sort({ createdAt: 1 });

  return {
    characters: characters.map((c) => ({
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
    activeCharacterId: player.activeCharacterId?.toString() ?? null,
  };
}

export async function createCharacter(
  playerId: string,
  name: string,
  role: CharacterRole = 'officer',
) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  // Only one 'main' character allowed
  if (role === 'main') {
    const existing = await PlayerCharacter.findOne({ playerId, role: 'main', isAlive: true });
    if (existing) throw new ConflictError('A main character already exists');
  }

  const character = await PlayerCharacter.create({ playerId, name, role });

  return {
    character: {
      _id: character._id.toString(),
      playerId: character.playerId.toString(),
      name: character.name,
      role: character.role,
      loyalty: character.loyalty,
      ambition: character.ambition,
      stats: character.stats,
      isAlive: character.isAlive,
      createdAt: character.createdAt,
    },
  };
}

export async function setActiveCharacter(playerId: string, characterId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const character = await PlayerCharacter.findOne({ _id: characterId, playerId, isAlive: true });
  if (!character) throw new NotFoundError('Character not found or not alive');

  player.activeCharacterId = character._id;
  await player.save();

  return {
    player: player.toObject(),
    character: {
      _id: character._id.toString(),
      playerId: character.playerId.toString(),
      name: character.name,
      role: character.role,
      loyalty: character.loyalty,
      ambition: character.ambition,
      stats: character.stats,
      isAlive: character.isAlive,
      createdAt: character.createdAt,
    },
  };
}

export async function promoteToHeir(playerId: string, characterId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const character = await PlayerCharacter.findOne({ _id: characterId, playerId, isAlive: true });
  if (!character) throw new NotFoundError('Character not found or not alive');

  // Demote any existing heir
  await PlayerCharacter.updateMany(
    { playerId, role: 'heir', isAlive: true },
    { $set: { role: 'officer' } },
  );

  character.role = 'heir';
  await character.save();

  return {
    character: {
      _id: character._id.toString(),
      playerId: character.playerId.toString(),
      name: character.name,
      role: character.role,
      loyalty: character.loyalty,
      ambition: character.ambition,
      stats: character.stats,
      isAlive: character.isAlive,
      createdAt: character.createdAt,
    },
  };
}
