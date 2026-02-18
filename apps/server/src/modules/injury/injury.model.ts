import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface PlayerInjuryDoc extends Document {
  playerId: Types.ObjectId;
  type: string;
  statPenalty: {
    strength?: number;
    defense?: number;
    strategy?: number;
    speed?: number;
    leadership?: number;
  };
  durationBattles: number;
  battlesRemaining: number;
  createdAt: Date;
}

const playerInjurySchema = new Schema<PlayerInjuryDoc>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    type: { type: String, required: true, enum: ['wound', 'broken_arm', 'fatigue'] },
    statPenalty: {
      strength: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
      strategy: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      leadership: { type: Number, default: 0 },
    },
    durationBattles: { type: Number, required: true },
    battlesRemaining: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PlayerInjury = mongoose.model<PlayerInjuryDoc>('PlayerInjury', playerInjurySchema);
