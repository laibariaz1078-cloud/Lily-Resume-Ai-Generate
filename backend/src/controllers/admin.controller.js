"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSystemHealth = exports.adminSubscriptionStats = exports.adminUserCount = exports.adminStats = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const resume_model_1 = require("../models/Resume");
const subscription_model_1 = require("../models/Subscription");
const template_model_1 = require("../models/Template");
const user_model_1 = require("../models/User");
const api_response_1 = require("../utils/api-response");
const adminStats = async (_req, res) => {
    const [users, admins, resumes, templates, subscriptions] = await Promise.all([
        user_model_1.User.countDocuments(),
        user_model_1.User.countDocuments({ role: 'ADMIN' }),
        resume_model_1.Resume.countDocuments(),
        template_model_1.Template.countDocuments(),
        subscription_model_1.Subscription.aggregate([
            { $group: { _id: { plan: '$plan', status: '$status' }, count: { $sum: 1 } } },
            { $sort: { '_id.plan': 1, '_id.status': 1 } },
        ]),
    ]);
    (0, api_response_1.sendSuccess)(res, 200, 'Admin statistics retrieved', { users, admins, resumes, templates, subscriptions });
};
exports.adminStats = adminStats;
const adminUserCount = async (_req, res) => {
    const [total, activePremium] = await Promise.all([
        user_model_1.User.countDocuments(),
        subscription_model_1.Subscription.countDocuments({ plan: 'PREMIUM', status: 'ACTIVE', isActive: true }),
    ]);
    (0, api_response_1.sendSuccess)(res, 200, 'User counts retrieved', { total, activePremium });
};
exports.adminUserCount = adminUserCount;
const adminSubscriptionStats = async (_req, res) => {
    const stats = await subscription_model_1.Subscription.aggregate([
        { $group: { _id: { plan: '$plan', status: '$status' }, count: { $sum: 1 } } },
        { $sort: { '_id.plan': 1, '_id.status': 1 } },
    ]);
    (0, api_response_1.sendSuccess)(res, 200, 'Subscription statistics retrieved', { items: stats });
};
exports.adminSubscriptionStats = adminSubscriptionStats;
const adminSystemHealth = async (_req, res) => {
    const readyState = mongoose_1.default.connection.readyState;
    (0, api_response_1.sendSuccess)(res, 200, 'System health retrieved', {
        status: readyState === 1 ? 'healthy' : 'degraded',
        database: readyState === 1 ? 'connected' : 'disconnected',
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
    });
};
exports.adminSystemHealth = adminSystemHealth;
