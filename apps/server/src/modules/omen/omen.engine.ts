import type { OmenType } from '@rotg/shared-types';

export function shouldOmenOccur(ctx: { stability: number; corruption: number }): boolean {
  const instability = (100 - ctx.stability) / 100;
  const corruption = ctx.corruption / 100;
  const chance = Math.min(0.8, 0.08 + instability * 0.3 + corruption * 0.25);
  return Math.random() < chance;
}

export function rollOmenType(_ctx: { stability: number; corruption: number }): OmenType {
  const types: OmenType[] = ['comet', 'prophecy', 'dream', 'heavenly_sign'];
  return types[Math.floor(Math.random() * types.length)]!;
}

export function generateOmenEffects(type: OmenType): { stabilityDelta: number; moraleDelta: number } {
  switch (type) {
    case 'comet':
      return { stabilityDelta: -6, moraleDelta: -4 };
    case 'prophecy':
      return { stabilityDelta: 4, moraleDelta: 5 };
    case 'dream':
      return { stabilityDelta: 2, moraleDelta: -1 };
    default:
      return { stabilityDelta: -2, moraleDelta: 6 };
  }
}
