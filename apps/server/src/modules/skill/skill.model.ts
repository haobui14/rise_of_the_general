import mongoose, { Schema, type Document } from 'mongoose';

export interface SkillDoc extends Document {
  name: string;
  type: 'active' | 'passive';
  effects: {
    strengthBonus?: number;
    moraleBoost?: number;
    defenseBonus?: number;
  };
  unlockTier: number;
}

const skillSchema = new Schema<SkillDoc>({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['active', 'passive'], required: true },
  effects: {
    strengthBonus: { type: Number },
    moraleBoost: { type: Number },
    defenseBonus: { type: Number },
  },
  unlockTier: { type: Number, required: true },
});

export const Skill = mongoose.model<SkillDoc>('Skill', skillSchema);
