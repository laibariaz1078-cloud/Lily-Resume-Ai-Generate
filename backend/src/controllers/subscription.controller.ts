import type { RequestHandler } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';

function currentUserId(req: Parameters<RequestHandler>[0]): string {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  return req.authUser.id;
}

export const getSubscription: RequestHandler = async (req, res) => {
  const result = await subscriptionService.get(currentUserId(req));
  sendSuccess(res, 200, 'Subscription retrieved', result);
};

export const upgradeSubscription: RequestHandler = async (req, res) => {
  const result = await subscriptionService.upgrade(currentUserId(req));
  sendSuccess(res, 200, 'Subscription upgraded', result);
};

export const cancelSubscription: RequestHandler = async (req, res) => {
  const subscription = await subscriptionService.cancel(currentUserId(req));
  sendSuccess(res, 200, 'Subscription cancelled', { subscription });
};

export const renewSubscription: RequestHandler = async (req, res) => {
  const result = await subscriptionService.renew(currentUserId(req));
  sendSuccess(res, 200, 'Subscription renewed', result);
};