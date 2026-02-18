import { SYNERGY_PAIRS, type SynergyPair } from './synergy.config.js';

export function calculateSynergyBonus(activeGeneralNames: string[]): {
  totalMultiplier: number;
  activeSynergies: SynergyPair[];
} {
  let totalMultiplier = 1.0;
  const activeSynergies: SynergyPair[] = [];

  for (const pair of SYNERGY_PAIRS) {
    if (
      activeGeneralNames.includes(pair.generalNames[0]) &&
      activeGeneralNames.includes(pair.generalNames[1])
    ) {
      totalMultiplier *= pair.bonusMultiplier;
      activeSynergies.push(pair);
    }
  }

  return { totalMultiplier, activeSynergies };
}
