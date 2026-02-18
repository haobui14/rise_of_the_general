import mongoose, { Schema, type Document } from 'mongoose';

export interface DynastyDoc extends Document {
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  timeline: 'historical' | 'divergent';
  createdAt: Date;
}

const dynastySchema = new Schema<DynastyDoc>(
  {
    name: { type: String, required: true, unique: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    timeline: { type: String, enum: ['historical', 'divergent'], default: 'historical' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Dynasty = mongoose.model<DynastyDoc>('Dynasty', dynastySchema);
