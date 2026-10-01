"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResumeAnalysisHistory = void 0;
const resume_analysis_model_1 = require("../models/ResumeAnalysis");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
const zod_1 = require("zod");
const resume_service_1 = require("../services/resume.service");
const historyQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
const getResumeAnalysisHistory = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const parsedQuery = historyQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        throw new api_error_1.ApiError(400, 'Request validation failed', parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'query',
            message: issue.message,
        })));
    }
    const resumeId = typeof req.params.id === 'string' ? req.params.id : '';
    if (!resumeId || resumeId.length > 120)
        throw new api_error_1.ApiError(400, 'Invalid resume identifier');
    await resume_service_1.resumeService.get(req.authUser.id, resumeId);
    const { page, limit } = parsedQuery.data;
    const filter = { userId: req.authUser.id, resumeId };
    const [items, total] = await Promise.all([
        resume_analysis_model_1.ResumeAnalysis.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
        resume_analysis_model_1.ResumeAnalysis.countDocuments(filter),
    ]);
    (0, api_response_1.sendSuccess)(res, 200, 'Resume analysis history retrieved', {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
};
exports.getResumeAnalysisHistory = getResumeAnalysisHistory;
