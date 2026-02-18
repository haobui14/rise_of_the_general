import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface CampaignDoc extends Document {
  name: string;
  dynastyId: Types.ObjectId;
  startingTerritoryId: Types.ObjectId;
  victoryConditions: {
    territoriesRequired: number;
    generalsDefeated: number;
  };
}

const campaignSchema = new Schema<CampaignDoc>({
  name: { type: String, required: true, unique: true },
  dynastyId: { type: Schema.Types.ObjectId, ref: 'Dynasty', required: true },
  startingTerritoryId: { type: Schema.Types.ObjectId, ref: 'Territory', required: true },
  victoryConditions: {
    territoriesRequired: { type: Number, required: true },
    generalsDefeated: { type: Number, required: true },
  },
});

export const Campaign = mongoose.model<CampaignDoc>('Campaign', campaignSchema);
