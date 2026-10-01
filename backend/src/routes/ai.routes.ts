import { Router } from 'express';
import { analyzeResume, chat, generate, improve, suggestions, tailor } from '../controllers/ai.controller';
import { aiRateLimit } from '../middleware/ai-rate-limit.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { aiUsageLimit } from '../middleware/ai-usage-limit.middleware';
import { requirePlan } from '../middleware/require-plan.middleware';
import { validateBody } from '../middleware/validate-body';
import { analyzeResumeSchema, chatSchema, generateSchema, improveSchema, suggestionsSchema, tailorSchema } from '../validators/ai.validator';

export const aiRouter = Router();
aiRouter.use(authMiddleware, aiRateLimit, aiUsageLimit);
aiRouter.post('/generate', validateBody(generateSchema), generate);
aiRouter.post('/improve', validateBody(improveSchema), improve);
aiRouter.post('/suggestions', validateBody(suggestionsSchema), suggestions);
aiRouter.post('/chat', validateBody(chatSchema), chat);
aiRouter.post('/analyze-resume', validateBody(analyzeResumeSchema), analyzeResume);
aiRouter.post('/tailor', requirePlan('PREMIUM'), validateBody(tailorSchema), tailor);