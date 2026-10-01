import type { RequestHandler } from 'express';
import { AIUsage } from '../models/ai-usage.model';
import { aiService } from '../services/ai.service';
import { templateService } from '../services/template.service';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { TEMPLATE_CATEGORIES, templateListQuerySchema, type GenerateTemplateConceptInput } from '../validators/template.validator';
import type { TemplateListOptions } from '../services/template.service';
import { subscriptionService } from '../services/subscription.service';

async function exposeTemplateSpecs<T extends Record<string, unknown> & { isPremium: boolean; templateSpec: unknown }>(req: Parameters<RequestHandler>[0], items: T[]): Promise<T[]> {
  const canReadPremium = req.authUser?.role === 'ADMIN' || (req.authUser ? await subscriptionService.planForUser(req.authUser.id) === 'PREMIUM' : false);
  return items.map((item) => item.isPremium && !canReadPremium ? { ...item, templateSpec: null } : item);
}

function pathParam(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value) throw new ApiError(400, 'Invalid route parameter');
  return value;
}

function listOptions(query: unknown): TemplateListOptions {
  const parsed = templateListQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new ApiError(400, 'Request validation failed', parsed.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'query',
      message: issue.message,
    })));
  }
  return parsed.data;
}

export const listTemplates: RequestHandler = async (req, res) => {
  const result = await templateService.list(listOptions(req.query));
  const items = await exposeTemplateSpecs(req, result.items as unknown as Array<Record<string, unknown> & { isPremium: boolean; templateSpec: unknown }>);
  sendSuccess(res, 200, 'Templates retrieved', { ...result, items });
};

export const listTemplatesByCategory: RequestHandler = async (req, res) => {
  const requestedCategory = pathParam(req.params.category);
  const category = TEMPLATE_CATEGORIES.find((value) => value.toLowerCase() === requestedCategory.toLowerCase());
  if (!category) throw new ApiError(400, 'Unsupported template category');
  const result = await templateService.list({ ...listOptions(req.query), category });
  const items = await exposeTemplateSpecs(req, result.items as unknown as Array<Record<string, unknown> & { isPremium: boolean; templateSpec: unknown }>);
  sendSuccess(res, 200, 'Templates retrieved', { ...result, items });
};

export const getTemplate: RequestHandler = async (req, res) => {
  const template = await templateService.get(pathParam(req.params.id));
  const [safeTemplate] = await exposeTemplateSpecs(req, [template as unknown as Record<string, unknown> & { isPremium: boolean; templateSpec: unknown }]);
  sendSuccess(res, 200, 'Template retrieved', { template: safeTemplate });
};

export const createTemplate: RequestHandler = async (req, res) => {
  const template = await templateService.create(req.body);
  sendSuccess(res, 201, 'Template created', { template });
};

export const updateTemplate: RequestHandler = async (req, res) => {
  const template = await templateService.update(pathParam(req.params.id), req.body);
  sendSuccess(res, 200, 'Template updated', { template });
};

export const deleteTemplate: RequestHandler = async (req, res) => {
  await templateService.remove(pathParam(req.params.id));
  sendSuccess(res, 200, 'Template deleted', {});
};

export const generateTemplateConcept: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const result = await aiService.generateTemplateConcept(req.body as GenerateTemplateConceptInput);
  await AIUsage.create({ userId: req.authUser.id, operation: 'template-concept', tokensUsed: result.tokensUsed });
  sendSuccess(res, 200, 'Template concept generated', result.data);
};