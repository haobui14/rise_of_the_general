export type BattleStatus = 'ongoing' | 'won' | 'lost';
export type ItemType = 'weapon' | 'armor';
export type ItemRarity = 'common' | 'rare' | 'epic';
export type SkillType = 'active' | 'passive';
export type Formation = 'line' | 'wedge' | 'phalanx' | 'skirmish';
export type TroopType = 'infantry' | 'cavalry' | 'archer';
export type InjuryType = 'wound' | 'broken_arm' | 'fatigue';

// Phase 3
export type Region = 'north' | 'central' | 'south';
export type CampaignStatus = 'active' | 'won' | 'lost';
export type AiAction = 'expand' | 'defend' | 'counterattack';
export type StrategicActionType = 'rest' | 'fortify' | 'spy' | 'drill';

// Phase 4
export type CharacterRole = 'main' | 'heir' | 'officer' | 'advisor';
export type TimelineType = 'historical' | 'divergent';
export type CourtActionType = 'negotiate' | 'purge' | 'reform' | 'propaganda';
export type LoyaltyEventType =
  | 'battle_victory'
  | 'battle_defeat'
  | 'promotion'
  | 'betrayal_rumor'
  | 'idle_decay';
