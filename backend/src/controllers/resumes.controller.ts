import mongoose from 'mongoose';
import type { RequestHandler } from 'express';
import { ResumeAnalysis } from '../models/resume-analysis.model';
import { exportResumePdf } from '../services/pdf.service';
import { resumeService } from '../services/resume.service';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { resumeListQuerySchema } from '../validators/resume.validator';
import { z } from 'zod';

const pageQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });

function userId(req: Parameters<RequestHandler>[0]): string {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  return req.authUser.id;
}

function routeId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) throw new ApiError(400, 'Invalid resume identifier');
  return value;
}

export const listResumes: RequestHandler = async (req, res) => {
  const parsed = resumeListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Request validation failed', parsed.error.issues.map((issue) => ({ field: issue.path.join('.') || 'query', message: issue.message })));
  const result = await resumeService.list(userId(req), parsed.data);
  sendSuccess(res, 200, 'Resumes retrieved', result);
};

export const getResume: RequestHandler = async (req, res) => {
  const resume = await resumeService.get(userId(req), routeId(req.params.id));
  sendSuccess(res, 200, 'Resume retrieved', { resume });
};

export const createResume: RequestHandler = async (req, res) => {
  const resume = await resumeService.create(userId(req), req.body);
  sendSuccess(res, 201, 'Resume created', { resume });
};

export const updateResume: RequestHandler = async (req, res) => {
  const resume = await resumeService.update(userId(req), routeId(req.params.id), req.body);
  sendSuccess(res, 200, 'Resume updated', { resume });
};

export const deleteResume: RequestHandler = async (req, res) => {
  const id = routeId(req.params.id);
  await resumeService.remove(userId(req), id);
  await ResumeAnalysis.deleteMany({ userId: userId(req), resumeId: id });
  sendSuccess(res, 200, 'Resume deleted', {});
};

export const listResumeVersions: RequestHandler = async (req, res) => {
  const parsed = pageQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Request validation failed', parsed.error.issues.map((issue) => ({ field: issue.path.join('.') || 'query', message: issue.message })));
  const result = await resumeService.versions(userId(req), routeId(req.params.id), parsed.data.page, parsed.data.limit);
  sendSuccess(res, 200, 'Resume versions retrieved', result);
};

export const restoreResumeVersion: RequestHandler = async (req, res) => {
  const resume = await resumeService.restoreVersion(userId(req), routeId(req.params.id), routeId(req.params.versionId));
  sendSuccess(res, 200, 'Resume version restored', { resume });
};

export const exportResume: RequestHandler = async (req, res) => {
  const result = await exportResumePdf(userId(req), routeId(req.params.id));
  res.status(200);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(result.buffer);
};