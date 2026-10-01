import { Router } from 'express';
import { createTemplate, deleteTemplate, generateTemplateConcept, getTemplate, listTemplates, listTemplatesByCategory, updateTemplate } from '../controllers/templates.controller';
import { aiRateLimit } from '../middleware/ai-rate-limit.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { aiUsageLimit } from '../middleware/ai-usage-limit.middleware';
import { optionalAuthMiddleware } from '../middleware/optional-auth.middleware';
import { validateBody } from '../middleware/validate-body';
import { generateTemplateConceptSchema, templateCreateSchema, templateUpdateSchema } from '../validators/template.validator';

export const templatesRouter = Router();
templatesRouter.get('/', optionalAuthMiddleware, listTemplates);
templatesRouter.get('/category/:category', optionalAuthMiddleware, listTemplatesByCategory);
templatesRouter.get('/:id', optionalAuthMiddleware, getTemplate);
templatesRouter.post('/generate-concept', authMiddleware, aiRateLimit, aiUsageLimit, validateBody(generateTemplateConceptSchema), generateTemplateConcept);
templatesRouter.post('/', authMiddleware, adminMiddleware, validateBody(templateCreateSchema), createTemplate);
templatesRouter.put('/:id', authMiddleware, adminMiddleware, validateBody(templateUpdateSchema), updateTemplate);
templatesRouter.delete('/:id', authMiddleware, adminMiddleware, deleteTemplate);