import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface GeneralDoc extends Document {
  name: string;
  title: string;
  factionId: Types.ObjectId;
  requiredRankTier: number;
  requiredRelationship: number;
  stats: {
    strength: number;
    defense: number;
    strategy: number;
    speed: number;
    leadership: number;
  };
  rarity: 'uncommon' | 'rare' | 'legendary';
  battleBonus: {
    powerMultiplier: number;
  };
}

const generalSchema = new Schema<GeneralDoc>({
  name: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  factionId: { type: Schema.Types.ObjectId, ref: 'Faction', required: true },
  requiredRankTier: { type: Number, required: true },
  requiredRelationship: { type: Number, required: true },
  stats: {
    strength: { type: Number, required: true },
    defense: { type: Number, required: true },
    strategy: { type: Number, required: true },
    speed: { type: Number, required: true },
    leadership: { type: Number, required: true },
  },
  rarity: { type: String, enum: ['uncommon', 'rare', 'legendary'], required: true },
  battleBonus: {
    powerMultiplier: { type: Number, default: 1.1 },
  },
});

export const General = mongoose.model<GeneralDoc>('General', generalSchema);
