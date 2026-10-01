"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tailorResume = exports.matchResume = exports.analyzeJob = void 0;
const ai_usage_model_1 = require("../models/AIUsage");
const resume_analysis_model_1 = require("../models/ResumeAnalysis");
const ai_service_1 = require("../services/ai.service");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
const resume_service_1 = require("../services/resume.service");
const analyzeJob = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const result = await ai_service_1.aiService.analyzeJobDescription(req.body);
    await ai_usage_model_1.AIUsage.create({ userId: req.authUser.id, operation: 'job-analyze', tokensUsed: result.tokensUsed });
    (0, api_response_1.sendSuccess)(res, 200, 'Job description analyzed', result.data);
};
exports.analyzeJob = analyzeJob;
function validateMatchEvidence(result, resume) {
    const source = JSON.stringify(resume).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const evidence = [
        ...result.matchingSkills.map((item) => item.evidence),
        ...result.relevantExperience.map((item) => item.evidence),
    ];
    if (evidence.some((item) => {
        const normalized = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        return !normalized || !source.includes(normalized);
    })) {
        throw new api_error_1.ApiError(502, 'AI service returned unverifiable resume evidence');
    }
}
const matchResume = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const input = req.body;
    const resume = await resume_service_1.resumeService.get(req.authUser.id, input.resumeId);
    if (resume.expiration.isExpired)
        throw new api_error_1.ApiError(410, 'This resume has expired');
    const result = await ai_service_1.aiService.matchResumeToJob({ ...input, resume: resume.data });
    validateMatchEvidence(result.data, resume.data);
    await Promise.all([
        ai_usage_model_1.AIUsage.create({ userId: req.authUser.id, operation: 'job-match', tokensUsed: result.tokensUsed }),
        resume_analysis_model_1.ResumeAnalysis.create({ userId: req.authUser.id, resumeId: input.resumeId, type: 'JOB_MATCH', result: result.data }),
    ]);
    (0, api_response_1.sendSuccess)(res, 200, 'Resume matched to job description', result.data);
};
exports.matchResume = matchResume;
const tailorResume = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const input = req.body;
    const resume = await resume_service_1.resumeService.get(req.authUser.id, input.resumeId);
    if (resume.expiration.isExpired)
        throw new api_error_1.ApiError(410, 'This resume has expired');
    const result = await ai_service_1.aiService.tailorResumeToJob({ resume: resume.data, jobDescription: input.jobDescription });
    await Promise.all([
        ai_usage_model_1.AIUsage.create({ userId: req.authUser.id, operation: 'job-tailor', tokensUsed: result.tokensUsed }),
        resume_analysis_model_1.ResumeAnalysis.create({ userId: req.authUser.id, resumeId: input.resumeId, type: 'CONTENT', result: result.data }),
    ]);
    (0, api_response_1.sendSuccess)(res, 200, 'Tailored resume suggestions generated', result.data);
};
exports.tailorResume = tailorResume;
