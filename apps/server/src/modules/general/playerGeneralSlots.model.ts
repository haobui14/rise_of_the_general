import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface PlayerGeneralSlotsDoc extends Document {
  playerId: Types.ObjectId;
  activeGeneralIds: Types.ObjectId[];
}

const playerGeneralSlotsSchema = new Schema<PlayerGeneralSlotsDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, unique: true },
  activeGeneralIds: [{ type: Schema.Types.ObjectId, ref: 'General' }],
});

export const PlayerGeneralSlots = mongoose.model<PlayerGeneralSlotsDoc>(
  'PlayerGeneralSlots',
  playerGeneralSlotsSchema,
);
