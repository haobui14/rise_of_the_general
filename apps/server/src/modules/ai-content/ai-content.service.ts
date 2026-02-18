import type { CharacterRole } from '@rotg/shared-types';
import { callAi, isAiEnabled } from './client.js';
import {
  campaignPromptTemplate,
  narrativePromptTemplate,
  officerPromptTemplate,
  enemyGeneralPromptTemplate,
} from './prompts.js';
import {
  campaignDraftSchema,
  officerDraftSchema,
  enemyGeneralDraftSchema,
  type CampaignDraft,
  type OfficerDraft,
} from './validators.js';
import { EnemyGeneral } from '../enemy-general/enemy-general.model.js';
import { Territory } from '../world/territory.model.js';
import { Faction } from '../faction/faction.model.js';

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Sometimes AI wraps in markdown code blocks — strip them
    const stripped = raw
      .replace(/```(?:json)?\n?/g, '')
      .replace(/```/g, '')
      .trim();
    try {
      return JSON.parse(stripped);
    } catch {
      return null;
    }
  }
}

/** Generate a campaign draft. Returns null if AI disabled or fails. */
export async function generateCampaignDraft(
  playerId: string,
  context?: string,
): Promise<CampaignDraft | null> {
  if (!isAiEnabled('AI_CAMPAIGNS')) return null;

  const prompt = campaignPromptTemplate(context ?? '');
  const raw = await callAi(prompt, { maxTokens: 400 });
  if (!raw) return null;

  const parsed = tryParseJson(raw);
  const result = campaignDraftSchema.safeParse(parsed);
  if (!result.success) return null;

  return result.data;
}

/** Generate a narrative passage. Returns null if AI disabled or fails. */
export async function generateNarrative(
  playerId: string,
  event: string,
  context?: string,
): Promise<string | null> {
  if (!isAiEnabled('AI_NARRATIVE')) return null;

  const prompt = narrativePromptTemplate(event, context ?? '');
  const text = await callAi(prompt, { maxTokens: 200, temperature: 0.9 });
  return text?.trim() ?? null;
}

/** Generate an officer draft. Returns null if AI disabled or fails. */
export async function generateOfficer(
  playerId: string,
  role?: CharacterRole,
): Promise<OfficerDraft | null> {
  if (!isAiEnabled('AI_OFFICERS')) return null;

  const prompt = officerPromptTemplate(role ?? 'officer');
  const raw = await callAi(prompt, { maxTokens: 400 });
  if (!raw) return null;

  const parsed = tryParseJson(raw);
  const result = officerDraftSchema.safeParse(parsed);
  if (!result.success) return null;

  return result.data;
}

/**
 * Generate an AI-named enemy general and save it to DB.
 * Returns the created EnemyGeneral doc, or falls back to a seeded name if AI is disabled/fails.
 */
export async function spawnAiEnemyGeneral(
  territoryId: string,
  factionName?: string,
  level = 1,
): Promise<{
  general: InstanceType<typeof EnemyGeneral>;
  aiGenerated: boolean;
  lore: string | null;
}> {
  const territory = await Territory.findById(territoryId);
  if (!territory) throw new Error('Territory not found');

  // Resolve faction
  const faction = factionName
    ? await Faction.findOne({ name: { $regex: new RegExp(`^${factionName}$`, 'i') } })
    : await Faction.findById(territory.ownerFactionId);

  const faction_name = (faction as any)?.name ?? factionName ?? 'Wei';
  const factionId = faction?._id ?? territory.ownerFactionId;

  // Compute power multiplier from level
  const powerMultiplier = parseFloat((1.0 + level * 0.1).toFixed(2));

  let name: string;
  let lore: string | null = null;

  if (isAiEnabled('AI_GENERALS')) {
    const prompt = enemyGeneralPromptTemplate(faction_name, level, territory.name);
    const raw = await callAi(prompt, { maxTokens: 200 }).catch(() => null);
    if (raw) {
      const parsed = tryParseJson(raw);
      const result = enemyGeneralDraftSchema.safeParse(parsed);
      if (result.success) {
        // Strip any CJK / Chinese characters that the model may have included
        const cleanName = result.data.name.replace(/[\u3000-\u9fff\uac00-\ud7af]/g, '').trim();
        name = `${cleanName} — ${result.data.title}`;
        lore = result.data.lore;
      }
    }
  }

  // Fallback names if AI skipped or failed
  if (!name!) {
    const fallbacks = ['Zhang Wei', 'Li Hu', 'Wang Feng', 'Xu Da', 'Chen Long', 'Liu Peng'];
    name = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Ensure unique name by appending territory
  const uniqueName = `${name} (${territory.name})`;

  // Upsert — avoid duplicates if called multiple times
  const general = await EnemyGeneral.findOneAndUpdate(
    { name: uniqueName },
    {
      $setOnInsert: {
        name: uniqueName,
        factionId,
        territoryId: territory._id,
        level,
        powerMultiplier,
        alive: true,
        canRetreat: level >= 3,
      },
    },
    { upsert: true, new: true },
  );

  return { general, aiGenerated: lore !== null, lore };
}

/**
 * Spawn one AI general per territory that currently has no alive generals.
 * Runs sequentially to avoid hammering the AI API.
 */
export async function spawnAllGenerals(): Promise<{
  spawned: number;
  skipped: number;
  results: Array<{ territoryName: string; generalName: string; lore: string | null }>;
}> {
  const territories = await Territory.find();
  const results: Array<{ territoryName: string; generalName: string; lore: string | null }> = [];
  let spawned = 0;
  let skipped = 0;

  for (const territory of territories) {
    const existing = await EnemyGeneral.findOne({ territoryId: territory._id, alive: true });
    if (existing) {
      skipped++;
      continue;
    }
    const level = Math.max(1, Math.round((territory.defenseRating as number) / 15));
    const result = await spawnAiEnemyGeneral(territory._id.toString(), undefined, level).catch(
      () => null,
    );
    if (result) {
      spawned++;
      results.push({
        territoryName: territory.name,
        generalName: result.general.name,
        lore: result.lore,
      });
    }
  }

  return { spawned, skipped, results };
}
