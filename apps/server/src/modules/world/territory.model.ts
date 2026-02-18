import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { Region } from '@rotg/shared-types';

export interface TerritoryDoc extends Document {
  name: string;
  region: Region;
  ownerFactionId: Types.ObjectId;
  strategicValue: number;
  defenseRating: number;
  connectedTerritoryIds: Types.ObjectId[];
}

const territorySchema = new Schema<TerritoryDoc>({
  name: { type: String, required: true, unique: true },
  region: { type: String, enum: ['north', 'central', 'south'], required: true },
  ownerFactionId: { type: Schema.Types.ObjectId, ref: 'Faction', required: true },
  strategicValue: { type: Number, default: 10 },
  defenseRating: { type: Number, default: 10 },
  connectedTerritoryIds: [{ type: Schema.Types.ObjectId, ref: 'Territory' }],
});

export const Territory = mongoose.model<TerritoryDoc>('Territory', territorySchema);
