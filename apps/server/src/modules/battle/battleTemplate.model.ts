import mongoose, { Schema, type Document } from 'mongoose';

export interface BattleTemplateDoc extends Document {
  name: string;
  difficulty: number;
  enemyPower: number;
  meritReward: number;
  expReward: number;
}

const battleTemplateSchema = new Schema<BattleTemplateDoc>({
  name: { type: String, required: true, unique: true },
  difficulty: { type: Number, required: true },
  enemyPower: { type: Number, required: true },
  meritReward: { type: Number, required: true },
  expReward: { type: Number, required: true },
});

export const BattleTemplate = mongoose.model<BattleTemplateDoc>(
  'BattleTemplate',
  battleTemplateSchema,
);
