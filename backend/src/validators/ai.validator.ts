import { z } from 'zod';

const nonEmpty = z.string().trim().min(1).max(12000);

export const generateSchema = z.object({
  education: z.unknown().optional(),
  workExperience: z.unknown().optional(),
  experience: z.unknown().optional(),
  skills: z.unknown().optional(),
  projects: z.unknown().optional(),
  achievements: z.unknown().optional(),
  targetRole: z.string().trim().max(200).optional(),
}).passthrough();

export const improveSchema = z.object({
  resumeId: z.string().trim().max(100).optional(),
  section: nonEmpty,
  currentContent: nonEmpty,
  requestedOperation: z.enum(['improve', 'professional', 'shorten', 'expand', 'simplify', 'ATS-friendly', 'grammar', 'rewrite']),
});

export const suggestionsSchema = z.object({
  resume: z.record(z.unknown()),
});

export const chatSchema = z.object({
  message: nonEmpty,
  resume: z.record(z.unknown()),
});

export const analyzeResumeSchema = z.object({
  resumeId: z.string().trim().min(1).max(120).optional(),
  resume: z.record(z.unknown()),
});

export const tailorSchema = z.object({
  resume: z.record(z.unknown()),
  jobDescription: nonEmpty,
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type ImproveInput = z.infer<typeof improveSchema>;
export type SuggestionsInput = z.infer<typeof suggestionsSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type AnalyzeResumeInput = z.infer<typeof analyzeResumeSchema>;
export type TailorInput = z.infer<typeof tailorSchema>;