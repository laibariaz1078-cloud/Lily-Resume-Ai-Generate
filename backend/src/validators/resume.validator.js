"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeListQuerySchema = exports.resumeUpdateSchema = exports.resumeCreateSchema = void 0;
const zod_1 = require("zod");
const resumeData = zod_1.z.record(zod_1.z.unknown()).superRefine((value, context) => {
    if (Object.keys(value).length > 80) {
        context.addIssue({ code: 'custom', message: 'Resume contains too many top-level fields' });
    }
    if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 100_000) {
        context.addIssue({ code: 'custom', message: 'Resume data cannot exceed 100 KB' });
    }
});
exports.resumeCreateSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(120),
    data: resumeData.optional(),
    favorite: zod_1.z.boolean().default(false),
    templateId: zod_1.z.string().trim().min(1).max(120).nullable().optional(),
}).strict();
exports.resumeUpdateSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(120).optional(),
    data: resumeData.optional(),
    favorite: zod_1.z.boolean().optional(),
    templateId: zod_1.z.string().trim().min(1).max(120).nullable().optional(),
}).strict().refine((input) => Object.keys(input).length > 0, 'Provide at least one resume field to update');
exports.resumeListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    favorite: zod_1.z.enum(['true', 'false']).optional(),
});
