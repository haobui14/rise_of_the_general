import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface PlayerGeneralDoc extends Document {
  playerId: Types.ObjectId;
  generalId: Types.ObjectId;
  relationship: number;
  recruited: boolean;
  recruitedAt: Date | null;
}

const playerGeneralSchema = new Schema<PlayerGeneralDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
  generalId: { type: Schema.Types.ObjectId, ref: 'General', required: true },
  relationship: { type: Number, default: 0 },
  recruited: { type: Boolean, default: false },
  recruitedAt: { type: Date, default: null },
});

playerGeneralSchema.index({ playerId: 1, generalId: 1 }, { unique: true });

export const PlayerGeneral = mongoose.model<PlayerGeneralDoc>('PlayerGeneral', playerGeneralSchema);
