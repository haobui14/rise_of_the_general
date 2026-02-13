import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface PlayerInventoryDoc extends Document {
  playerId: Types.ObjectId;
  items: Array<{
    itemId: Types.ObjectId;
    equipped: boolean;
  }>;
}

const playerInventorySchema = new Schema<PlayerInventoryDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, unique: true },
  items: [
    {
      itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
      equipped: { type: Boolean, default: false },
    },
  ],
});

export const PlayerInventory = mongoose.model<PlayerInventoryDoc>(
  'PlayerInventory',
  playerInventorySchema,
);
