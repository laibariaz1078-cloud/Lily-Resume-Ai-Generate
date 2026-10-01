import type { Types } from 'mongoose';
import { Subscription, type SubscriptionDocument } from '../models/subscription.model';
import { User, type UserPlan } from '../models/user.model';
import { ApiError } from '../utils/api-error';
import { env } from '../config/env';
import { Resume } from '../models/resume.model';

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function mockPayment(): { provider: 'mock'; status: 'succeeded' } {
  if (env.NODE_ENV === 'production') throw new ApiError(503, 'Payment provider is not configured');
  return { provider: 'mock', status: 'succeeded' };
}

async function syncUserPlan(userId: Types.ObjectId | string, plan: UserPlan): Promise<void> {
  await User.updateOne({ _id: userId }, { $set: { plan } });
}

async function activatePremium(userId: string) {
  const payment = mockPayment();
  const now = new Date();
  const subscription = await Subscription.findOneAndUpdate(
    { userId },
    { $set: { plan: 'PREMIUM', status: 'ACTIVE', startDate: now, endDate: new Date(now.getTime() + PERIOD_MS), isActive: true } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await Promise.all([
    syncUserPlan(userId, 'PREMIUM'),
    Resume.updateMany({ userId }, { $set: { isPermanent: true, expiresAt: null } }),
  ]);
  return { subscription: subscription.toObject(), payment };
}

export const subscriptionService = {
  async get(userId: string) {
    const user = await User.findById(userId).select('plan createdAt');
    if (!user) throw new ApiError(404, 'User account not found');
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      { $setOnInsert: { plan: 'FREE', status: 'ACTIVE', startDate: user.createdAt, endDate: null, isActive: true } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    if (!subscription) throw new ApiError(500, 'Subscription could not be retrieved', [], false);
    if (user.plan !== 'FREE' && subscription.plan === 'FREE') await syncUserPlan(userId, 'FREE');

    if (subscription.plan === 'PREMIUM' && subscription.isActive && subscription.endDate && subscription.endDate <= new Date()) {
      subscription.status = 'EXPIRED';
      subscription.isActive = false;
      await subscription.save();
      await syncUserPlan(userId, 'FREE');
    }
    const effectivePlan = await this.planForUser(userId);
    return { subscription: subscription.toObject(), effectivePlan };
  },

  async planForUser(userId: string): Promise<UserPlan> {
    const subscription = await Subscription.findOne({ userId }).exec();
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
    const user = await User.findById(userId).select('plan').exec();
    if (!user) throw new ApiError(401, 'Authentication is required');
    if (user.plan !== 'FREE') await syncUserPlan(userId, 'FREE');
    return 'FREE';
  },

  async upgrade(userId: string) {
    return activatePremium(userId);
  },

  async cancel(userId: string) {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.plan !== 'PREMIUM' || !subscription.isActive) {
      throw new ApiError(409, 'There is no active premium subscription to cancel');
    }
    subscription.status = 'CANCELLED';
    subscription.isActive = false;
    subscription.endDate = new Date();
    await subscription.save();
    await syncUserPlan(userId, 'FREE');
    return subscription.toObject();
  },

  async renew(userId: string) {
    return activatePremium(userId);
  },
};

export type ActiveSubscription = SubscriptionDocument;