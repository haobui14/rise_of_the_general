import { Battle } from './battle.model.js';
import { BattleTemplate } from './battleTemplate.model.js';
import { Player } from '../player/player.model.js';
import {
  calculateFinalPower,
  resolveBattleOutcome,
  calculateCasualties,
  calculateRewards,
  calculateStatGrowth,
  rollItemDrop,
  type BattleContext,
} from './battle.engine.js';
import { calculateExhaustionDelta, applyExhaustionPenalties } from './exhaustion.engine.js';
import { Item } from '../item/item.model.js';
import { PlayerInventory } from '../player/playerInventory.model.js';
import { PlayerGeneralSlots } from '../general/playerGeneralSlots.model.js';
import { PlayerArmy } from '../army/army.model.js';
import { PlayerInjury } from '../injury/injury.model.js';
import { PlayerLegacy } from '../dynasty/legacy.model.js';
import { PlayerCharacter } from '../character/character.model.js';
import { CourtState } from '../politics/court.model.js';
import { calculateSynergyBonus } from '../general/synergy.engine.js';
import { rollInjury, sumInjuryPenalties } from '../injury/injury.engine.js';
import { gainRelationshipFromBattle } from '../general/general.service.js';
import { applyLoyaltyEvent } from '../loyalty/loyalty.service.js';
import { NotFoundError } from '../../utils/errors.js';
import type { IBaseStats, Formation } from '@rotg/shared-types';

export async function listTemplates() {
  const templates = await BattleTemplate.find().sort({ difficulty: 1 });
  return { templates };
}

