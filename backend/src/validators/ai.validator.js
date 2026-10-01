"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tailorSchema = exports.analyzeResumeSchema = exports.chatSchema = exports.suggestionsSchema = exports.improveSchema = exports.generateSchema = void 0;
const zod_1 = require("zod");
const nonEmpty = zod_1.z.string().trim().min(1).max(12000);
exports.generateSchema = zod_1.z.object({
    education: zod_1.z.unknown().optional(),
    workExperience: zod_1.z.unknown().optional(),
    experience: zod_1.z.unknown().optional(),
    skills: zod_1.z.unknown().optional(),
    projects: zod_1.z.unknown().optional(),
    achievements: zod_1.z.unknown().optional(),
    targetRole: zod_1.z.string().trim().max(200).optional(),
}).passthrough();
exports.improveSchema = zod_1.z.object({
    resumeId: zod_1.z.string().trim().max(100).optional(),
    section: nonEmpty,
    currentContent: nonEmpty,
    requestedOperation: zod_1.z.enum(['improve', 'professional', 'shorten', 'expand', 'simplify', 'ATS-friendly', 'grammar', 'rewrite']),
});
exports.suggestionsSchema = zod_1.z.object({
    resume: zod_1.z.record(zod_1.z.unknown()),
});
exports.chatSchema = zod_1.z.object({
    message: nonEmpty,
    resume: zod_1.z.record(zod_1.z.unknown()),
});
exports.analyzeResumeSchema = zod_1.z.object({
    resumeId: zod_1.z.string().trim().min(1).max(120).optional(),
    resume: zod_1.z.record(zod_1.z.unknown()),
});
exports.tailorSchema = zod_1.z.object({
    resume: zod_1.z.record(zod_1.z.unknown()),
    jobDescription: nonEmpty,
});
