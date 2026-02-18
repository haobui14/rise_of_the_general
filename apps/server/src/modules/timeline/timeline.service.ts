import { Dynasty } from '../dynasty/dynasty.model.js';
import { Territory } from '../world/territory.model.js';
import { DynastyState } from '../dynasty-state/dynasty-state.model.js';
import { AiFaction } from '../ai/ai-faction.model.js';
import { checkDivergenceTriggers, buildDivergentWorld } from './timeline.engine.js';
import type { TimelineType } from '@rotg/shared-types';

export async function checkAndApplyDivergence(params: {
  dynastyId: string;
  playerFactionId: string;
  killedGeneralWasLegendary?: boolean;
}) {
  const dynasty = await Dynasty.findById(params.dynastyId);
  if (!dynasty) return null;

  const allTerritories = await Territory.find();
  const playerControlled = allTerritories.filter(
    (t) => t.ownerFactionId.toString() === params.playerFactionId,
  ).length;

  const dynastyState = await DynastyState.findOne({ dynastyId: params.dynastyId });
  const stability = dynastyState?.stability ?? 100;

  const trigger = checkDivergenceTriggers({
    totalTerritories: allTerritories.length,
    playerControlledTerritories: playerControlled,
    playerFactionId: params.playerFactionId,
    killedGeneralWasLegendary: params.killedGeneralWasLegendary ?? false,
    dynastyStability: stability,
    currentTimeline: dynasty.timeline as TimelineType,
  });

  if (!trigger) {
    return {
      diverged: false,
      trigger: null,
      newTimelineType: dynasty.timeline as TimelineType,
      detail: 'History remains on course.',
    };
  }

  const divergentWorld = buildDivergentWorld(trigger);

  // Flip dynasty timeline
  dynasty.timeline = 'divergent';
  await dynasty.save();

  // Create a new, highly aggressive AI faction (the "shadow force")
  await AiFaction.create({
    factionId: params.playerFactionId, // placeholder — will be overridden when faction system expands
    aggression: divergentWorld.newAiFactionAggression,
    expansionRate: 1,
    preferredRegions: ['north', 'central', 'south'],
  }).catch(() => {}); // ignore duplicate key — may already exist

  return {
    diverged: true,
    trigger,
    newTimelineType: 'divergent' as TimelineType,
    detail: divergentWorld.detail,
  };
}

export async function getDivergenceStatus(dynastyId: string) {
  const dynasty = await Dynasty.findById(dynastyId);
  if (!dynasty) {
    return {
      diverged: false,
      trigger: null,
      newTimelineType: 'historical' as TimelineType,
      detail: 'Dynasty not found.',
    };
  }

  return {
    diverged: dynasty.timeline === 'divergent',
    trigger: null,
    newTimelineType: dynasty.timeline as TimelineType,
    detail:
      dynasty.timeline === 'divergent'
        ? 'The timeline has diverged from history.'
        : 'History remains on its original course.',
  };
}
