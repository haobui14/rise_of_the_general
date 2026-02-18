import { Player } from '../player/player.model.js';
import { RankDefinition } from '../rank/rank.model.js';
import { PlayerLegacy } from './legacy.model.js';
import { PlayerArmy } from '../army/army.model.js';
import { PlayerInjury } from '../injury/injury.model.js';
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
  await player.save();

  // Reset army and injuries (generals and items are preserved)
  await PlayerArmy.deleteOne({ playerId });
  await PlayerInjury.deleteMany({ playerId });

  return { player, legacy };
}
