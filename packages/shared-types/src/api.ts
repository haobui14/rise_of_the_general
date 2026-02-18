import type {
  IPlayer,
  IBaseStats,
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
  ITerritory,
  IAiFaction,
  IEnemyGeneral,
  ICampaign,
  IPlayerCampaign,
  IDynastyState,
  IPlayerCharacter,
  ICourtState,
} from './models.js';

import type {
  Formation,
  TroopType,
  StrategicActionType,
  AiAction,
  CharacterRole,
  CourtActionType,
} from './enums.js';

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
  effectiveStats: IBaseStats;
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
  exhaustionChange: number;
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

// ── Phase 3 ──────────────────────────────────────────────────────────────────

// World / Territory
export interface TerritoryGeneralSummary {
  name: string;
  level: number;
  powerMultiplier: number;
}

export interface WorldMapResponse {
  territories: ITerritory[];
  generalsByTerritory: Record<string, TerritoryGeneralSummary[]>;
}

export interface TerritoryResponse {
  territory: ITerritory;
  enemyGenerals: IEnemyGeneral[];
}

export interface AttackTerritoryRequest {
  playerId: string;
  territoryId: string;
}

export interface AttackTerritoryResponse {
  outcome: 'won' | 'lost';
  territory: ITerritory | null;
  meritBonus: number;
  leadershipGained: number;
  exhaustionChange: number;
  enemyGeneralDefeated: IEnemyGeneral | null;
}

// Campaign
export interface CampaignListResponse {
  campaigns: ICampaign[];
}

export interface StartCampaignRequest {
  playerId: string;
  campaignId: string;
}

export interface StartCampaignResponse {
  playerCampaign: IPlayerCampaign;
  campaign: ICampaign;
}

export interface PlayerCampaignResponse {
  playerCampaign: IPlayerCampaign;
  campaign: ICampaign;
  progress: {
    territoriesRemaining: number;
    generalsRemaining: number;
    capturedTerritoryNames: string[];
    generalsDefeatedLog: string[];
  };
}

// AI
export interface AdvanceAiRequest {
  factionId: string;
}

export interface AdvanceAiResponse {
  action: AiAction;
  factionId: string;
  affectedTerritoryId: string | null;
  detail: string;
}

// Enemy Generals
export interface EnemyGeneralsInTerritoryResponse {
  generals: IEnemyGeneral[];
}

// Strategy
export interface StrategicActionRequest {
  playerId: string;
  territoryId?: string; // required for fortify and spy
}

export interface StrategicActionResponse {
  action: StrategicActionType;
  player: IPlayer;
  detail: string;
  // spy only
  revealedGenerals?: IEnemyGeneral[];
}

// Dynasty State
export interface DynastyStateResponse {
  dynastyState: IDynastyState;
}

// AI Faction
export interface AiFactionListResponse {
  aiFactions: IAiFaction[];
}

// ── Phase 4 ──────────────────────────────────────────────────────────────────

// Characters
export interface CharacterListResponse {
  characters: IPlayerCharacter[];
  activeCharacterId: string | null;
}

export interface CreateCharacterRequest {
  name: string;
  role?: CharacterRole;
}

export interface CreateCharacterResponse {
  character: IPlayerCharacter;
}

export interface SetActiveCharacterRequest {
  characterId: string;
}

export interface SetActiveCharacterResponse {
  player: IPlayer;
  character: IPlayerCharacter;
}

export interface PromoteToHeirRequest {
  characterId: string;
}

export interface PromoteToHeirResponse {
  character: IPlayerCharacter;
}

// Loyalty & Betrayal
export interface BetrayalEvent {
  characterId: string;
  characterName: string;
  territoriesLost: string[];
  stabilityDelta: number;
}

export interface LoyaltyTickResponse {
  affectedCharacters: Array<{ characterId: string; newLoyalty: number }>;
  betrayals: BetrayalEvent[];
}

// Succession
export interface SuccessionStateResponse {
  pending: boolean;
  deceasedName: string | null;
  candidates: IPlayerCharacter[];
  stabilityDelta: number;
  moraleDelta: number;
  legitimacyDelta: number;
}

export interface ConfirmSuccessionRequest {
  successorId: string;
}

export interface ConfirmSuccessionResponse {
  player: IPlayer;
  newCharacter: IPlayerCharacter;
  stabilityDelta: number;
  moraleDelta: number;
  legitimacyDelta: number;
}

// Political Court
export interface CourtStateResponse {
  court: ICourtState;
  politicalTurnsRemaining: number;
}

export interface CourtActionRequest {
  playerId: string;
  action: CourtActionType;
}

export interface CourtActionResponse {
  court: ICourtState;
  player: IPlayer;
  action: CourtActionType;
  deltas: {
    stability: number;
    legitimacy: number;
    morale: number;
    corruption: number;
  };
  detail: string;
}

// Timeline / Era
export interface TimelineDivergenceResponse {
  diverged: boolean;
  trigger: string | null;
  newTimelineType: 'historical' | 'divergent';
  detail: string;
}

// AI Content
export interface GenerateCampaignDraftRequest {
  playerId: string;
  context?: string;
}

export interface CampaignDraftResponse {
  draftId: string;
  name: string;
  description: string;
  suggestedObjectives: string[];
  estimatedDifficulty: number;
}

export interface GenerateNarrativeRequest {
  playerId: string;
  event: string;
  context?: string;
}

export interface NarrativeResponse {
  text: string;
}

export interface GenerateOfficerRequest {
  playerId: string;
  role?: CharacterRole;
}

export interface OfficerDraftResponse {
  name: string;
  backstory: string;
  suggestedStats: Partial<IBaseStats>;
  suggestedRole: CharacterRole;
}

export interface SpawnEnemyGeneralRequest {
  territoryId: string;
  faction?: string; // e.g. 'Wei', 'Shu', 'Wu'
  level?: number;
}

export interface SpawnEnemyGeneralResponse {
  general: IEnemyGeneral;
  aiGenerated: boolean;
  lore: string | null;
}

export interface SpawnAllGeneralsResponse {
  spawned: number;
  skipped: number;
  results: Array<{ territoryName: string; generalName: string; lore: string | null }>;
}
