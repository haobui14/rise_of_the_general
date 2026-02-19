import type { IBaseStats } from '@rotg/shared-types';

export function calculateBrotherhoodPowerBonus(bondLevel: number, membersInBattle: number): number {
  if (membersInBattle < 2) return 1;
  return 1 + Math.min(0.25, bondLevel * 0.05);
}

export function checkBondLevelUp(snapshot: { bondLevel: number; bondExperience: number }): { leveledUp: boolean; newLevel: number } {
  const threshold = snapshot.bondLevel * 100;
  if (snapshot.bondLevel >= 5 || snapshot.bondExperience < threshold) return { leveledUp: false, newLevel: snapshot.bondLevel };
  return { leveledUp: true, newLevel: snapshot.bondLevel + 1 };
}

export function calculateBondExpGain(outcome: 'won' | 'lost', membersInBattle: number): number {
  return (outcome === 'won' ? 30 : 12) * Math.max(1, membersInBattle - 1);
}

export function calculateJointSkillEffect(memberStats: IBaseStats[]): { powerBoost: number; description: string } {
  if (!memberStats.length) return { powerBoost: 1, description: 'No members present' };
  const avgLeadership = memberStats.reduce((acc, s) => acc + s.leadership, 0) / memberStats.length;
  const powerBoost = 1 + Math.min(0.15, avgLeadership / 200);
  return { powerBoost, description: 'Coordinated assault from sworn brothers' };
}
