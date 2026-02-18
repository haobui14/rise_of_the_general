import { Territory } from './territory.model.js';
import { EnemyGeneral } from '../enemy-general/enemy-general.model.js';
import { Player } from '../player/player.model.js';
import { PlayerCampaign } from '../campaign/player-campaign.model.js';
import { Campaign } from '../campaign/campaign.model.js';
import { calculateEnemyPower, type EnemyGeneralInput } from '../battle/enemy.engine.js';
import {
  calculateCaptureRewardBonus,
  resolveTerritoryCapture,
  isCapturable,
} from '../battle/territory.engine.js';
import { calculateExhaustionDelta, applyExhaustionPenalties } from '../battle/exhaustion.engine.js';
import { resolveBattleOutcome } from '../battle/battle.engine.js';
import { calculateFinalPower } from '../battle/battle.engine.js';
import { PlayerArmy } from '../army/army.model.js';
import { PlayerInjury } from '../injury/injury.model.js';
import { PlayerLegacy } from '../dynasty/legacy.model.js';
import { PlayerGeneralSlots } from '../general/playerGeneralSlots.model.js';
import { PlayerInventory } from '../player/playerInventory.model.js';
import { calculateSynergyBonus } from '../general/synergy.engine.js';
import { sumInjuryPenalties } from '../injury/injury.engine.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { applyLoyaltyEvent } from '../loyalty/loyalty.service.js';
import { resolveDeathCondition } from '../succession/succession.engine.js';
import { triggerDeath } from '../succession/succession.service.js';
import { checkAndApplyDivergence } from '../timeline/timeline.service.js';
import type { IBaseStats, Formation } from '@rotg/shared-types';

export async function getWorldMap() {
  const territories = await Territory.find().sort({ region: 1, name: 1 });
  // Bundle living enemy general counts per territory so the UI can show which bases have defenders
  const allGenerals = await EnemyGeneral.find(
    { alive: true },
    { territoryId: 1, name: 1, level: 1, powerMultiplier: 1 },
  );
  const generalsByTerritory: Record<
    string,
    { name: string; level: number; powerMultiplier: number }[]
  > = {};
  for (const g of allGenerals) {
    const key = g.territoryId.toString();
    if (!generalsByTerritory[key]) generalsByTerritory[key] = [];
    generalsByTerritory[key].push({
      name: g.name,
      level: g.level,
      powerMultiplier: g.powerMultiplier,
    });
  }
  return { territories, generalsByTerritory };
}

export async function getTerritoryById(id: string) {
  const territory = await Territory.findById(id);
  if (!territory) throw new NotFoundError('Territory not found');

  const enemyGenerals = await EnemyGeneral.find({ territoryId: id, alive: true });
  return { territory, enemyGenerals };
}

