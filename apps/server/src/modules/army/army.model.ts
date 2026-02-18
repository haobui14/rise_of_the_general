import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface PlayerArmyDoc extends Document {
  playerId: Types.ObjectId;
  troopCount: number;
  morale: number;
  formation: string;
  troopType: string;
}

const playerArmySchema = new Schema<PlayerArmyDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, unique: true },
  troopCount: { type: Number, default: 0 },
  morale: { type: Number, default: 50, min: 0, max: 100 },
  formation: { type: String, default: 'line', enum: ['line', 'wedge', 'phalanx', 'skirmish'] },
  troopType: { type: String, default: 'infantry', enum: ['infantry', 'cavalry', 'archer'] },
});

export const PlayerArmy = mongoose.model<PlayerArmyDoc>('PlayerArmy', playerArmySchema);
