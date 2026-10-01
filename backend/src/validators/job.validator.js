"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tailorJobSchema = exports.matchResumeSchema = exports.analyzeJobSchema = void 0;
const zod_1 = require("zod");
const jobDescription = zod_1.z.string().trim().min(50, 'Job description must contain at least 50 characters').max(12000);
exports.analyzeJobSchema = zod_1.z.object({ jobDescription });
exports.matchResumeSchema = zod_1.z.object({
    resumeId: zod_1.z.string().trim().min(1).max(120),
    jobDescription,
});
exports.tailorJobSchema = zod_1.z.object({
    resumeId: zod_1.z.string().trim().min(1).max(120),
    jobDescription,
});
