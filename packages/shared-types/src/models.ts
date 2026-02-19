import type {
  BattleStatus,
  ItemType,
  ItemRarity,
  SkillType,
  Formation,
  TroopType,
  InjuryType,
  Region,
  CampaignStatus,
  CharacterRole,
  TimelineType,
  CourtActionType,
  MoralFractureType,
  DestinyType,
  OmenType,
  DuelTriggerType,
  DuelOutcome,
} from './enums.js';

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
  timeline: TimelineType;
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
  /** Minimum battles won before promotion is eligible. Kingdom principle: rank through blood. */
  minBattlesWon?: number;
  /** Minimum player level required. */
  minLevel?: number;
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
  isMythic?: boolean;
  boundToCharacterId?: string | null;
  duelBonus?: {
    strengthMultiplier: number;
    destinyInteraction?: 'heaven-favored' | 'doomed' | 'neutral';
  };
  lore?: string;
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
  warExhaustion: number;
  romanceMode: boolean;
  activeCharacterId?: string;
  politicalTurns: number;
  successionPending: boolean;
  /** Total battles won across all campaigns. Used for rank promotion gating. */
  battlesWon?: number;
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
  /** Optional: enemy troop type for the troop-counter triangle. */
  enemyTroopType?: TroopType;
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

// Phase 2 Models

export interface IPlayerArmy {
  _id: string;
  playerId: string;
  troopCount: number;
  morale: number;
  formation: Formation;
  troopType: TroopType;
}

export interface IPlayerGeneralSlots {
  _id: string;
  playerId: string;
  activeGeneralIds: string[];
}

export interface ISynergyPair {
  generalNames: [string, string];
  bonusMultiplier: number;
  name: string;
}

export interface IPlayerInjury {
  _id: string;
  playerId: string;
  type: InjuryType;
  statPenalty: Partial<IBaseStats>;
  durationBattles: number;
  battlesRemaining: number;
  createdAt: Date;
}

export interface IPlayerLegacy {
  _id: string;
  playerId: string;
  dynastiesCompleted: number;
  permanentBonuses: {
    powerMultiplier: number;
  };
  completedAt: Date[];
}

export interface IPowerBreakdown {
  basePower: number;
  armyBonus: number;
  formationMultiplier: number;
  generalBonus: number;
  synergyMultiplier: number;
  legacyBonus: number;
  brotherhoodBonus?: number;
  finalPower: number;
}

// Phase 3 Models

export interface ITerritory {
  _id: string;
  name: string;
  region: Region;
  ownerFactionId: string;
  strategicValue: number;
  defenseRating: number;
  connectedTerritoryIds: string[];
}

export interface IAiFaction {
  _id: string;
  factionId: string;
  aggression: number;
  expansionRate: number;
  preferredRegions: Region[];
}

export interface IEnemyGeneral {
  _id: string;
  name: string;
  factionId: string;
  territoryId: string;
  level: number;
  powerMultiplier: number;
  alive: boolean;
  canRetreat: boolean;
}

export interface ICampaign {
  _id: string;
  name: string;
  dynastyId: string;
  startingTerritoryId: string;
  victoryConditions: {
    territoriesRequired: number;
    generalsDefeated: number;
  };
}

export interface IPlayerCampaign {
  _id: string;
  playerId: string;
  campaignId: string;
  territoriesCaptured: string[];
  generalsDefeated: number;
  status: CampaignStatus;
  startedAt: Date;
  completedAt: Date | null;
}

export interface IDynastyState {
  _id: string;
  dynastyId: string;
  stability: number;
  corruption: number;
  activeFactionIds: string[];
}

// Phase 4 Models

export interface IPlayerCharacter {
  _id: string;
  playerId: string;
  name: string;
  role: CharacterRole;
  loyalty: number; // 0–100
  ambition: number; // 0–100
  morality?: {
    benevolence: number;
    righteousness: number;
    moralAmbition: number;
  };
  moralFractures?: MoralFractureType[];
  destiny?: DestinyType;
  destinyRevealed?: boolean;
  stats: IBaseStats;
  isAlive: boolean;
  createdAt: Date;
}

export interface ICourtState {
  _id: string;
  dynastyId: string;
  stability: number; // 0–100
  legitimacy: number; // 0–100
  morale: number; // 0–100
  corruption: number; // 0–100
  lastActionType: CourtActionType | null;
  updatedAt: Date;
}


export interface IOmen {
  _id: string;
  dynastyId: string;
  type: OmenType;
  title: string;
  description: string;
  effect: {
    stabilityDelta: number;
    moraleDelta: number;
    destinyRevealCharacterId?: string;
  };
  resolved: boolean;
  createdAt: Date;
}

export interface IBrotherhood {
  _id: string;
  playerId: string;
  name: string;
  memberCharacterIds: string[];
  bondLevel: number;
  bondExperience: number;
  jointSkillUnlocked: boolean;
  createdAt: Date;
}

export interface IDuelRound {
  round: number;
  challengerPower: number;
  opponentPower: number;
  winner: 'challenger' | 'opponent' | 'draw';
}

export interface IDuel {
  _id: string;
  playerId: string;
  challengerCharacterId: string;
  opponentName: string;
  opponentStats: IBaseStats;
  trigger: DuelTriggerType;
  outcome: DuelOutcome;
  rounds: IDuelRound[];
  rewardMerit: number;
  rewardExp: number;
  narration?: string;
  createdAt: Date;
}
