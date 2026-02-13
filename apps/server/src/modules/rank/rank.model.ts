import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface RankDefinitionDoc extends Document {
  title: string;
  tier: number;
  requiredMerit: number;
  requiredLeadership: number;
  maxTroopCommand: number;
  unlockSkills: Types.ObjectId[];
  nextRankId: Types.ObjectId | null;
}

const rankDefinitionSchema = new Schema<RankDefinitionDoc>({
  title: { type: String, required: true, unique: true },
  tier: { type: Number, required: true, unique: true },
  requiredMerit: { type: Number, required: true },
  requiredLeadership: { type: Number, required: true },
  maxTroopCommand: { type: Number, required: true },
  unlockSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
  nextRankId: { type: Schema.Types.ObjectId, ref: 'RankDefinition', default: null },
});

export const RankDefinition = mongoose.model<RankDefinitionDoc>(
  'RankDefinition',
  rankDefinitionSchema,
);
