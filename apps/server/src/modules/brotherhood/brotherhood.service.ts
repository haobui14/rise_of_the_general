import { Brotherhood } from './brotherhood.model.js';
import { Player } from '../player/player.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';

export async function listBrotherhoods(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (!player.romanceMode) throw new ForbiddenError('Romance mode is disabled');

  const brotherhoods = await Brotherhood.find({ playerId }).sort({ createdAt: -1 });
  return { brotherhoods };
}

export async function createBrotherhood(playerId: string, name: string, memberCharacterIds: string[]) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (!player.romanceMode) throw new ForbiddenError('Romance mode is disabled');
  if (memberCharacterIds.length < 2 || memberCharacterIds.length > 3) {
    throw new ValidationError('Brotherhood requires 2 to 3 members');
  }

  const brotherhood = await Brotherhood.create({ playerId, name, memberCharacterIds });
  return { brotherhood };
}

export async function addBrotherhoodMember(id: string, characterId: string) {
  const brotherhood = await Brotherhood.findById(id);
  if (!brotherhood) throw new NotFoundError('Brotherhood not found');
  const player = await Player.findById(brotherhood.playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (!player.romanceMode) throw new ForbiddenError('Romance mode is disabled');
  if (brotherhood.memberCharacterIds.length >= 3) throw new ValidationError('Brotherhood is full');
  if (brotherhood.memberCharacterIds.some((x) => x.toString() === characterId)) {
    throw new ValidationError('Character already in brotherhood');
  }
  brotherhood.memberCharacterIds.push(characterId as any);
  await brotherhood.save();
  return { brotherhood };
}

export async function removeBrotherhoodMember(id: string, characterId: string) {
  const brotherhood = await Brotherhood.findById(id);
  if (!brotherhood) throw new NotFoundError('Brotherhood not found');
  const player = await Player.findById(brotherhood.playerId);
  if (!player) throw new NotFoundError('Player not found');
  if (!player.romanceMode) throw new ForbiddenError('Romance mode is disabled');
  brotherhood.memberCharacterIds = brotherhood.memberCharacterIds.filter((x) => x.toString() !== characterId);
  await brotherhood.save();
  return { brotherhood };
}
