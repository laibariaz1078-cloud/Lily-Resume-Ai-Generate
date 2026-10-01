import { z } from 'zod';

const jobDescription = z.string().trim().min(50, 'Job description must contain at least 50 characters').max(12000);

export const analyzeJobSchema = z.object({ jobDescription });

export const matchResumeSchema = z.object({
  resumeId: z.string().trim().min(1).max(120),
  jobDescription,
});

export const tailorJobSchema = z.object({
  resumeId: z.string().trim().min(1).max(120),
  jobDescription,
});

export type AnalyzeJobInput = z.infer<typeof analyzeJobSchema>;
export type MatchResumeInput = z.infer<typeof matchResumeSchema>;
export type TailorJobInput = z.infer<typeof tailorJobSchema>;
export type MatchResumeContextInput = MatchResumeInput & { resume: Record<string, unknown> };