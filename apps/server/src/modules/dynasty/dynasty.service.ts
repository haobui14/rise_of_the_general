import { Player } from '../player/player.model.js';
import { RankDefinition } from '../rank/rank.model.js';
import { PlayerLegacy } from './legacy.model.js';
import { PlayerArmy } from '../army/army.model.js';
import { PlayerInjury } from '../injury/injury.model.js';
import { Dynasty } from './dynasty.model.js';
import { AiFaction } from '../ai/ai-faction.model.js';
import { CourtState } from '../politics/court.model.js';
import { DynastyState } from '../dynasty-state/dynasty-state.model.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

export async function getLegacy(playerId: string) {
  const legacy = await PlayerLegacy.findOne({ playerId });
  return { legacy };
}

export async function completeDynasty(playerId: string) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  const rank = await RankDefinition.findById(player.currentRankId);
  if ((rank?.tier ?? 1) < 7) {
    throw new ValidationError('Must reach tier 7 to complete a dynasty');
  }

  // Update or create legacy
  let legacy = await PlayerLegacy.findOne({ playerId });
  if (!legacy) {
    legacy = new PlayerLegacy({
      playerId,
      dynastiesCompleted: 0,
      permanentBonuses: { powerMultiplier: 1.0 },
      completedAt: [],
    });
  }

  legacy.dynastiesCompleted += 1;
  legacy.permanentBonuses.powerMultiplier += 0.05; // +5% per dynasty
  legacy.completedAt.push(new Date());
  await legacy.save();

  // Reset player — rank back to tier 1, stats reset, level reset
  const tier1Rank = await RankDefinition.findOne({ tier: 1 });
  if (tier1Rank) {
    player.currentRankId = tier1Rank._id;
  }
  player.level = 1;
  player.experience = 0;
  player.merit = 0;
  player.stats = { strength: 5, defense: 5, strategy: 5, speed: 5, leadership: 1 };
  // Scale next dynasty difficulty: +5 base defense rating to AI threats
  const dynastyDifficulty = legacy.dynastiesCompleted;
  player.politicalTurns = 3; // reset political turns
  player.successionPending = false;
  await player.save();

  // Reset army and injuries (generals and items are preserved)
  await PlayerArmy.deleteOne({ playerId });
  await PlayerInjury.deleteMany({ playerId });

  // Partial map reset: reset dynasty timeline to historical
  await Dynasty.findByIdAndUpdate(player.dynastyId, { timeline: 'historical' });

  // Ensure a CourtState doc exists for the dynasty (reset corruption)
  await CourtState.findOneAndUpdate(
    { dynastyId: player.dynastyId },
    { $set: { stability: 75, legitimacy: 75, morale: 75, corruption: 10, lastActionType: null } },
    { upsert: true },
  );

  // Create a new, scaled AI threat faction (harder each dynasty)
  const scaledAggression = Math.min(100, 50 + dynastyDifficulty * 5);
  await AiFaction.create({
    factionId: player.factionId, // scaled threat targets same region
    aggression: scaledAggression,
    expansionRate: Math.max(1, 4 - dynastyDifficulty),
    preferredRegions: ['north', 'central', 'south'],
  }).catch(() => {}); // fine if duplicate

  return { player, legacy };
}
