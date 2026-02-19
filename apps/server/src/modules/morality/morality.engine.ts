import type { MoralFractureType } from '@rotg/shared-types';

export interface MoralitySnapshot {
  benevolence: number;
  righteousness: number;
  moralAmbition: number;
}

export function calculateMoralityDelta(action: string): MoralitySnapshot {
  const map: Record<string, MoralitySnapshot> = {
    mercy: { benevolence: 8, righteousness: 3, moralAmbition: -2 },
    execute: { benevolence: -8, righteousness: -3, moralAmbition: 4 },
    reform: { benevolence: 3, righteousness: 8, moralAmbition: -1 },
    seize_power: { benevolence: -6, righteousness: -6, moralAmbition: 10 },
  };
  return map[action] ?? { benevolence: 0, righteousness: 0, moralAmbition: 0 };
}

export function applyMoralityDelta(current: MoralitySnapshot, delta: MoralitySnapshot): MoralitySnapshot {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return {
    benevolence: clamp(current.benevolence + delta.benevolence),
    righteousness: clamp(current.righteousness + delta.righteousness),
    moralAmbition: clamp(current.moralAmbition + delta.moralAmbition),
  };
}

export function checkMoralFracture(m: MoralitySnapshot, action: string): MoralFractureType | null {
  if (action === 'execute' && m.benevolence >= 70) return 'mercy_rejected';
  if (action === 'seize_power' && m.righteousness >= 70) return 'honor_compromised';
  if (action === 'mercy' && m.moralAmbition >= 75) return 'ambition_unbound';
  return null;
}

export function getMoralityTitle(m: MoralitySnapshot): string {
  const sumVirtue = m.benevolence + m.righteousness;
  if (sumVirtue >= 150) return 'Paragon of Virtue';
  if (m.moralAmbition >= 80) return 'Relentless Aspirant';
  if (sumVirtue <= 70) return 'Shadowed Warlord';
  return 'Balanced Commander';
}
