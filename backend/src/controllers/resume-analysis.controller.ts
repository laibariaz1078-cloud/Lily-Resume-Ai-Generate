import type { RequestHandler } from 'express';
import { ResumeAnalysis } from '../models/resume-analysis.model';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { z } from 'zod';
import { resumeService } from '../services/resume.service';

const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const getResumeAnalysisHistory: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const parsedQuery = historyQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    throw new ApiError(400, 'Request validation failed', parsedQuery.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'query',
      message: issue.message,
    })));
  }
  const resumeId = typeof req.params.id === 'string' ? req.params.id : '';
  if (!resumeId || resumeId.length > 120) throw new ApiError(400, 'Invalid resume identifier');
  await resumeService.get(req.authUser.id, resumeId);
  const { page, limit } = parsedQuery.data;
  const filter = { userId: req.authUser.id, resumeId };
  const [items, total] = await Promise.all([
    ResumeAnalysis.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    ResumeAnalysis.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Resume analysis history retrieved', {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};