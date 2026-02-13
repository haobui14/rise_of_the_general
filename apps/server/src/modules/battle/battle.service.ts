import { Battle } from './battle.model.js';
import { BattleTemplate } from './battleTemplate.model.js';
import { Player } from '../player/player.model.js';
import {
  calculatePlayerPower,
  resolveBattleOutcome,
  calculateCasualties,
  calculateRewards,
  calculateStatGrowth,
  rollItemDrop,
} from './battle.engine.js';
import { Item } from '../item/item.model.js';
import { PlayerInventory } from '../player/playerInventory.model.js';
import { gainRelationshipFromBattle } from '../general/general.service.js';
import { NotFoundError } from '../../utils/errors.js';

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

  const playerPower = calculatePlayerPower(player.stats, player.level);
  const outcome = resolveBattleOutcome(playerPower, template.enemyPower);
  const casualties = calculateCasualties(playerPower, template.enemyPower);
  const rewards = calculateRewards(template, outcome);
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
  player.gold += outcome === 'won' ? template.meritReward : 0;

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

  // Gain relationship with generals from battles (win gives more)
  if (outcome === 'won') {
    await gainRelationshipFromBattle(data.playerId, player.factionId.toString(), template.difficulty);
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

  return { battle, player, droppedItem };
}
