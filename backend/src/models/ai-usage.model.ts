import { Schema, model, models, type Types, type Document } from 'mongoose';

export interface AIUsageDocument extends Document {
  userId: Types.ObjectId;
  operation: string;
  tokensUsed: number | null;
  createdAt: Date;
}

const aiUsageSchema = new Schema<AIUsageDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    operation: { type: String, required: true, maxlength: 50 },
    tokensUsed: { type: Number, min: 0, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

aiUsageSchema.index({ userId: 1, createdAt: -1 });

export const AIUsage = models.AIUsage || model<AIUsageDocument>('AIUsage', aiUsageSchema);