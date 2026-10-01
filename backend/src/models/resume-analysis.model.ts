import { Schema, model, models, type Document, type Types } from 'mongoose';

export const RESUME_ANALYSIS_TYPES = ['GENERAL', 'ATS', 'JOB_MATCH', 'CONTENT'] as const;
export type ResumeAnalysisType = (typeof RESUME_ANALYSIS_TYPES)[number];

export interface ResumeAnalysisDocument extends Document {
  userId: Types.ObjectId;
  resumeId: string;
  type: ResumeAnalysisType;
  result: Record<string, unknown>;
  createdAt: Date;
}

const resumeAnalysisSchema = new Schema<ResumeAnalysisDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resumeId: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: RESUME_ANALYSIS_TYPES, required: true },
    result: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

resumeAnalysisSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const ResumeAnalysis = models.ResumeAnalysis || model<ResumeAnalysisDocument>('ResumeAnalysis', resumeAnalysisSchema);