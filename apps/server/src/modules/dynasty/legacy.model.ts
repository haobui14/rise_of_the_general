import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface PlayerLegacyDoc extends Document {
  playerId: Types.ObjectId;
  dynastiesCompleted: number;
  permanentBonuses: {
    powerMultiplier: number;
  };
  completedAt: Date[];
}

const playerLegacySchema = new Schema<PlayerLegacyDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, unique: true },
  dynastiesCompleted: { type: Number, default: 0 },
  permanentBonuses: {
    powerMultiplier: { type: Number, default: 1.0 },
  },
  completedAt: [{ type: Date }],
});

export const PlayerLegacy = mongoose.model<PlayerLegacyDoc>('PlayerLegacy', playerLegacySchema);
