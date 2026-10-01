"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = void 0;
const subscription_model_1 = require("../models/Subscription");
const user_model_1 = require("../models/User");
const api_error_1 = require("../utils/api-error");
const env_1 = require("../config/env");
const resume_model_1 = require("../models/Resume");
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
function mockPayment() {
    if (env_1.env.NODE_ENV === 'production')
        throw new api_error_1.ApiError(503, 'Payment provider is not configured');
    return { provider: 'mock', status: 'succeeded' };
}
async function syncUserPlan(userId, plan) {
    await user_model_1.User.updateOne({ _id: userId }, { $set: { plan } });
}
async function activatePremium(userId) {
    const payment = mockPayment();
    const now = new Date();
    const subscription = await subscription_model_1.Subscription.findOneAndUpdate({ userId }, { $set: { plan: 'PREMIUM', status: 'ACTIVE', startDate: now, endDate: new Date(now.getTime() + PERIOD_MS), isActive: true } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    await Promise.all([
        syncUserPlan(userId, 'PREMIUM'),
        resume_model_1.Resume.updateMany({ userId }, { $set: { isPermanent: true, expiresAt: null } }),
    ]);
    return { subscription: subscription.toObject(), payment };
}
exports.subscriptionService = {
    async get(userId) {
        const user = await user_model_1.User.findById(userId).select('plan createdAt');
        if (!user)
            throw new api_error_1.ApiError(404, 'User account not found');
        const subscription = await subscription_model_1.Subscription.findOneAndUpdate({ userId }, { $setOnInsert: { plan: 'FREE', status: 'ACTIVE', startDate: user.createdAt, endDate: null, isActive: true } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
        if (!subscription)
            throw new api_error_1.ApiError(500, 'Subscription could not be retrieved', [], false);
        if (user.plan !== 'FREE' && subscription.plan === 'FREE')
            await syncUserPlan(userId, 'FREE');
        if (subscription.plan === 'PREMIUM' && subscription.isActive && subscription.endDate && subscription.endDate <= new Date()) {
            subscription.status = 'EXPIRED';
            subscription.isActive = false;
            await subscription.save();
            await syncUserPlan(userId, 'FREE');
        }
        const effectivePlan = await this.planForUser(userId);
        return { subscription: subscription.toObject(), effectivePlan };
    },
    async planForUser(userId) {
        const subscription = await subscription_model_1.Subscription.findOne({ userId }).exec();
        if (subscription) {
            const currentlyActive = subscription.isActive && subscription.status === 'ACTIVE' && (!subscription.endDate || subscription.endDate > new Date());
            if (!currentlyActive && subscription.plan === 'PREMIUM' && subscription.status === 'ACTIVE') {
                subscription.status = 'EXPIRED';
                subscription.isActive = false;
                await subscription.save();
                await syncUserPlan(userId, 'FREE');
            }
            return currentlyActive ? subscription.plan : 'FREE';
        }
        const user = await user_model_1.User.findById(userId).select('plan').exec();
        if (!user)
            throw new api_error_1.ApiError(401, 'Authentication is required');
        if (user.plan !== 'FREE')
            await syncUserPlan(userId, 'FREE');
        return 'FREE';
    },
    async upgrade(userId) {
        return activatePremium(userId);
    },
    async cancel(userId) {
        const subscription = await subscription_model_1.Subscription.findOne({ userId });
        if (!subscription || subscription.plan !== 'PREMIUM' || !subscription.isActive) {
            throw new api_error_1.ApiError(409, 'There is no active premium subscription to cancel');
        }
        subscription.status = 'CANCELLED';
        subscription.isActive = false;
        subscription.endDate = new Date();
        await subscription.save();
        await syncUserPlan(userId, 'FREE');
        return subscription.toObject();
    },
    async renew(userId) {
        return activatePremium(userId);
    },
};