export async function attackTerritory(data: { playerId: string; territoryId: string }) {
  const player = await Player.findById(data.playerId);
  if (!player) throw new NotFoundError('Player not found');

  const territory = await Territory.findById(data.territoryId);
  if (!territory) throw new NotFoundError('Territory not found');

  if (!isCapturable(territory.toObject() as any, player.factionId.toString())) {
    throw new ValidationError('You already own this territory');
  }

  // Gather enemy generals in this territory
  const rawGenerals = await EnemyGeneral.find({ territoryId: data.territoryId, alive: true });
  const enemyGeneralInputs: EnemyGeneralInput[] = rawGenerals.map((g) => ({
    powerMultiplier: g.powerMultiplier,
    level: g.level,
    alive: g.alive,
  }));

  // Build player power (same pipeline as battle.service)
  const inventory = await PlayerInventory.findOne({ playerId: data.playerId }).populate(
    'items.itemId',
  );
  const equippedBonuses: Partial<IBaseStats> = {
    strength: 0,
    defense: 0,
    strategy: 0,
    speed: 0,
    leadership: 0,
  };
  if (inventory) {
    for (const entry of inventory.items) {
      if (entry.equipped && entry.itemId) {
        const item = entry.itemId as any;
        equippedBonuses.strength! += item.statBonus?.strength ?? 0;
        equippedBonuses.defense! += item.statBonus?.defense ?? 0;
        equippedBonuses.strategy! += item.statBonus?.strategy ?? 0;
        equippedBonuses.speed! += item.statBonus?.speed ?? 0;
        equippedBonuses.leadership! += item.statBonus?.leadership ?? 0;
      }
    }
  }

  const slots = await PlayerGeneralSlots.findOne({ playerId: data.playerId }).populate(
    'activeGeneralIds',
  );
  const activeGenerals = (slots?.activeGeneralIds ?? []) as any[];
  const generalMultipliers = activeGenerals.map((g: any) => g.battleBonus?.powerMultiplier ?? 1.0);
  const activeGeneralNames = activeGenerals.map((g: any) => g.name);
  const { totalMultiplier: synergyMultiplier } = calculateSynergyBonus(activeGeneralNames);

  const army = await PlayerArmy.findOne({ playerId: data.playerId });
  const activeInjuries = await PlayerInjury.find({
    playerId: data.playerId,
    battlesRemaining: { $gt: 0 },
  });
  const injuryPenalties = sumInjuryPenalties(activeInjuries);
  const legacy = await PlayerLegacy.findOne({ playerId: data.playerId });
  const legacyBonusMultiplier = legacy?.permanentBonuses?.powerMultiplier ?? 1.0;

  const powerBreakdown = calculateFinalPower({
    stats: player.stats,
    level: player.level,
    equippedItemBonuses: equippedBonuses,
    injuryPenalties,
    army: army
      ? { troopCount: army.troopCount, morale: army.morale, formation: army.formation as Formation }
      : null,
    generalMultipliers,
    synergyMultiplier,
    legacyBonusMultiplier,
  });

  // Apply exhaustion penalties to player power
  const exhaustionPenalties = applyExhaustionPenalties(player.warExhaustion);
  const effectivePlayerPower = powerBreakdown.finalPower * exhaustionPenalties.xpMultiplier;

  // Base enemy power: keep it comparable to a mid-level player's finalPower (~60-200).
  // defenseRating contributes 1.5× and strategicValue 1× so a defense-15 territory
  // has baseEnemyPower ≈ 32, still multiplied by the defenseMultiplier in enemy.engine.
  const baseEnemyPower = territory.defenseRating * 1.5 + territory.strategicValue;
  const enemyPower = calculateEnemyPower(
    baseEnemyPower,
    { defenseRating: territory.defenseRating, strategicValue: territory.strategicValue },
    enemyGeneralInputs,
  );

  const outcome = resolveBattleOutcome(effectivePlayerPower, enemyPower);

  // Exhaustion update
  const casualties = Math.round(
    (Math.abs(effectivePlayerPower - enemyPower) / Math.max(effectivePlayerPower, enemyPower)) *
      100,
  );
  const exhaustionDelta = calculateExhaustionDelta(outcome, casualties, player.warExhaustion);
  player.warExhaustion = Math.max(0, Math.min(100, player.warExhaustion + exhaustionDelta));

  // Merit reward on capture
  let meritBonus = 0;
  let leadershipGained = 0;
  let capturedTerritory = null;
  let defeatedGeneral = null;

  if (outcome === 'won') {
    meritBonus = calculateCaptureRewardBonus({ strategicValue: territory.strategicValue });
    player.merit += meritBonus;
    // Leading a successful capture builds command ability
    leadershipGained += 1;
    player.stats.leadership += 1;

    const captureUpdate = resolveTerritoryCapture(
      {
        _id: territory._id.toString(),
        strategicValue: territory.strategicValue,
        defenseRating: territory.defenseRating,
        ownerFactionId: territory.ownerFactionId.toString(),
      },
      player.factionId.toString(),
    );

    territory.ownerFactionId = player.factionId;
    territory.defenseRating = captureUpdate.defenseRating;
    await territory.save();
    capturedTerritory = territory;

    // Timeline divergence check after successful capture (fire-and-forget)
    checkAndApplyDivergence({
      dynastyId: player.dynastyId.toString(),
      playerFactionId: player.factionId.toString(),
      killedGeneralWasLegendary: false,
    }).catch(() => {});

    // Defeat a random living general in the territory
    if (rawGenerals.length > 0) {
      const target = rawGenerals.find((g) => !g.canRetreat) ?? null;
      if (target) {
        target.alive = false;
        await target.save();
        defeatedGeneral = target;
        // Defeating a named general earns extra leadership
        leadershipGained += 1;
        player.stats.leadership += 1;
      }
    }

    // ── Campaign progress tracking ──────────────────────────────────────────
    const activeCampaign = await PlayerCampaign.findOne({
      playerId: data.playerId,
      status: 'active',
    });
    if (activeCampaign) {
      const territoryIdStr = territory._id.toString();
      if (!activeCampaign.territoriesCaptured.map(String).includes(territoryIdStr)) {
        activeCampaign.territoriesCaptured.push(territory._id as any);
        activeCampaign.markModified('territoriesCaptured');
      }
      if (defeatedGeneral) {
        activeCampaign.generalsDefeated += 1;
        if (!Array.isArray(activeCampaign.generalsDefeatedLog)) {
          activeCampaign.generalsDefeatedLog = [];
        }
        activeCampaign.generalsDefeatedLog.push(defeatedGeneral.name.replace(' (enemy)', ''));
        activeCampaign.markModified('generalsDefeatedLog');
      }

      // Check victory conditions
      const campaignDef = await Campaign.findById(activeCampaign.campaignId);
      if (campaignDef) {
        const territoriesMet =
          activeCampaign.territoriesCaptured.length >=
          campaignDef.victoryConditions.territoriesRequired;
        const generalsMet =
          activeCampaign.generalsDefeated >= campaignDef.victoryConditions.generalsDefeated;
        if (territoriesMet && generalsMet) {
          activeCampaign.status = 'won';
          activeCampaign.completedAt = new Date();
        }
      }
      await activeCampaign.save();
    }
    // ────────────────────────────────────────────────────────────────────────
  }

  // Loyalty event for officer characters (fire-and-forget)
  await applyLoyaltyEvent(
    data.playerId,
    outcome === 'won' ? 'battle_victory' : 'battle_defeat',
  ).catch(() => {});

  // Death check: high exhaustion + loss → trigger pending succession
  if (
    outcome === 'lost' &&
    resolveDeathCondition(player.warExhaustion, true) &&
    !player.successionPending
  ) {
    await triggerDeath(data.playerId).catch(() => {});
  }

  await player.save();

  return {
    outcome,
    territory: outcome === 'won' ? capturedTerritory : null,
    meritBonus,
    leadershipGained,
    exhaustionChange: exhaustionDelta,
    enemyGeneralDefeated: defeatedGeneral,
  };
}
