"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePlan = requirePlan;
const subscription_service_1 = require("../services/subscription.service");
const api_error_1 = require("../utils/api-error");
function requirePlan(plan) {
    return async (req, _res, next) => {
        if (!req.authUser)
            return next(new api_error_1.ApiError(401, 'Authentication is required'));
        try {
            const actualPlan = await subscription_service_1.subscriptionService.planForUser(req.authUser.id);
            if (plan === 'PREMIUM' && actualPlan !== 'PREMIUM') {
                return next(new api_error_1.ApiError(403, 'This feature requires a premium plan'));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
