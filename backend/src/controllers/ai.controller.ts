import type { RequestHandler } from 'express';
import { AIUsage } from '../models/ai-usage.model';
import { ResumeAnalysis } from '../models/resume-analysis.model';
import { aiService } from '../services/ai.service';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import type { AnalyzeResumeInput, ChatInput, GenerateInput, ImproveInput, SuggestionsInput, TailorInput } from '../validators/ai.validator';
import { resumeService } from '../services/resume.service';

async function respond<T>(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], operation: string, run: () => Promise<{ data: T; tokensUsed: number | null }>): Promise<void> {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const result = await run();
  await AIUsage.create({ userId: req.authUser.id, operation, tokensUsed: result.tokensUsed });
  sendSuccess(res, 200, 'AI request completed', result.data);
}

export const generate: RequestHandler = async (req, res) => respond(req, res, 'generate', () => aiService.generateResumeContent(req.body as GenerateInput));
export const improve: RequestHandler = async (req, res) => {
  const input = req.body as ImproveInput;
  return respond(req, res, 'improve', async () => {
    const result = await aiService.improveSection(input);
    return {
      ...result,
      data: {
        originalContent: input.currentContent,
        improvedContent: result.data.improvedContent,
        before: input.currentContent,
        after: result.data.improvedContent,
        explanation: result.data.explanation,
        reason: result.data.explanation,
        actionType: 'UPDATE' as const,
        suggestions: result.data.suggestions,
      },
    };
  });
};
export const suggestions: RequestHandler = async (req, res) => respond(req, res, 'suggestions', () => aiService.generateSuggestions(req.body as SuggestionsInput));
export const chat: RequestHandler = async (req, res) => respond(req, res, 'chat', () => aiService.chatWithResumeAssistant(req.body as ChatInput));
export const analyzeResume: RequestHandler = async (req, res) => {
  const input = req.body as AnalyzeResumeInput;
  return respond(req, res, 'analyze-resume', async () => {
    let resume = input.resume;
    if (input.resumeId && req.authUser) resume = (await resumeService.get(req.authUser.id, input.resumeId)).data;
    const result = await aiService.analyzeResume({ ...input, resume });
    if (input.resumeId && req.authUser) {
      await ResumeAnalysis.create({ userId: req.authUser.id, resumeId: input.resumeId, type: 'GENERAL', result: result.data });
    }
    return result;
  });
};
export const tailor: RequestHandler = async (req, res) => respond(req, res, 'tailor', () => aiService.tailorResumeToJob(req.body as TailorInput));