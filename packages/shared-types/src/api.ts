import type {
  IPlayer,
  IRankDefinition,
  IFaction,
  ISkill,
  IItem,
  IBattleTemplate,
  IBattle,
  IPlayerInventory,
  IGeneral,
  IPlayerGeneral,
  IPlayerArmy,
  IPlayerInjury,
  IPlayerLegacy,
  ISynergyPair,
  IPowerBreakdown,
} from './models.js';

import type { Formation, TroopType } from './enums.js';

// Auth
export interface RegisterRequest {
  username: string;
  factionId: string;
}

export interface LoginRequest {
  username: string;
}

export interface AuthResponse {
  token: string;
  player: IPlayer;
}

// Player
export interface PlayerResponse {
  player: IPlayer;
  rank: IRankDefinition;
  faction: IFaction;
}

export interface PromotePlayerResponse {
  player: IPlayer;
  newRank: IRankDefinition;
  unlockedSkills: ISkill[];
}

// Battle
export interface BattleTemplateListResponse {
  templates: IBattleTemplate[];
}

export interface StartBattleRequest {
  playerId: string;
  templateId: string;
}

export interface StartBattleResponse {
  battle: IBattle;
}

export interface ResolveBattleResponse {
  battle: IBattle;
  player: IPlayer;
  droppedItem: IItem | null;
  powerBreakdown: IPowerBreakdown;
  newInjury: IPlayerInjury | null;
  moraleChange: number | null;
  activeSynergies: ISynergyPair[];
}

// Faction
export interface FactionListResponse {
  factions: IFaction[];
}

// Inventory
export interface InventoryResponse {
  inventory: IPlayerInventory;
}

export interface EquipItemRequest {
  itemId: string;
}

export interface EquipItemResponse {
  inventory: IPlayerInventory;
}

// Rank
export interface RankListResponse {
  ranks: IRankDefinition[];
}

// Generals
export interface GeneralWithRelation extends IGeneral {
  relationship: number;
  recruited: boolean;
  canRecruit: boolean;
}

export interface GeneralsListResponse {
  generals: GeneralWithRelation[];
}

export interface RecruitGeneralResponse {
  general: IGeneral;
  playerGeneral: IPlayerGeneral;
}

export interface ActiveGeneralsResponse {
  activeGenerals: IGeneral[];
  maxSlots: number;
  currentSlots: number;
}

export interface DeployGeneralRequest {
  generalId: string;
}

export interface WithdrawGeneralRequest {
  generalId: string;
}

// Synergy
export interface SynergyListResponse {
  synergies: ISynergyPair[];
}

export interface ActiveSynergiesResponse {
  activeSynergies: ISynergyPair[];
  totalMultiplier: number;
}

// Army
export interface PlayerArmyResponse {
  army: IPlayerArmy | null;
}

export interface CreateArmyRequest {
  troopType: TroopType;
}

export interface ChangeFormationRequest {
  formation: Formation;
}

export interface RecruitTroopsRequest {
  count: number;
}

export interface ChangeTroopTypeRequest {
  troopType: TroopType;
}

// Injuries
export interface PlayerInjuriesResponse {
  injuries: IPlayerInjury[];
}

// Legacy / Dynasty
export interface PlayerLegacyResponse {
  legacy: IPlayerLegacy | null;
}

export interface CompleteDynastyResponse {
  player: IPlayer;
  legacy: IPlayerLegacy;
}

// Error
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
