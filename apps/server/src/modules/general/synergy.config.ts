export interface SynergyPair {
  generalNames: [string, string];
  bonusMultiplier: number;
  name: string;
  description?: string;
}

export const SYNERGY_PAIRS: SynergyPair[] = [
  // ── Shu Han ──────────────────────────────────────────────────────────────
  {
    generalNames: ['Guan Yu', 'Zhang Fei'],
    bonusMultiplier: 1.20,
    name: 'Oath Brothers of Peach Garden',
    description: "Brotherhood forged in blood — their combined ferocity shatters all before them.",
  },
  {
    generalNames: ['Liu Bei', 'Guan Yu'],
    bonusMultiplier: 1.15,
    name: "Lord and Vanguard",
    description: "Where the lord leads, the sacred blade follows.",
  },
  {
    generalNames: ['Liu Bei', 'Zhang Fei'],
    bonusMultiplier: 1.15,
    name: "Lord and Fury",
    description: "The lord's vision empowers Zhang Fei's unstoppable charge.",
  },
  {
    generalNames: ['Zhao Yun', 'Liu Bei'],
    bonusMultiplier: 1.18,
    name: 'Eternal Guardian',
    description: "Zhao Yun's unbreakable loyalty doubles his martial power.",
  },
  {
    generalNames: ['Zhao Yun', 'Ma Chao'],
    bonusMultiplier: 1.10,
    name: 'Shu Vanguard',
    description: "Two warriors of unmatched valor ride together at the spear's tip.",
  },
  {
    generalNames: ['Zhuge Liang', 'Liu Bei'],
    bonusMultiplier: 1.15,
    name: 'Fish and Water',
    description: "The fish that found water — sovereign and strategist in perfect unity.",
  },
  {
    generalNames: ['Zhuge Liang', 'Zhao Yun'],
    bonusMultiplier: 1.12,
    name: 'Mind and Spear',
    description: "The strategist's plans executed by a warrior without equal.",
  },
  // ── Cao Wei ──────────────────────────────────────────────────────────────
  {
    generalNames: ['Cao Cao', 'Xiahou Dun'],
    bonusMultiplier: 1.18,
    name: 'Iron Lord and His Iron Arm',
    description: "Cao Cao's ambition backed by Xiahou Dun's undying ferocity.",
  },
  {
    generalNames: ['Sima Yi', 'Zhang Liao'],
    bonusMultiplier: 1.10,
    name: 'Wei Strategists',
    description: "The fox's cunning guided by the tiger's experience.",
  },
  {
    generalNames: ['Xiahou Dun', 'Xu Chu'],
    bonusMultiplier: 1.10,
    name: 'Wei Vanguard',
    description: "Two unstoppable forces that break even the strongest formations.",
  },
  {
    generalNames: ['Zhang Liao', 'Xu Huang'],
    bonusMultiplier: 1.08,
    name: 'Wei Blade Commanders',
    description: "Disciplined officers who turn Wei's war machine into an art.",
  },
  // ── Eastern Wu ───────────────────────────────────────────────────────────
  {
    generalNames: ['Zhou Yu', 'Lu Xun'],
    bonusMultiplier: 1.15,
    name: 'Wu Fire Masters',
    description: "Zhou Yu's flame and Lu Xun's brilliance — Wu's greatest strategists.",
  },
  {
    generalNames: ['Sun Quan', 'Zhou Yu'],
    bonusMultiplier: 1.15,
    name: 'Tiger and Phoenix',
    description: "The young lord and his magnificent chief strategist.",
  },
  {
    generalNames: ['Lu Meng', 'Gan Ning'],
    bonusMultiplier: 1.10,
    name: 'Wu Marines',
    description: "The scholarly general commands the river pirate's savage fleet.",
  },
  {
    generalNames: ['Sun Jian', 'Sun Ce'],
    bonusMultiplier: 1.18,
    name: 'Lions of Jiangdong',
    description: "Father and son — the founding blood of Wu fights as one.",
  },
];

