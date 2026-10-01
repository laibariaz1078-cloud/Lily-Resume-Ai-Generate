import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface ResumeVersionDocument extends Document {
  resumeId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  data: Record<string, unknown>;
  favorite: boolean;
  templateId: string | null;
  createdAt: Date;
}

const resumeVersionSchema = new Schema<ResumeVersionDocument>(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 120 },
    data: { type: Schema.Types.Mixed, required: true },
    favorite: { type: Boolean, required: true },
    templateId: { type: String, default: null, maxlength: 120 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

resumeVersionSchema.index({ resumeId: 1, userId: 1, createdAt: -1 });

export const ResumeVersion = models.ResumeVersion || model<ResumeVersionDocument>('ResumeVersion', resumeVersionSchema);