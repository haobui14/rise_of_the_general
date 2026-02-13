import type { BattleStatus, ItemType, ItemRarity, SkillType } from './enums.js';

export interface IBaseStats {
  strength: number;
  defense: number;
  strategy: number;
  speed: number;
  leadership: number;
}

export interface ISkillEffects {
  strengthBonus?: number;
  moraleBoost?: number;
  defenseBonus?: number;
}

export interface IBattleResult {
  meritGained: number;
  expGained: number;
  casualties: number;
}

export interface IDynasty {
  _id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: Date;
}

export interface IFaction {
  _id: string;
  dynastyId: string;
  name: string;
  leaderName: string;
  baseBonus: IBaseStats;
}

export interface IRankDefinition {
  _id: string;
  title: string;
  tier: number;
  requiredMerit: number;
  requiredLeadership: number;
  maxTroopCommand: number;
  unlockSkills: string[];
  nextRankId: string | null;
}

export interface ISkill {
  _id: string;
  name: string;
  type: SkillType;
  effects: ISkillEffects;
  unlockTier: number;
}

export interface IItem {
  _id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  statBonus: Partial<IBaseStats>;
}

export interface IPlayer {
  _id: string;
  username: string;
  dynastyId: string;
  factionId: string;
  currentRankId: string;
  level: number;
  experience: number;
  merit: number;
  gold: number;
  stats: IBaseStats;
  isAlive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlayerInventoryItem {
  itemId: string;
  equipped: boolean;
}

export interface IPlayerInventory {
  _id: string;
  playerId: string;
  items: IPlayerInventoryItem[];
}

export interface IBattleTemplate {
  _id: string;
  name: string;
  difficulty: number;
  enemyPower: number;
  meritReward: number;
  expReward: number;
}

export interface IBattle {
  _id: string;
  playerId: string;
  templateId: string;
  enemyPower: number;
  status: BattleStatus;
  result: IBattleResult;
  startedAt: Date;
  endedAt: Date;
}

export type GeneralRarity = 'uncommon' | 'rare' | 'legendary';

export interface IGeneral {
  _id: string;
  name: string;
  title: string;
  factionId: string;
  requiredRankTier: number;
  requiredRelationship: number;
  stats: IBaseStats;
  rarity: GeneralRarity;
  battleBonus: {
    powerMultiplier: number;
  };
}

export interface IPlayerGeneral {
  _id: string;
  playerId: string;
  generalId: string;
  relationship: number;
  recruited: boolean;
  recruitedAt: Date | null;
}
