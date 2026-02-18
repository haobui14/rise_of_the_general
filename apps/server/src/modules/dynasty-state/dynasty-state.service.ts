import { DynastyState } from './dynasty-state.model.js';
import { NotFoundError } from '../../utils/errors.js';

type StabilityEvent =
  | 'general_killed'
  | 'territory_lost'
  | 'player_dominates'
  | 'territory_recovered';

const STABILITY_DELTAS: Record<StabilityEvent, number> = {
  general_killed: -10,
  territory_lost: -5,
  player_dominates: -15,
  territory_recovered: +8,
};

export async function getDynastyState(dynastyId: string) {
  const dynastyState = await DynastyState.findOne({ dynastyId });
  if (!dynastyState) throw new NotFoundError('Dynasty state not found');
  return { dynastyState };
}

export async function getActiveDynastyState() {
  const dynastyState = await DynastyState.findOne().sort({ updatedAt: -1 });
  if (!dynastyState) throw new NotFoundError('No dynasty state found');
  return { dynastyState };
}

export async function updateStabilityOnEvent(dynastyId: string, event: StabilityEvent) {
  const dynastyState = await DynastyState.findOne({ dynastyId });
  if (!dynastyState) throw new NotFoundError('Dynasty state not found');

  const delta = STABILITY_DELTAS[event] ?? 0;
  dynastyState.stability = Math.max(0, Math.min(100, dynastyState.stability + delta));

  // Corruption rises as stability falls
  if (dynastyState.stability < 50) {
    dynastyState.corruption = Math.min(100, dynastyState.corruption + 2);
  }

  await dynastyState.save();
  return { dynastyState, delta };
}

export async function isInCollapsePhase(dynastyId: string): Promise<boolean> {
  const state = await DynastyState.findOne({ dynastyId });
  return (state?.stability ?? 100) < 20;
}
