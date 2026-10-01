import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface ResumeDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  data: Record<string, unknown>;
  favorite: boolean;
  templateId: string | null;
  isPermanent: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<ResumeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    data: { type: Schema.Types.Mixed, required: true },
    favorite: { type: Boolean, default: false },
    templateId: { type: String, default: null, maxlength: 120 },
    isPermanent: { type: Boolean, default: false, required: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

resumeSchema.index({ userId: 1, updatedAt: -1 });
resumeSchema.index({ userId: 1, title: 1 });
resumeSchema.index({ userId: 1, favorite: 1 });
resumeSchema.index({ userId: 1, expiresAt: 1 });

export const Resume = models.Resume || model<ResumeDocument>('Resume', resumeSchema);