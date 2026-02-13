import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { BattleStatus } from '@rotg/shared-types';

export interface BattleDoc extends Document {
  playerId: Types.ObjectId;
  templateId: Types.ObjectId;
  enemyPower: number;
  status: BattleStatus;
  result: {
    meritGained: number;
    expGained: number;
    casualties: number;
  };
  startedAt: Date;
  endedAt: Date;
}

const battleSchema = new Schema<BattleDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
  templateId: { type: Schema.Types.ObjectId, ref: 'BattleTemplate', required: true },
  enemyPower: { type: Number, required: true },
  status: { type: String, enum: ['ongoing', 'won', 'lost'], default: 'ongoing' },
  result: {
    meritGained: { type: Number, default: 0 },
    expGained: { type: Number, default: 0 },
    casualties: { type: Number, default: 0 },
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

export const Battle = mongoose.model<BattleDoc>('Battle', battleSchema);
