import { z } from 'zod';

const resumeData = z.record(z.unknown()).superRefine((value, context) => {
  if (Object.keys(value).length > 80) {
    context.addIssue({ code: 'custom', message: 'Resume contains too many top-level fields' });
  }
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 100_000) {
    context.addIssue({ code: 'custom', message: 'Resume data cannot exceed 100 KB' });
  }
});

export const resumeCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  data: resumeData,
  favorite: z.boolean().default(false),
  templateId: z.string().trim().min(1).max(120).nullable().optional(),
}).strict();

export const resumeUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  data: resumeData.optional(),
  favorite: z.boolean().optional(),
  templateId: z.string().trim().min(1).max(120).nullable().optional(),
}).strict().refine((input) => Object.keys(input).length > 0, 'Provide at least one resume field to update');

export const resumeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  favorite: z.enum(['true', 'false']).optional(),
});

export type ResumeCreateInput = z.infer<typeof resumeCreateSchema>;
export type ResumeUpdateInput = z.infer<typeof resumeUpdateSchema>;