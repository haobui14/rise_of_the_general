import { Omen } from './omen.model.js';
import { CourtState } from '../politics/court.model.js';
import { PlayerCharacter } from '../character/character.model.js';
import { rollOmenType, generateOmenEffects } from './omen.engine.js';
import { shouldRevealDestiny } from '../destiny/destiny.engine.js';
import { NotFoundError } from '../../utils/errors.js';

const TITLES: Record<string, string> = {
  comet: 'Crimson Comet Over the Capital',
  prophecy: 'Prophecy of the Court Seer',
  dream: 'Dream of the Sleeping Tiger',
  heavenly_sign: 'Heavenly Sign Above the Banners',
};

export async function listOmens(dynastyId: string) {
  const omens = await Omen.find({ dynastyId }).sort({ createdAt: -1 });
  return { omens };
}

export async function triggerOmen(dynastyId: string) {
  const court = await CourtState.findOne({ dynastyId });
  const type = rollOmenType({ stability: court?.stability ?? 50, corruption: court?.corruption ?? 50 });
  const effect = generateOmenEffects(type);

  let destinyRevealCharacterId: string | undefined;
  if (type === 'prophecy' || type === 'heavenly_sign') {
    const candidate = await PlayerCharacter.findOne({ isAlive: true, destinyRevealed: false }).sort({ createdAt: 1 });
    if (candidate && shouldRevealDestiny(type, candidate)) {
      destinyRevealCharacterId = candidate._id.toString();
    }
  }

  const omen = await Omen.create({
    dynastyId,
    type,
    title: TITLES[type],
    description: `An omen of type ${type.replace('_', ' ')} has stirred the realm.`,
    effect: { ...effect, destinyRevealCharacterId },
    resolved: false,
  });

  return { omen };
}

export async function resolveOmen(omenId: string) {
  const omen = await Omen.findById(omenId);
  if (!omen) throw new NotFoundError('Omen not found');
  if (omen.resolved) return { omen };

  const court = await CourtState.findOne({ dynastyId: omen.dynastyId });
  if (court) {
    court.stability = Math.max(0, Math.min(100, court.stability + omen.effect.stabilityDelta));
    court.morale = Math.max(0, Math.min(100, court.morale + omen.effect.moraleDelta));
    await court.save();
  }

  if (omen.effect.destinyRevealCharacterId) {
    const character = await PlayerCharacter.findById(omen.effect.destinyRevealCharacterId);
    if (character) {
      character.destinyRevealed = true;
      await character.save();
    }
  }

  omen.resolved = true;
  await omen.save();
  return { omen };
}
