import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { Region } from '@rotg/shared-types';

export interface AiFactionDoc extends Document {
  factionId: Types.ObjectId;
  aggression: number;
  expansionRate: number;
  preferredRegions: Region[];
}

const aiFactionSchema = new Schema<AiFactionDoc>({
  factionId: { type: Schema.Types.ObjectId, ref: 'Faction', required: true, unique: true },
  aggression: { type: Number, default: 50, min: 0, max: 100 },
  expansionRate: { type: Number, default: 3 },
  preferredRegions: [{ type: String, enum: ['north', 'central', 'south'] }],
});

export const AiFaction = mongoose.model<AiFactionDoc>('AiFaction', aiFactionSchema);
