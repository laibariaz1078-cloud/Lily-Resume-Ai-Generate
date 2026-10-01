"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTemplateConceptSchema = exports.templateListQuerySchema = exports.templateCategorySchema = exports.templateParamsSchema = exports.templateUpdateSchema = exports.templateCreateSchema = exports.templateSpecSchema = exports.TEMPLATE_CATEGORIES = void 0;
const zod_1 = require("zod");
exports.TEMPLATE_CATEGORIES = ['ATS', 'Modern', 'Minimal', 'Professional', 'Creative', 'Executive', 'Academic', 'Tech'];
const hexColor = zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/);
exports.templateSpecSchema = zod_1.z.object({
    layout: zod_1.z.object({
        columns: zod_1.z.enum(['single', 'two']),
        pageSize: zod_1.z.enum(['A4', 'Letter']),
    }),
    typography: zod_1.z.object({
        headingFont: zod_1.z.string().trim().min(1).max(80),
        bodyFont: zod_1.z.string().trim().min(1).max(80),
        baseFontSize: zod_1.z.number().min(8).max(20),
        headingScale: zod_1.z.number().min(0.8).max(2),
        lineHeight: zod_1.z.number().min(1).max(2.5),
    }),
    spacing: zod_1.z.object({
        density: zod_1.z.enum(['compact', 'standard', 'relaxed']),
        sectionGap: zod_1.z.number().min(0).max(50),
        lineGap: zod_1.z.number().min(0).max(30),
    }),
    colors: zod_1.z.object({
        primary: hexColor,
        accent: hexColor,
        text: hexColor,
        muted: hexColor,
        background: hexColor,
    }),
    sectionOrder: zod_1.z.array(zod_1.z.string().trim().min(1).max(50)).min(1).max(30),
    headerStyle: zod_1.z.enum(['classic', 'centered', 'left-aligned', 'compact']),
    sidebar: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        position: zod_1.z.enum(['left', 'right']),
        widthPercent: zod_1.z.number().min(15).max(45),
    }),
    borders: zod_1.z.object({
        style: zod_1.z.enum(['none', 'subtle', 'strong']),
        color: hexColor,
    }),
    icons: zod_1.z.enum(['none', 'minimal', 'line', 'solid']),
});
exports.templateCreateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(100),
    slug: zod_1.z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: zod_1.z.string().trim().max(1000).optional(),
    category: zod_1.z.enum(exports.TEMPLATE_CATEGORIES),
    previewImage: zod_1.z.string().url().max(2048).nullable().optional(),
    templateSpec: exports.templateSpecSchema,
    supportedSections: zod_1.z.array(zod_1.z.string().trim().min(1).max(50)).max(30).default([]),
    isPremium: zod_1.z.boolean().default(false),
    isActive: zod_1.z.boolean().default(true),
});
exports.templateUpdateSchema = exports.templateCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one template field must be provided',
});
exports.templateParamsSchema = zod_1.z.object({ id: zod_1.z.string().trim().min(1).max(120) });
exports.templateCategorySchema = zod_1.z.object({ category: zod_1.z.string().trim().toLowerCase() });
exports.templateListQuerySchema = zod_1.z.object({
    category: zod_1.z.string().trim().optional(),
    premium: zod_1.z.enum(['true', 'false']).optional(),
    free: zod_1.z.enum(['true', 'false']).optional(),
    search: zod_1.z.string().trim().max(100).optional(),
    sort: zod_1.z.enum(['newest', 'name-asc', 'name-desc', 'relevance']).default('newest'),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.generateTemplateConceptSchema = zod_1.z.object({
    style: zod_1.z.string().trim().min(1).max(100),
    industry: zod_1.z.string().trim().max(100).optional(),
    preferences: zod_1.z.array(zod_1.z.string().trim().min(1).max(200)).max(20).default([]),
    colorPreferences: zod_1.z.array(zod_1.z.string().trim().min(1).max(80)).max(10).default([]),
    layoutPreferences: zod_1.z.array(zod_1.z.string().trim().min(1).max(100)).max(10).default([]),
});
