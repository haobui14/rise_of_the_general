import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface CourtDoc extends Document {
  dynastyId: Types.ObjectId;
  stability: number;
  legitimacy: number;
  morale: number;
  corruption: number;
  lastActionType: string | null;
  updatedAt: Date;
}

const courtSchema = new Schema<CourtDoc>(
  {
    dynastyId: { type: Schema.Types.ObjectId, ref: 'Dynasty', required: true, unique: true },
    stability: { type: Number, default: 75, min: 0, max: 100 },
    legitimacy: { type: Number, default: 75, min: 0, max: 100 },
    morale: { type: Number, default: 75, min: 0, max: 100 },
    corruption: { type: Number, default: 10, min: 0, max: 100 },
    lastActionType: { type: String, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const CourtState = mongoose.model<CourtDoc>('CourtState', courtSchema);
