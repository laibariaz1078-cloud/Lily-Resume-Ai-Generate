"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tailor = exports.analyzeResume = exports.chat = exports.suggestions = exports.improve = exports.generate = void 0;
const ai_usage_model_1 = require("../models/AIUsage");
const resume_analysis_model_1 = require("../models/ResumeAnalysis");
const ai_service_1 = require("../services/ai.service");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
const resume_service_1 = require("../services/resume.service");
async function respond(req, res, operation, run) {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const result = await run();
    await ai_usage_model_1.AIUsage.create({ userId: req.authUser.id, operation, tokensUsed: result.tokensUsed });
    (0, api_response_1.sendSuccess)(res, 200, 'AI request completed', result.data);
}
const generate = async (req, res) => respond(req, res, 'generate', () => ai_service_1.aiService.generateResumeContent(req.body));
exports.generate = generate;
const improve = async (req, res) => {
    const input = req.body;
    return respond(req, res, 'improve', async () => {
        const result = await ai_service_1.aiService.improveSection(input);
        return {
            ...result,
            data: {
                originalContent: input.currentContent,
                improvedContent: result.data.improvedContent,
                before: input.currentContent,
                after: result.data.improvedContent,
                explanation: result.data.explanation,
                reason: result.data.explanation,
                actionType: 'UPDATE',
                suggestions: result.data.suggestions,
            },
        };
    });
};
exports.improve = improve;
const suggestions = async (req, res) => respond(req, res, 'suggestions', () => ai_service_1.aiService.generateSuggestions(req.body));
exports.suggestions = suggestions;
const chat = async (req, res) => respond(req, res, 'chat', () => ai_service_1.aiService.chatWithResumeAssistant(req.body));
exports.chat = chat;
const analyzeResume = async (req, res) => {
    const input = req.body;
    return respond(req, res, 'analyze-resume', async () => {
        let resume = input.resume;
        if (input.resumeId && req.authUser)
            resume = (await resume_service_1.resumeService.get(req.authUser.id, input.resumeId)).data;
        const result = await ai_service_1.aiService.analyzeResume({ ...input, resume });
        if (input.resumeId && req.authUser) {
            await resume_analysis_model_1.ResumeAnalysis.create({ userId: req.authUser.id, resumeId: input.resumeId, type: 'GENERAL', result: result.data });
        }
        return result;
    });
};
exports.analyzeResume = analyzeResume;
const tailor = async (req, res) => respond(req, res, 'tailor', () => ai_service_1.aiService.tailorResumeToJob(req.body));
exports.tailor = tailor;
