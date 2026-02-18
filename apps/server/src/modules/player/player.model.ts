import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface PlayerDoc extends Document {
  username: string;
  dynastyId: Types.ObjectId;
  factionId: Types.ObjectId;
  currentRankId: Types.ObjectId;
  level: number;
  experience: number;
  merit: number;
  gold: number;
  stats: {
    strength: number;
    defense: number;
    strategy: number;
    speed: number;
    leadership: number;
  };
  isAlive: boolean;
  warExhaustion: number;
  activeCharacterId?: Types.ObjectId;
  politicalTurns: number;
  successionPending: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<PlayerDoc>(
  {
    username: { type: String, required: true, unique: true },
    dynastyId: { type: Schema.Types.ObjectId, ref: 'Dynasty', required: true },
    factionId: { type: Schema.Types.ObjectId, ref: 'Faction', required: true },
    currentRankId: { type: Schema.Types.ObjectId, ref: 'RankDefinition', required: true },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    merit: { type: Number, default: 0 },
    gold: { type: Number, default: 100 },
    stats: {
      strength: { type: Number, default: 5 },
      defense: { type: Number, default: 5 },
      strategy: { type: Number, default: 5 },
      speed: { type: Number, default: 5 },
      leadership: { type: Number, default: 1 },
    },
    isAlive: { type: Boolean, default: true },
    warExhaustion: { type: Number, default: 0, min: 0, max: 100 },
    activeCharacterId: { type: Schema.Types.ObjectId, ref: 'PlayerCharacter', default: null },
    politicalTurns: { type: Number, default: 3, min: 0 },
    successionPending: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Player = mongoose.model<PlayerDoc>('Player', playerSchema);
