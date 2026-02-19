import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { DuelOutcome, DuelTriggerType, IBaseStats } from '@rotg/shared-types';

export interface DuelDoc extends Document {
  playerId: Types.ObjectId;
  challengerCharacterId: Types.ObjectId;
  opponentName: string;
  opponentStats: IBaseStats;
  trigger: DuelTriggerType;
  outcome: DuelOutcome;
  rounds: Array<{ round: number; challengerPower: number; opponentPower: number; winner: 'challenger' | 'opponent' | 'draw' }>;
  rewardMerit: number;
  rewardExp: number;
  narration?: string;
  createdAt: Date;
}

const duelSchema = new Schema<DuelDoc>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    challengerCharacterId: { type: Schema.Types.ObjectId, ref: 'PlayerCharacter', required: true },
    opponentName: { type: String, required: true },
    opponentStats: {
      strength: { type: Number, required: true },
      defense: { type: Number, required: true },
      strategy: { type: Number, required: true },
      speed: { type: Number, required: true },
      leadership: { type: Number, required: true },
    },
    trigger: { type: String, enum: ['insult', 'ambush', 'challenge', 'honor_dispute'], required: true },
    outcome: { type: String, enum: ['win', 'loss', 'draw'], required: true },
    rounds: [
      {
        round: Number,
        challengerPower: Number,
        opponentPower: Number,
        winner: { type: String, enum: ['challenger', 'opponent', 'draw'] },
      },
    ],
    rewardMerit: { type: Number, default: 0 },
    rewardExp: { type: Number, default: 0 },
    narration: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Duel = mongoose.model<DuelDoc>('Duel', duelSchema);
