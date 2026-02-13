import { General } from './general.model.js';
import { PlayerGeneral } from './playerGeneral.model.js';
import { Player } from '../player/player.model.js';
import { RankDefinition } from '../rank/rank.model.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

export async function listGenerals(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const currentRank = await RankDefinition.findById(player.currentRankId);
  const playerTier = currentRank?.tier ?? 1;

  const generals = await General.find().sort({ requiredRankTier: 1 });
  const relations = await PlayerGeneral.find({ playerId });

  const relationMap = new Map(relations.map((r) => [r.generalId.toString(), r]));

  const result = generals.map((g) => {
    const rel = relationMap.get(g._id.toString());
    const relationship = rel?.relationship ?? 0;
    const recruited = rel?.recruited ?? false;
    const canRecruit =
      !recruited &&
      playerTier >= g.requiredRankTier &&
      relationship >= g.requiredRelationship;

    return {
      _id: g._id,
      name: g.name,
      title: g.title,
      factionId: g.factionId,
      requiredRankTier: g.requiredRankTier,
      requiredRelationship: g.requiredRelationship,
      stats: g.stats,
      rarity: g.rarity,
      battleBonus: g.battleBonus,
      relationship,
      recruited,
      canRecruit,
    };
  });

  return { generals: result };
}

export async function recruitGeneral(playerId: string, generalId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const general = await General.findById(generalId);
  if (!general) throw new NotFoundError('General not found');

  const currentRank = await RankDefinition.findById(player.currentRankId);
  const playerTier = currentRank?.tier ?? 1;

  if (playerTier < general.requiredRankTier) {
    throw new ValidationError(
      `Requires rank tier ${general.requiredRankTier}, you are tier ${playerTier}`,
    );
  }

  let rel = await PlayerGeneral.findOne({ playerId, generalId });
  const relationship = rel?.relationship ?? 0;

  if (rel?.recruited) {
    throw new ValidationError(`${general.name} is already under your command`);
  }

  if (relationship < general.requiredRelationship) {
    throw new ValidationError(
      `Need ${general.requiredRelationship} relationship, have ${relationship}`,
    );
  }

  if (rel) {
    rel.recruited = true;
    rel.recruitedAt = new Date();
    await rel.save();
  } else {
    rel = await PlayerGeneral.create({
      playerId,
      generalId,
      relationship,
      recruited: true,
      recruitedAt: new Date(),
    });
  }

  return { general, playerGeneral: rel };
}

/**
 * After a battle win, increase relationship with random generals from the player's faction.
 * Also small chance to gain relationship with generals from other factions.
 */
export async function gainRelationshipFromBattle(playerId: string, factionId: string, difficulty: number) {
  const factionGenerals = await General.find({ factionId });
  const otherGenerals = await General.find({ factionId: { $ne: factionId } });

  const relGain = 2 + difficulty * 2; // 4-12 per battle depending on difficulty

  // Always gain relationship with own faction generals
  for (const g of factionGenerals) {
    await PlayerGeneral.findOneAndUpdate(
      { playerId, generalId: g._id },
      { $inc: { relationship: relGain }, $setOnInsert: { recruited: false, recruitedAt: null } },
      { upsert: true },
    );
  }

  // 25% chance to gain small relationship with a random other-faction general
  if (Math.random() < 0.25 && otherGenerals.length > 0) {
    const randomOther = otherGenerals[Math.floor(Math.random() * otherGenerals.length)];
    await PlayerGeneral.findOneAndUpdate(
      { playerId, generalId: randomOther._id },
      { $inc: { relationship: Math.ceil(relGain / 3) }, $setOnInsert: { recruited: false, recruitedAt: null } },
      { upsert: true },
    );
  }
}
