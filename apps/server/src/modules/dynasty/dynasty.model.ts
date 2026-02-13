import mongoose, { Schema, type Document } from 'mongoose';

export interface DynastyDoc extends Document {
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: Date;
}

const dynastySchema = new Schema<DynastyDoc>(
  {
    name: { type: String, required: true, unique: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Dynasty = mongoose.model<DynastyDoc>('Dynasty', dynastySchema);
