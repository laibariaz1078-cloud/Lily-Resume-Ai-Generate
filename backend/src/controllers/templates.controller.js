"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTemplateConcept = exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getTemplate = exports.listTemplatesByCategory = exports.listTemplates = void 0;
const ai_usage_model_1 = require("../models/AIUsage");
const ai_service_1 = require("../services/ai.service");
const template_service_1 = require("../services/template.service");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
const template_validator_1 = require("../validators/template.validator");
const subscription_service_1 = require("../services/subscription.service");
async function exposeTemplateSpecs(req, items) {
    const canReadPremium = req.authUser?.role === 'ADMIN' || (req.authUser ? await subscription_service_1.subscriptionService.planForUser(req.authUser.id) === 'PREMIUM' : false);
    return items.map((item) => item.isPremium && !canReadPremium ? { ...item, templateSpec: null } : item);
}
function pathParam(value) {
    if (typeof value !== 'string' || !value)
        throw new api_error_1.ApiError(400, 'Invalid route parameter');
    return value;
}
function listOptions(query) {
    const parsed = template_validator_1.templateListQuerySchema.safeParse(query);
    if (!parsed.success) {
        throw new api_error_1.ApiError(400, 'Request validation failed', parsed.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'query',
            message: issue.message,
        })));
    }
    return parsed.data;
}
const listTemplates = async (req, res) => {
    const result = await template_service_1.templateService.list(listOptions(req.query));
    const items = await exposeTemplateSpecs(req, result.items);
    (0, api_response_1.sendSuccess)(res, 200, 'Templates retrieved', { ...result, items });
};
exports.listTemplates = listTemplates;
const listTemplatesByCategory = async (req, res) => {
    const requestedCategory = pathParam(req.params.category);
    const category = template_validator_1.TEMPLATE_CATEGORIES.find((value) => value.toLowerCase() === requestedCategory.toLowerCase());
    if (!category)
        throw new api_error_1.ApiError(400, 'Unsupported template category');
    const result = await template_service_1.templateService.list({ ...listOptions(req.query), category });
    const items = await exposeTemplateSpecs(req, result.items);
    (0, api_response_1.sendSuccess)(res, 200, 'Templates retrieved', { ...result, items });
};
exports.listTemplatesByCategory = listTemplatesByCategory;
const getTemplate = async (req, res) => {
    const template = await template_service_1.templateService.get(pathParam(req.params.id));
    const [safeTemplate] = await exposeTemplateSpecs(req, [template]);
    (0, api_response_1.sendSuccess)(res, 200, 'Template retrieved', { template: safeTemplate });
};
exports.getTemplate = getTemplate;
const createTemplate = async (req, res) => {
    const template = await template_service_1.templateService.create(req.body);
    (0, api_response_1.sendSuccess)(res, 201, 'Template created', { template });
};
exports.createTemplate = createTemplate;
const updateTemplate = async (req, res) => {
    const template = await template_service_1.templateService.update(pathParam(req.params.id), req.body);
    (0, api_response_1.sendSuccess)(res, 200, 'Template updated', { template });
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res) => {
    await template_service_1.templateService.remove(pathParam(req.params.id));
    (0, api_response_1.sendSuccess)(res, 200, 'Template deleted', {});
};
exports.deleteTemplate = deleteTemplate;
const generateTemplateConcept = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const result = await ai_service_1.aiService.generateTemplateConcept(req.body);
    await ai_usage_model_1.AIUsage.create({ userId: req.authUser.id, operation: 'template-concept', tokensUsed: result.tokensUsed });
    (0, api_response_1.sendSuccess)(res, 200, 'Template concept generated', result.data);
};
exports.generateTemplateConcept = generateTemplateConcept;
