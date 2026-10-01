"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewSubscription = exports.cancelSubscription = exports.upgradeSubscription = exports.getSubscription = void 0;
const subscription_service_1 = require("../services/subscription.service");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
function currentUserId(req) {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    return req.authUser.id;
}
const getSubscription = async (req, res) => {
    const result = await subscription_service_1.subscriptionService.get(currentUserId(req));
    (0, api_response_1.sendSuccess)(res, 200, 'Subscription retrieved', result);
};
exports.getSubscription = getSubscription;
const upgradeSubscription = async (req, res) => {
    const result = await subscription_service_1.subscriptionService.upgrade(currentUserId(req));
    (0, api_response_1.sendSuccess)(res, 200, 'Subscription upgraded', result);
};
exports.upgradeSubscription = upgradeSubscription;
const cancelSubscription = async (req, res) => {
    const subscription = await subscription_service_1.subscriptionService.cancel(currentUserId(req));
    (0, api_response_1.sendSuccess)(res, 200, 'Subscription cancelled', { subscription });
};
exports.cancelSubscription = cancelSubscription;
const renewSubscription = async (req, res) => {
    const result = await subscription_service_1.subscriptionService.renew(currentUserId(req));
    (0, api_response_1.sendSuccess)(res, 200, 'Subscription renewed', result);
};
exports.renewSubscription = renewSubscription;
