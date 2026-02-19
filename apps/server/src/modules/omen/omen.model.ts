import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { OmenType } from '@rotg/shared-types';

export interface OmenDoc extends Document {
  dynastyId: Types.ObjectId;
  type: OmenType;
  title: string;
  description: string;
  effect: {
    stabilityDelta: number;
    moraleDelta: number;
    destinyRevealCharacterId?: Types.ObjectId;
  };
  resolved: boolean;
  createdAt: Date;
}

const omenSchema = new Schema<OmenDoc>(
  {
    dynastyId: { type: Schema.Types.ObjectId, ref: 'Dynasty', required: true, index: true },
    type: { type: String, enum: ['comet', 'prophecy', 'dream', 'heavenly_sign'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    effect: {
      stabilityDelta: { type: Number, required: true },
      moraleDelta: { type: Number, required: true },
      destinyRevealCharacterId: { type: Schema.Types.ObjectId, ref: 'PlayerCharacter' },
    },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Omen = mongoose.model<OmenDoc>('Omen', omenSchema);
