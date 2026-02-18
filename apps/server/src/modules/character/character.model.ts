import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { CharacterRole } from '@rotg/shared-types';

export interface CharacterDoc extends Document {
  playerId: Types.ObjectId;
  name: string;
  role: CharacterRole;
  loyalty: number;
  ambition: number;
  stats: {
    strength: number;
    defense: number;
    strategy: number;
    speed: number;
    leadership: number;
  };
  isAlive: boolean;
  createdAt: Date;
}

const characterSchema = new Schema<CharacterDoc>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['main', 'heir', 'officer', 'advisor'],
      default: 'officer',
    },
    loyalty: { type: Number, default: 70, min: 0, max: 100 },
    ambition: { type: Number, default: 50, min: 0, max: 100 },
    stats: {
      strength: { type: Number, default: 5 },
      defense: { type: Number, default: 5 },
      strategy: { type: Number, default: 5 },
      speed: { type: Number, default: 5 },
      leadership: { type: Number, default: 5 },
    },
    isAlive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

characterSchema.index({ playerId: 1 });
characterSchema.index({ playerId: 1, role: 1 });

export const PlayerCharacter = mongoose.model<CharacterDoc>('PlayerCharacter', characterSchema);
