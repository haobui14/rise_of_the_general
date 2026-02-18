import { Player } from '../player/player.model.js';
import { PlayerArmy } from '../army/army.model.js';
import { PlayerInjury } from '../injury/injury.model.js';
import { Territory } from '../world/territory.model.js';
import { EnemyGeneral } from '../enemy-general/enemy-general.model.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type { StrategicActionType } from '@rotg/shared-types';

const EXHAUSTION_REST_AMOUNT = 20;
const MORALE_DRILL_AMOUNT = 10;
const FORTIFY_DEFENSE_AMOUNT = 5;

export async function performAction(
  playerId: string,
  action: StrategicActionType,
  options: { territoryId?: string } = {},
) {
  const player = await Player.findById(playerId);
  if (!player) throw new NotFoundError('Player not found');

  switch (action) {
    case 'rest': {
      player.warExhaustion = Math.max(0, player.warExhaustion - EXHAUSTION_REST_AMOUNT);
      await player.save();

      // Tick all active injuries by 1 (simulate a rest period)
      await PlayerInjury.updateMany(
        { playerId, battlesRemaining: { $gt: 0 } },
        { $inc: { battlesRemaining: -1 } },
      );

      return { action, player, detail: `Rested — exhaustion reduced by ${EXHAUSTION_REST_AMOUNT}` };
    }

    case 'drill': {
      const army = await PlayerArmy.findOne({ playerId });
      if (!army) throw new ValidationError('No army to drill — create an army first');

      army.morale = Math.min(100, army.morale + MORALE_DRILL_AMOUNT);
      await army.save();
      await player.save();

      return { action, player, detail: `Drilled troops — morale +${MORALE_DRILL_AMOUNT}` };
    }

    case 'fortify': {
      if (!options.territoryId) throw new ValidationError('territoryId is required for fortify');

      const territory = await Territory.findById(options.territoryId);
      if (!territory) throw new NotFoundError('Territory not found');

      // Player must own the territory (faction match)
      if (territory.ownerFactionId.toString() !== player.factionId.toString()) {
        throw new ValidationError('You do not own this territory');
      }

      territory.defenseRating += FORTIFY_DEFENSE_AMOUNT;
      await territory.save();
      await player.save();

      return {
        action,
        player,
        detail: `Fortified ${territory.name} — defense rating +${FORTIFY_DEFENSE_AMOUNT}`,
      };
    }

    case 'spy': {
      if (!options.territoryId) throw new ValidationError('territoryId is required for spy');

      const territory = await Territory.findById(options.territoryId);
      if (!territory) throw new NotFoundError('Territory not found');

      // Reveal enemy generals in the target territory and adjacent ones
      const adjacentIds = [territory._id, ...territory.connectedTerritoryIds];
      const revealedGenerals = await EnemyGeneral.find({
        territoryId: { $in: adjacentIds },
        alive: true,
      });

      await player.save();

      return {
        action,
        player,
        detail: `Spy mission to ${territory.name} — revealed ${revealedGenerals.length} enemy general(s)`,
        revealedGenerals,
      };
    }

    default:
      throw new ValidationError(`Unknown strategic action: ${action}`);
  }
}
