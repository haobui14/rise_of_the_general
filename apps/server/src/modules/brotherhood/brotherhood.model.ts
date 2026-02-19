import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface BrotherhoodDoc extends Document {
  playerId: Types.ObjectId;
  name: string;
  memberCharacterIds: Types.ObjectId[];
  bondLevel: number;
  bondExperience: number;
  jointSkillUnlocked: boolean;
  createdAt: Date;
}

const brotherhoodSchema = new Schema<BrotherhoodDoc>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    name: { type: String, required: true },
    memberCharacterIds: [{ type: Schema.Types.ObjectId, ref: 'PlayerCharacter', required: true }],
    bondLevel: { type: Number, default: 1, min: 1, max: 5 },
    bondExperience: { type: Number, default: 0, min: 0 },
    jointSkillUnlocked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Brotherhood = mongoose.model<BrotherhoodDoc>('Brotherhood', brotherhoodSchema);
