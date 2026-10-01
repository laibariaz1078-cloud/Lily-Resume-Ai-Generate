import type { RequestHandler } from 'express';
import { AIUsage } from '../models/ai-usage.model';
import { ResumeAnalysis } from '../models/resume-analysis.model';
import { aiService } from '../services/ai.service';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import type { AnalyzeJobInput, MatchResumeInput, TailorJobInput } from '../validators/job.validator';
import { resumeService } from '../services/resume.service';

export const analyzeJob: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const result = await aiService.analyzeJobDescription(req.body as AnalyzeJobInput);
  await AIUsage.create({ userId: req.authUser.id, operation: 'job-analyze', tokensUsed: result.tokensUsed });
  sendSuccess(res, 200, 'Job description analyzed', result.data);
};

function validateMatchEvidence(result: Awaited<ReturnType<typeof aiService.matchResumeToJob>>['data'], resume: Record<string, unknown>): void {
  const source = JSON.stringify(resume).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const evidence = [
    ...result.matchingSkills.map((item) => item.evidence),
    ...result.relevantExperience.map((item) => item.evidence),
  ];
  if (evidence.some((item) => {
    const normalized = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    return !normalized || !source.includes(normalized);
  })) {
    throw new ApiError(502, 'AI service returned unverifiable resume evidence');
  }
}

export const matchResume: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const input = req.body as MatchResumeInput;
  const resume = await resumeService.get(req.authUser.id, input.resumeId);
  if (resume.expiration.isExpired) throw new ApiError(410, 'This resume has expired');
  const result = await aiService.matchResumeToJob({ ...input, resume: resume.data });
  validateMatchEvidence(result.data, resume.data);
  await Promise.all([
    AIUsage.create({ userId: req.authUser.id, operation: 'job-match', tokensUsed: result.tokensUsed }),
    ResumeAnalysis.create({ userId: req.authUser.id, resumeId: input.resumeId, type: 'JOB_MATCH', result: result.data }),
  ]);
  sendSuccess(res, 200, 'Resume matched to job description', result.data);
};

export const tailorResume: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const input = req.body as TailorJobInput;
  const resume = await resumeService.get(req.authUser.id, input.resumeId);
  if (resume.expiration.isExpired) throw new ApiError(410, 'This resume has expired');
  const result = await aiService.tailorResumeToJob({ resume: resume.data, jobDescription: input.jobDescription });
  await Promise.all([
    AIUsage.create({ userId: req.authUser.id, operation: 'job-tailor', tokensUsed: result.tokensUsed }),
    ResumeAnalysis.create({ userId: req.authUser.id, resumeId: input.resumeId, type: 'CONTENT', result: result.data }),
  ]);
  sendSuccess(res, 200, 'Tailored resume suggestions generated', result.data);
};