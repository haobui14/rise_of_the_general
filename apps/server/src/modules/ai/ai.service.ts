import { AiFaction } from './ai-faction.model.js';
import { Territory } from '../world/territory.model.js';
import { Battle } from '../battle/battle.model.js';
import {
  decideAiAction,
  resolveAiExpansion,
  resolveAiReinforcement,
  type TerritorySnapshot,
  type TerritoryWithValue,
} from './ai.engine.js';
import { NotFoundError } from '../../utils/errors.js';
import type { AiAction, Region } from '@rotg/shared-types';

export async function advanceAiTurn(factionId: string) {
  const aiFaction = await AiFaction.findOne({ factionId });
  if (!aiFaction) throw new NotFoundError('AI faction config not found');

  const allTerritories = await Territory.find();

  const snapshots: TerritoryWithValue[] = allTerritories.map((t) => ({
    _id: t._id.toString(),
    ownerFactionId: t.ownerFactionId.toString(),
    region: t.region as Region,
    defenseRating: t.defenseRating,
    strategicValue: t.strategicValue,
  }));

  const playerTerritoryCount = snapshots.filter((t) => t.ownerFactionId === factionId).length;

  // Count recent battles to determine expansion trigger
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const battlesSinceLastTurn = await Battle.countDocuments({ startedAt: { $gte: oneDayAgo } });

  const action: AiAction = decideAiAction(
    {
      factionId,
      aggression: aiFaction.aggression,
      expansionRate: aiFaction.expansionRate,
      preferredRegions: aiFaction.preferredRegions as Region[],
    },
    snapshots,
    {
      playerTerritoryCount,
      totalTerritories: snapshots.length,
      battlesSinceLastTurn,
    },
  );

  let affectedTerritoryId: string | null = null;
  let detail = '';

  if (action === 'expand' || action === 'counterattack') {
    const neutral = snapshots.filter((t) => t.ownerFactionId !== factionId);
    affectedTerritoryId = resolveAiExpansion(
      {
        factionId,
        aggression: aiFaction.aggression,
        expansionRate: aiFaction.expansionRate,
        preferredRegions: aiFaction.preferredRegions as Region[],
      },
      neutral,
    );

    if (affectedTerritoryId) {
      await Territory.findByIdAndUpdate(affectedTerritoryId, { ownerFactionId: factionId });
      detail = `AI faction occupied territory ${affectedTerritoryId}`;
    } else {
      detail = 'AI faction found no territory to expand into';
    }
  } else {
    // defend — reinforce weakest territory
    const reinforce = resolveAiReinforcement(
      {
        factionId,
        aggression: aiFaction.aggression,
        expansionRate: aiFaction.expansionRate,
        preferredRegions: aiFaction.preferredRegions as Region[],
      },
      snapshots,
    );
    if (reinforce) {
      affectedTerritoryId = reinforce.territoryId;
      await Territory.findByIdAndUpdate(reinforce.territoryId, {
        $inc: { defenseRating: reinforce.powerBoost },
      });
      detail = `AI faction reinforced territory ${reinforce.territoryId} (+${reinforce.powerBoost} defense)`;
    } else {
      detail = 'AI faction has no territories to reinforce';
    }
  }

  return { action, factionId, affectedTerritoryId, detail };
}

export async function listAiFactions() {
  const aiFactions = await AiFaction.find();
  return { aiFactions };
}
