import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { CampaignStatus } from '@rotg/shared-types';

export interface PlayerCampaignDoc extends Document {
  playerId: Types.ObjectId;
  campaignId: Types.ObjectId;
  territoriesCaptured: Types.ObjectId[];
  generalsDefeated: number;
  generalsDefeatedLog: string[];
  status: CampaignStatus;
  startedAt: Date;
  completedAt: Date | null;
}

const playerCampaignSchema = new Schema<PlayerCampaignDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  territoriesCaptured: [{ type: Schema.Types.ObjectId, ref: 'Territory' }],
  generalsDefeated: { type: Number, default: 0 },
  generalsDefeatedLog: [{ type: String }],
  status: { type: String, enum: ['active', 'won', 'lost'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

playerCampaignSchema.index({ playerId: 1, status: 1 });

export const PlayerCampaign = mongoose.model<PlayerCampaignDoc>(
  'PlayerCampaign',
  playerCampaignSchema,
);
