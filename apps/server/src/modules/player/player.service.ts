import { Player } from './player.model.js';
import { PlayerInventory } from './playerInventory.model.js';
import { Faction } from '../faction/faction.model.js';
import { RankDefinition } from '../rank/rank.model.js';
import { Skill } from '../skill/skill.model.js';
import { checkPromotionEligibility } from '../rank/rank.engine.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

export async function createPlayer(data: { username: string; factionId: string }) {
  const faction = await Faction.findById(data.factionId);
  if (!faction) throw new NotFoundError('Faction not found');

  const recruitRank = await RankDefinition.findOne({ tier: 1 });
  if (!recruitRank) throw new Error('Recruit rank not found. Run seed script first.');

  const baseStats = {
    strength: 5 + (faction.baseBonus.strength || 0),
    defense: 5 + (faction.baseBonus.defense || 0),
    strategy: 5 + (faction.baseBonus.strategy || 0),
    speed: 5 + (faction.baseBonus.speed || 0),
    leadership: 1 + (faction.baseBonus.leadership || 0),
  };

  const player = await Player.create({
    username: data.username,
    dynastyId: faction.dynastyId,
    factionId: faction._id,
    currentRankId: recruitRank._id,
    stats: baseStats,
  });

  await PlayerInventory.create({ playerId: player._id, items: [] });

  return { player };
}

export async function getPlayer(id: string) {
  const player = await Player.findById(id);
  if (!player) throw new NotFoundError('Player not found');

  const rank = await RankDefinition.findById(player.currentRankId);
  const faction = await Faction.findById(player.factionId);

  return { player, rank, faction };
}

export async function promotePlayer(id: string) {
  const player = await Player.findById(id);
  if (!player) throw new NotFoundError('Player not found');

  const currentRank = await RankDefinition.findById(player.currentRankId);
  if (!currentRank) throw new Error('Current rank not found');

  if (!currentRank.nextRankId) {
    throw new ValidationError('Already at maximum rank');
  }

  const nextRank = await RankDefinition.findById(currentRank.nextRankId);
  if (!nextRank) throw new Error('Next rank not found');

  const eligibility = checkPromotionEligibility(
    { merit: player.merit, stats: player.stats },
    { requiredMerit: nextRank.requiredMerit, requiredLeadership: nextRank.requiredLeadership },
  );

  if (!eligibility.eligible) {
    throw new ValidationError(eligibility.reason || 'Not eligible for promotion');
  }

  player.currentRankId = nextRank._id;
  await player.save();

  const unlockedSkills = await Skill.find({ unlockTier: { $lte: nextRank.tier } });

  return { player, newRank: nextRank, unlockedSkills };
}
