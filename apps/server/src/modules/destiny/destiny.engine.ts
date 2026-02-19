import type { DestinyType, OmenType } from '@rotg/shared-types';

export function rollInitialDestiny(): DestinyType {
  const r = Math.random();
  if (r < 0.3) return 'heaven-favored';
  if (r < 0.6) return 'doomed';
  return 'unknown';
}

export function getDestinyProbabilityModifier(destiny: DestinyType): number {
  if (destiny === 'heaven-favored') return 0.1;
  if (destiny === 'doomed') return -0.1;
  return 0;
}

export function shouldRevealDestiny(omenType: OmenType, character: { destinyRevealed?: boolean }): boolean {
  if (character.destinyRevealed) return false;
  return omenType === 'prophecy' || omenType === 'heavenly_sign';
}
