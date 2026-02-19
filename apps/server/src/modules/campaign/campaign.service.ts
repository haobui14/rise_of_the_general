import { Campaign } from './campaign.model.js';
import { PlayerCampaign } from './player-campaign.model.js';
import { Player } from '../player/player.model.js';
import { Territory } from '../world/territory.model.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

export async function createCampaign(data: {
  playerId: string;
  name: string;
  territoriesRequired: number;
  generalsDefeated: number;
}) {
  const player = await Player.findById(data.playerId);
  if (!player) throw new NotFoundError('Player not found');

  const existing = await Campaign.findOne({ name: data.name.trim() });
  if (existing) throw new ValidationError('A campaign with that name already exists');

  // Use any available territory as the placeholder starting point
  const anyTerritory = await Territory.findOne();
  if (!anyTerritory) throw new ValidationError('No territories found — run the seed script first');

  const campaign = await Campaign.create({
    name: data.name.trim(),
    dynastyId: player.dynastyId,
    startingTerritoryId: anyTerritory._id,
    victoryConditions: {
      territoriesRequired: data.territoriesRequired,
      generalsDefeated: data.generalsDefeated,
    },
  });

  return { campaign };
}

export async function listCampaigns() {
  const campaigns = await Campaign.find().sort({ name: 1 });
  return { campaigns };
}

export async function startCampaign(data: { playerId: string; campaignId: string }) {
  const player = await Player.findById(data.playerId);
  if (!player) throw new NotFoundError('Player not found');

  const campaign = await Campaign.findById(data.campaignId);
  if (!campaign) throw new NotFoundError('Campaign not found');

  // Only one active campaign at a time
  const existing = await PlayerCampaign.findOne({ playerId: data.playerId, status: 'active' });
  if (existing) throw new ValidationError('You already have an active campaign');

  const playerCampaign = await PlayerCampaign.create({
    playerId: data.playerId,
    campaignId: data.campaignId,
    territoriesCaptured: [],
    generalsDefeated: 0,
    generalsDefeatedLog: [],
    status: 'active',
    startedAt: new Date(),
    completedAt: null,
  });

  return { playerCampaign, campaign };
}

export async function getActiveCampaign(playerId: string) {
  const playerCampaign = await PlayerCampaign.findOne({ playerId, status: 'active' });
  if (!playerCampaign) throw new NotFoundError('No active campaign');

  const campaign = await Campaign.findById(playerCampaign.campaignId);
  if (!campaign) throw new NotFoundError('Campaign definition not found');

  // Resolve territory names for the captured list
  const capturedTerritories = await Territory.find(
    { _id: { $in: playerCampaign.territoriesCaptured } },
    { name: 1 },
  );
  const capturedNames = capturedTerritories.map((t) => t.name);

  const progress = {
    territoriesRemaining: Math.max(
      0,
      campaign.victoryConditions.territoriesRequired - playerCampaign.territoriesCaptured.length,
    ),
    generalsRemaining: Math.max(
      0,
      campaign.victoryConditions.generalsDefeated - playerCampaign.generalsDefeated,
    ),
    capturedTerritoryNames: capturedNames,
    generalsDefeatedLog: playerCampaign.generalsDefeatedLog ?? [],
  };

  return { playerCampaign, campaign, progress };
}

export async function checkVictoryConditions(playerId: string) {
  const playerCampaign = await PlayerCampaign.findOne({ playerId, status: 'active' });
  if (!playerCampaign) return null;

  const campaign = await Campaign.findById(playerCampaign.campaignId);
  if (!campaign) return null;

  const territoriesMet =
    playerCampaign.territoriesCaptured.length >= campaign.victoryConditions.territoriesRequired;
  const generalsMet =
    playerCampaign.generalsDefeated >= campaign.victoryConditions.generalsDefeated;

  if (territoriesMet && generalsMet) {
    playerCampaign.status = 'won';
    playerCampaign.completedAt = new Date();
    await playerCampaign.save();
    return { won: true, playerCampaign };
  }

  return { won: false, playerCampaign };
}
