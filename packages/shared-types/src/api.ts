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
} from './models.js';

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
}

// Faction
export interface FactionListResponse {
  factions: IFaction[];
}

// Inventory
export interface InventoryResponse {
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

// Error
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
