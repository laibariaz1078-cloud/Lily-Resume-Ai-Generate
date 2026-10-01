import type { RequestHandler } from 'express';
import type { UserPlan } from '../models/user.model';
import { subscriptionService } from '../services/subscription.service';
import { ApiError } from '../utils/api-error';

export function requirePlan(plan: UserPlan): RequestHandler {
  return async (req, _res, next) => {
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    try {
      const actualPlan = await subscriptionService.planForUser(req.authUser.id);
      if (plan === 'PREMIUM' && actualPlan !== 'PREMIUM') {
        return next(new ApiError(403, 'This feature requires a premium plan'));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}