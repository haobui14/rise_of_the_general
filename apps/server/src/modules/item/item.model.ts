import mongoose, { Schema, type Document } from 'mongoose';

export interface ItemDoc extends Document {
  name: string;
  type: 'weapon' | 'armor';
  rarity: 'common' | 'rare' | 'epic';
  statBonus: {
    strength?: number;
    defense?: number;
    strategy?: number;
    leadership?: number;
  };
}

const itemSchema = new Schema<ItemDoc>({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['weapon', 'armor'], required: true },
  rarity: { type: String, enum: ['common', 'rare', 'epic'], required: true },
  statBonus: {
    strength: { type: Number },
    defense: { type: Number },
    strategy: { type: Number },
    leadership: { type: Number },
  },
});

export const Item = mongoose.model<ItemDoc>('Item', itemSchema);