export async function startAndResolveBattle(data: { playerId: string; templateId: string }) {
  const player = await Player.findById(data.playerId);
  if (!player) throw new NotFoundError('Player not found');

  const template = await BattleTemplate.findById(data.templateId);
  if (!template) throw new NotFoundError('Battle template not found');

  // Cancel any stuck ongoing battles
  await Battle.updateMany(
    { playerId: data.playerId, status: 'ongoing' },
    { status: 'lost', endedAt: new Date() },
  );

  // --- Gather all combat data ---

  // Equipped item bonuses
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

  // Active deployed generals (only deployed ones contribute)
  const slots = await PlayerGeneralSlots.findOne({ playerId: data.playerId }).populate(
    'activeGeneralIds',
  );
  const activeGenerals = (slots?.activeGeneralIds ?? []) as any[];
  const generalMultipliers = activeGenerals.map((g: any) => g.battleBonus?.powerMultiplier ?? 1.0);
  const activeGeneralNames = activeGenerals.map((g: any) => g.name);

  // Synergy
  const { totalMultiplier: synergyMultiplier, activeSynergies } =
    calculateSynergyBonus(activeGeneralNames);

  // Army
  const army = await PlayerArmy.findOne({ playerId: data.playerId });

  // Injury penalties
  const activeInjuries = await PlayerInjury.find({
    playerId: data.playerId,
    battlesRemaining: { $gt: 0 },
  });
  const injuryPenalties = sumInjuryPenalties(activeInjuries);

  // Legacy bonus
  const legacy = await PlayerLegacy.findOne({ playerId: data.playerId });
  const legacyBonusMultiplier = legacy?.permanentBonuses?.powerMultiplier ?? 1.0;

  // Active commander bonus — the player's active character contributes 20% of their stats
  if (player.activeCharacterId) {
    const commander = await PlayerCharacter.findById(player.activeCharacterId);
    if (commander && commander.isAlive) {
      equippedBonuses.strength! += Math.floor(commander.stats.strength * 0.2);
      equippedBonuses.defense! += Math.floor(commander.stats.defense * 0.2);
      equippedBonuses.strategy! += Math.floor(commander.stats.strategy * 0.2);
      equippedBonuses.speed! += Math.floor(commander.stats.speed * 0.2);
      equippedBonuses.leadership! += Math.floor(commander.stats.leadership * 0.2);
    }
  }

  // --- Calculate power ---
  const ctx: BattleContext = {
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
  };

  const powerBreakdown = calculateFinalPower(ctx);
  const outcome = resolveBattleOutcome(powerBreakdown.finalPower, template.enemyPower);
  const casualties = calculateCasualties(powerBreakdown.finalPower, template.enemyPower);

  // Exhaustion penalties scale xp gains and injury chance
  const exhaustionPenalties = applyExhaustionPenalties(player.warExhaustion);
  const exhaustionDelta = calculateExhaustionDelta(outcome, casualties, player.warExhaustion);

  const baseRewards = calculateRewards(template, outcome);

  // Court effects — load dynasty's political court and apply active modifiers
  const court = await CourtState.findOne({ dynastyId: player.dynastyId });
  // High morale (>70) → +5% merit; low stability (<40) → +5 exhaustion on loss; high corruption (>70) → −25% gold
  const courtMoraleBonus = court && court.morale > 70 ? 1.05 : 1.0;
  const courtExhaustionPenalty = court && court.stability < 40 && outcome === 'lost' ? 5 : 0;
  const goldMultiplier = court && court.corruption > 70 ? 0.75 : 1.0;

  const rewards = {
    meritGained: Math.round(baseRewards.meritGained * courtMoraleBonus),
    expGained: Math.floor(baseRewards.expGained * exhaustionPenalties.xpMultiplier),
  };
  const statGrowth = calculateStatGrowth(outcome);

  // Create resolved battle record
  const battle = await Battle.create({
    playerId: player._id,
    templateId: template._id,
    enemyPower: template.enemyPower,
    status: outcome,
    result: {
      meritGained: rewards.meritGained,
      expGained: rewards.expGained,
      casualties,
    },
    startedAt: new Date(),
    endedAt: new Date(),
  });

  // Update player stats
  player.merit += rewards.meritGained;
  player.experience += rewards.expGained;
  player.gold += outcome === 'won' ? Math.round(template.meritReward * goldMultiplier) : 0;
  player.warExhaustion = Math.max(
    0,
    Math.min(100, player.warExhaustion + exhaustionDelta + courtExhaustionPenalty),
  );

  if (statGrowth.strength) player.stats.strength += statGrowth.strength;
  if (statGrowth.defense) player.stats.defense += statGrowth.defense;
  if (statGrowth.strategy) player.stats.strategy += statGrowth.strategy;
  if (statGrowth.speed) player.stats.speed += statGrowth.speed;
  if (statGrowth.leadership) player.stats.leadership += statGrowth.leadership;

  // Level up check
  const levelThreshold = player.level * 100;
  if (player.experience >= levelThreshold) {
    player.experience -= levelThreshold;
    player.level += 1;
  }

  await player.save();

  // --- Post-battle effects ---

  // Morale change
  let moraleChange: number | null = null;
  if (army) {
    moraleChange = outcome === 'won' ? 5 : -10;
    army.morale = Math.max(0, Math.min(100, army.morale + moraleChange));
    await army.save();
  }

  // Relationship gain on win
  if (outcome === 'won') {
    await gainRelationshipFromBattle(
      data.playerId,
      player.factionId.toString(),
      template.difficulty,
    );
  }

  // Loyalty event for officer characters
  await applyLoyaltyEvent(
    data.playerId,
    outcome === 'won' ? 'battle_victory' : 'battle_defeat',
  ).catch(() => {
    /* no characters yet is fine */
  });

  // Expire injuries (decrement battlesRemaining)
  if (activeInjuries.length > 0) {
    await PlayerInjury.updateMany(
      { playerId: data.playerId, battlesRemaining: { $gt: 0 } },
      { $inc: { battlesRemaining: -1 } },
    );
  }

  // Roll for new injury on loss
  // Exhaustion increases injury chance at high levels
  let newInjury = null;
  if (outcome === 'lost') {
    const baseChance = 0.05 + (template.difficulty - 1) * 0.05;
    const boostedChance = Math.min(1, baseChance + exhaustionPenalties.injuryChanceBonus);
    if (Math.random() < boostedChance) {
      const injuryRoll = rollInjury(template.difficulty);
      if (injuryRoll) {
        newInjury = await PlayerInjury.create({
          playerId: data.playerId,
          type: injuryRoll.type,
          statPenalty: injuryRoll.statPenalty,
          durationBattles: injuryRoll.durationBattles,
          battlesRemaining: injuryRoll.durationBattles,
        });
      }
    }
  }

  // Item drop on win
  let droppedItem = null;
  if (outcome === 'won') {
    const drop = rollItemDrop(template.difficulty);
    if (drop.dropped && drop.rarity) {
      const items = await Item.find({ rarity: drop.rarity });
      if (items.length > 0) {
        const picked = items[Math.floor(Math.random() * items.length)];
        droppedItem = picked;
        await PlayerInventory.findOneAndUpdate(
          { playerId: player._id },
          { $push: { items: { itemId: picked._id, equipped: false } } },
        );
      }
    }
  }

  return {
    battle,
    player,
    droppedItem,
    powerBreakdown,
    newInjury,
    moraleChange,
    activeSynergies,
    exhaustionChange: exhaustionDelta,
  };
}
