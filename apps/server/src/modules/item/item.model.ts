import mongoose, { Schema, type Document } from 'mongoose';

export interface ItemDoc extends Document {
  name: string;
  type: 'weapon' | 'armor';
  rarity: 'common' | 'rare' | 'epic' | 'mythic';
  statBonus: {
    strength?: number;
    defense?: number;
    strategy?: number;
    leadership?: number;
  };
  isMythic?: boolean;
  boundToCharacterId?: mongoose.Types.ObjectId | null;
  duelBonus?: {
    strengthMultiplier: number;
    destinyInteraction?: 'heaven-favored' | 'doomed' | 'neutral';
  };
  lore?: string;
}

const itemSchema = new Schema<ItemDoc>({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['weapon', 'armor'], required: true },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'mythic'], required: true },
  statBonus: {
    strength: { type: Number },
    defense: { type: Number },
    strategy: { type: Number },
    leadership: { type: Number },
  },
  isMythic: { type: Boolean, default: false },
  boundToCharacterId: { type: Schema.Types.ObjectId, ref: 'PlayerCharacter', default: null },
  duelBonus: {
    strengthMultiplier: { type: Number, default: 1 },
    destinyInteraction: { type: String, enum: ['heaven-favored', 'doomed', 'neutral'], default: 'neutral' },
  },
  lore: { type: String },
});

export const Item = mongoose.model<ItemDoc>('Item', itemSchema);
