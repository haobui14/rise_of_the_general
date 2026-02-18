import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface DynastyStateDoc extends Document {
  dynastyId: Types.ObjectId;
  stability: number;
  corruption: number;
  activeFactionIds: Types.ObjectId[];
}

const dynastyStateSchema = new Schema<DynastyStateDoc>({
  dynastyId: { type: Schema.Types.ObjectId, ref: 'Dynasty', required: true, unique: true },
  stability: { type: Number, default: 100, min: 0, max: 100 },
  corruption: { type: Number, default: 0, min: 0, max: 100 },
  activeFactionIds: [{ type: Schema.Types.ObjectId, ref: 'Faction' }],
});

export const DynastyState = mongoose.model<DynastyStateDoc>('DynastyState', dynastyStateSchema);
