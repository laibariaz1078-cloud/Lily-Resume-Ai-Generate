import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { AIUsage } from '../models/ai-usage.model';
import { env } from '../config/env';
import { subscriptionService } from '../services/subscription.service';
import { ApiError } from '../utils/api-error';

export const aiUsageLimit: RequestHandler = async (req, _res, next) => {
  if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
  try {
    const plan = await subscriptionService.planForUser(req.authUser.id);
    const limit = plan === 'PREMIUM' ? env.PREMIUM_AI_MONTHLY_LIMIT : env.FREE_AI_MONTHLY_LIMIT;
    if (limit === 0) return next(new ApiError(403, 'AI requests are not available on the current plan'));
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const used = await AIUsage.countDocuments({ userId: req.authUser.id, createdAt: mongoose.trusted({ $gte: monthStart }) });
    if (used >= limit) return next(new ApiError(429, 'Monthly AI usage limit reached'));
    next();
  } catch (error) {
    next(error);
  }
};