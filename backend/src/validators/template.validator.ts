import { z } from 'zod';

export const TEMPLATE_CATEGORIES = ['ATS', 'Modern', 'Minimal', 'Professional', 'Creative', 'Executive', 'Academic', 'Tech'] as const;
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const templateSpecSchema = z.object({
  layout: z.object({
    columns: z.enum(['single', 'two']),
    pageSize: z.enum(['A4', 'Letter']),
  }),
  typography: z.object({
    headingFont: z.string().trim().min(1).max(80),
    bodyFont: z.string().trim().min(1).max(80),
    baseFontSize: z.number().min(8).max(20),
    headingScale: z.number().min(0.8).max(2),
    lineHeight: z.number().min(1).max(2.5),
  }),
  spacing: z.object({
    density: z.enum(['compact', 'standard', 'relaxed']),
    sectionGap: z.number().min(0).max(50),
    lineGap: z.number().min(0).max(30),
  }),
  colors: z.object({
    primary: hexColor,
    accent: hexColor,
    text: hexColor,
    muted: hexColor,
    background: hexColor,
  }),
  sectionOrder: z.array(z.string().trim().min(1).max(50)).min(1).max(30),
  headerStyle: z.enum(['classic', 'centered', 'left-aligned', 'compact']),
  sidebar: z.object({
    enabled: z.boolean(),
    position: z.enum(['left', 'right']),
    widthPercent: z.number().min(15).max(45),
  }),
  borders: z.object({
    style: z.enum(['none', 'subtle', 'strong']),
    color: hexColor,
  }),
  icons: z.enum(['none', 'minimal', 'line', 'solid']),
});

export const templateCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(1000).default(''),
  category: z.enum(TEMPLATE_CATEGORIES),
  previewImage: z.string().url().max(2048).nullable().default(null),
  templateSpec: templateSpecSchema,
  supportedSections: z.array(z.string().trim().min(1).max(50)).min(1).max(30),
  isPremium: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const templateUpdateSchema = templateCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one template field must be provided',
});

export const templateParamsSchema = z.object({ id: z.string().trim().min(1).max(120) });
export const templateCategorySchema = z.object({ category: z.string().trim().toLowerCase() });
export const templateListQuerySchema = z.object({
  category: z.string().trim().optional(),
  premium: z.enum(['true', 'false']).optional(),
  free: z.enum(['true', 'false']).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'name-asc', 'name-desc', 'relevance']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const generateTemplateConceptSchema = z.object({
  style: z.string().trim().min(1).max(100),
  industry: z.string().trim().max(100).optional(),
  preferences: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  colorPreferences: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  layoutPreferences: z.array(z.string().trim().min(1).max(100)).max(10).default([]),
});

export type TemplateSpec = z.infer<typeof templateSpecSchema>;
export type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
export type GenerateTemplateConceptInput = z.input<typeof generateTemplateConceptSchema>;