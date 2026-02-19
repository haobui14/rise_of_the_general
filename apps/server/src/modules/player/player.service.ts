import { Player } from './player.model.js';
import { PlayerInventory } from './playerInventory.model.js';
import { Faction } from '../faction/faction.model.js';
import { RankDefinition } from '../rank/rank.model.js';
import { Skill } from '../skill/skill.model.js';
import { checkPromotionEligibility } from '../rank/rank.engine.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type { IBaseStats } from '@rotg/shared-types';

export async function createPlayer(data: { username: string; factionId: string }) {
  const faction = await Faction.findById(data.factionId);
  if (!faction) throw new NotFoundError('Faction not found');

  const recruitRank = await RankDefinition.findOne({ tier: 1 });
  if (!recruitRank) throw new NotFoundError('Recruit rank not found — run the seed script');

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

  // Compute effective stats = base stats + equipped item bonuses
  const inventory = await PlayerInventory.findOne({ playerId: id }).populate('items.itemId');
  const itemBonuses: IBaseStats = { strength: 0, defense: 0, strategy: 0, speed: 0, leadership: 0 };
  if (inventory) {
    for (const entry of inventory.items) {
      if (entry.equipped && entry.itemId) {
        const item = entry.itemId as any;
        itemBonuses.strength += item.statBonus?.strength ?? 0;
        itemBonuses.defense += item.statBonus?.defense ?? 0;
        itemBonuses.strategy += item.statBonus?.strategy ?? 0;
        itemBonuses.speed += item.statBonus?.speed ?? 0;
        itemBonuses.leadership += item.statBonus?.leadership ?? 0;
      }
    }
  }

  const effectiveStats: IBaseStats = {
    strength: player.stats.strength + itemBonuses.strength,
    defense: player.stats.defense + itemBonuses.defense,
    strategy: player.stats.strategy + itemBonuses.strategy,
    speed: player.stats.speed + itemBonuses.speed,
    leadership: player.stats.leadership + itemBonuses.leadership,
  };

  return { player, rank, faction, effectiveStats };
}

export async function promotePlayer(id: string) {
  const player = await Player.findById(id);
  if (!player) throw new NotFoundError('Player not found');

  let currentRank = await RankDefinition.findById(player.currentRankId);

  // If rank ref is stale (e.g. re-seeded DB), try to recover by matching tier
  if (!currentRank) {
    currentRank = await RankDefinition.findOne({ tier: 1 });
    if (currentRank) {
      player.currentRankId = currentRank._id;
      await player.save();
    } else {
      throw new NotFoundError('Current rank not found — run the seed script');
    }
  }

  if (!currentRank.nextRankId) {
    throw new ValidationError('Already at maximum rank');
  }

  const nextRank = await RankDefinition.findById(currentRank.nextRankId);
  if (!nextRank) throw new NotFoundError('Next rank not found in database');

  const eligibility = checkPromotionEligibility(
    { merit: player.merit, stats: player.stats, level: player.level, battlesWon: (player as any).battlesWon ?? 0 },
    {
      requiredMerit: nextRank.requiredMerit,
      requiredLeadership: nextRank.requiredLeadership,
      minBattlesWon: (nextRank as any).minBattlesWon,
      minLevel: (nextRank as any).minLevel,
      title: nextRank.title,
    },
  );

  if (!eligibility.eligible) {
    throw new ValidationError(eligibility.reason || 'Not eligible for promotion');
  }

  player.currentRankId = nextRank._id;
  await player.save();

  const unlockedSkills = await Skill.find({ unlockTier: { $lte: nextRank.tier } });

  return { player, newRank: nextRank, unlockedSkills };
}
