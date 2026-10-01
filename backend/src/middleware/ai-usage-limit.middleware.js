"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiUsageLimit = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ai_usage_model_1 = require("../models/AIUsage");
const env_1 = require("../config/env");
const subscription_service_1 = require("../services/subscription.service");
const api_error_1 = require("../utils/api-error");
const aiUsageLimit = async (req, _res, next) => {
    if (!req.authUser)
        return next(new api_error_1.ApiError(401, 'Authentication is required'));
    try {
        const plan = await subscription_service_1.subscriptionService.planForUser(req.authUser.id);
        const limit = plan === 'PREMIUM' ? env_1.env.PREMIUM_AI_MONTHLY_LIMIT : env_1.env.FREE_AI_MONTHLY_LIMIT;
        if (limit === 0)
            return next(new api_error_1.ApiError(403, 'AI requests are not available on the current plan'));
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        const used = await ai_usage_model_1.AIUsage.countDocuments({ userId: req.authUser.id, createdAt: mongoose_1.default.trusted({ $gte: monthStart }) });
        if (used >= limit)
            return next(new api_error_1.ApiError(429, 'Monthly AI usage limit reached'));
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.aiUsageLimit = aiUsageLimit;
