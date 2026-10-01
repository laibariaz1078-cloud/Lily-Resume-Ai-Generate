"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.premiumTemplateMiddleware = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const template_model_1 = require("../models/Template");
const require_plan_middleware_1 = require("./require-plan.middleware");
const requirePremium = (0, require_plan_middleware_1.requirePlan)('PREMIUM');
const premiumTemplateMiddleware = async (req, res, next) => {
    const templateId = req.body?.templateId;
    if (typeof templateId !== 'string' || !templateId)
        return next();
    try {
        const alternatives = [{ slug: templateId }, ...(mongoose_1.default.isValidObjectId(templateId) ? [{ _id: templateId }] : [])];
        const template = await template_model_1.Template.findOne({ isActive: true, ownerId: null, $or: alternatives }).select('isPremium').exec();
        if (!template?.isPremium)
            return next();
        return requirePremium(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
exports.premiumTemplateMiddleware = premiumTemplateMiddleware;
