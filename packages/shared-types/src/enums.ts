export type BattleStatus = 'ongoing' | 'won' | 'lost';
export type ItemType = 'weapon' | 'armor';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'mythic';
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
  | 'idle_decay'
  | 'great_victory'       // overwhelming rout — powerRatio >= 2.0
  | 'crushing_defeat'     // catastrophic loss — high casualties on loss
  | 'general_promoted';   // one of the deployed generals earned a rank


// Phase 5
export type MoralFractureType = 'mercy_rejected' | 'honor_compromised' | 'ambition_unbound';
export type DestinyType = 'heaven-favored' | 'doomed' | 'unknown';
export type OmenType = 'comet' | 'prophecy' | 'dream' | 'heavenly_sign';
export type DuelTriggerType = 'insult' | 'ambush' | 'challenge' | 'honor_dispute';
export type DuelOutcome = 'win' | 'loss' | 'draw';
