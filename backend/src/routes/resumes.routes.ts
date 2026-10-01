import { Router } from 'express';
import { getResumeAnalysisHistory } from '../controllers/resume-analysis.controller';
import { createResume, deleteResume, exportResume, getResume, listResumeVersions, listResumes, restoreResumeVersion, updateResume } from '../controllers/resumes.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { premiumTemplateMiddleware } from '../middleware/premium-template.middleware';
import { validateBody } from '../middleware/validate-body';
import { resumeCreateSchema, resumeUpdateSchema } from '../validators/resume.validator';

export const resumesRouter = Router();
resumesRouter.use(authMiddleware);
resumesRouter.get('/', listResumes);
resumesRouter.post('/', validateBody(resumeCreateSchema), premiumTemplateMiddleware, createResume);
resumesRouter.get('/:id/versions', listResumeVersions);
resumesRouter.post('/:id/versions/:versionId/restore', restoreResumeVersion);
resumesRouter.post('/:id/export/pdf', exportResume);
resumesRouter.get('/:id/analysis', getResumeAnalysisHistory);
resumesRouter.get('/:id', getResume);
resumesRouter.put('/:id', validateBody(resumeUpdateSchema), premiumTemplateMiddleware, updateResume);
resumesRouter.delete('/:id', deleteResume);