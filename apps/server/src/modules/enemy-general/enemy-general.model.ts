import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface EnemyGeneralDoc extends Document {
  name: string;
  factionId: Types.ObjectId;
  territoryId: Types.ObjectId;
  level: number;
  powerMultiplier: number;
  alive: boolean;
  canRetreat: boolean;
}

const enemyGeneralSchema = new Schema<EnemyGeneralDoc>({
  name: { type: String, required: true, unique: true },
  factionId: { type: Schema.Types.ObjectId, ref: 'Faction', required: true },
  territoryId: { type: Schema.Types.ObjectId, ref: 'Territory', required: true },
  level: { type: Number, default: 1 },
  powerMultiplier: { type: Number, default: 1.1 },
  alive: { type: Boolean, default: true },
  canRetreat: { type: Boolean, default: false },
});

enemyGeneralSchema.index({ territoryId: 1, alive: 1 });

export const EnemyGeneral = mongoose.model<EnemyGeneralDoc>('EnemyGeneral', enemyGeneralSchema);
