import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { Resume } from '../models/resume.model';
import { Subscription } from '../models/subscription.model';
import { Template } from '../models/template.model';
import { User } from '../models/user.model';
import { sendSuccess } from '../utils/api-response';

export const adminStats: RequestHandler = async (_req, res) => {
  const [users, admins, resumes, templates, subscriptions] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'ADMIN' }),
    Resume.countDocuments(),
    Template.countDocuments(),
    Subscription.aggregate([
      { $group: { _id: { plan: '$plan', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.plan': 1, '_id.status': 1 } },
    ]),
  ]);
  sendSuccess(res, 200, 'Admin statistics retrieved', { users, admins, resumes, templates, subscriptions });
};

export const adminUserCount: RequestHandler = async (_req, res) => {
  const [total, activePremium] = await Promise.all([
    User.countDocuments(),
    Subscription.countDocuments({ plan: 'PREMIUM', status: 'ACTIVE', isActive: true }),
  ]);
  sendSuccess(res, 200, 'User counts retrieved', { total, activePremium });
};

export const adminSubscriptionStats: RequestHandler = async (_req, res) => {
  const stats = await Subscription.aggregate([
    { $group: { _id: { plan: '$plan', status: '$status' }, count: { $sum: 1 } } },
    { $sort: { '_id.plan': 1, '_id.status': 1 } },
  ]);
  sendSuccess(res, 200, 'Subscription statistics retrieved', { items: stats });
};

export const adminSystemHealth: RequestHandler = async (_req, res) => {
  const readyState = mongoose.connection.readyState;
  sendSuccess(res, 200, 'System health retrieved', {
    status: readyState === 1 ? 'healthy' : 'degraded',
    database: readyState === 1 ? 'connected' : 'disconnected',
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
  });
};