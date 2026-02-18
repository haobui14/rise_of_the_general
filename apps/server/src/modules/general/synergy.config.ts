export interface SynergyPair {
  generalNames: [string, string];
  bonusMultiplier: number;
  name: string;
}

export const SYNERGY_PAIRS: SynergyPair[] = [
  { generalNames: ['Guan Yu', 'Zhang Fei'], bonusMultiplier: 1.10, name: 'Oath Brothers' },
  { generalNames: ['Sima Yi', 'Zhang Liao'], bonusMultiplier: 1.08, name: 'Wei Strategists' },
  { generalNames: ['Zhou Yu', 'Lu Xun'], bonusMultiplier: 1.08, name: 'Wu Fire Masters' },
  { generalNames: ['Zhao Yun', 'Ma Chao'], bonusMultiplier: 1.07, name: 'Shu Vanguard' },
  { generalNames: ['Xiahou Dun', 'Xu Chu'], bonusMultiplier: 1.07, name: 'Wei Vanguard' },
  { generalNames: ['Lu Meng', 'Gan Ning'], bonusMultiplier: 1.06, name: 'Wu Marines' },
];
