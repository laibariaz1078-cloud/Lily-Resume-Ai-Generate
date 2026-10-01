import { Router } from 'express';
import { analyzeJob, matchResume, tailorResume } from '../controllers/jobs.controller';
import { aiRateLimit } from '../middleware/ai-rate-limit.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { aiUsageLimit } from '../middleware/ai-usage-limit.middleware';
import { requirePlan } from '../middleware/require-plan.middleware';
import { validateBody } from '../middleware/validate-body';
import { analyzeJobSchema, matchResumeSchema, tailorJobSchema } from '../validators/job.validator';

export const jobsRouter = Router();
jobsRouter.use(authMiddleware, aiRateLimit, aiUsageLimit);
jobsRouter.post('/analyze', validateBody(analyzeJobSchema), analyzeJob);
jobsRouter.post('/match-resume', validateBody(matchResumeSchema), matchResume);
jobsRouter.post('/tailor', requirePlan('PREMIUM'), validateBody(tailorJobSchema), tailorResume);