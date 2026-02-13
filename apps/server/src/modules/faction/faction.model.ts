import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface FactionDoc extends Document {
  dynastyId: Types.ObjectId;
  name: string;
  leaderName: string;
  baseBonus: {
    strength: number;
    defense: number;
    strategy: number;
    speed: number;
    leadership: number;
  };
}

const factionSchema = new Schema<FactionDoc>({
  dynastyId: { type: Schema.Types.ObjectId, ref: 'Dynasty', required: true },
  name: { type: String, required: true, unique: true },
  leaderName: { type: String, required: true },
  baseBonus: {
    strength: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    strategy: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    leadership: { type: Number, default: 0 },
  },
});

export const Faction = mongoose.model<FactionDoc>('Faction', factionSchema);
