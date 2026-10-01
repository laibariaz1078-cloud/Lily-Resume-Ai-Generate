import { Schema, model, models, type Document, type Types } from 'mongoose';
import { USER_PLANS, type UserPlan } from './user.model';

export const SUBSCRIPTION_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface SubscriptionDocument extends Document {
  userId: Types.ObjectId;
  plan: UserPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: USER_PLANS, required: true, default: 'FREE' },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, required: true, default: 'ACTIVE' },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

subscriptionSchema.index({ plan: 1, status: 1 });

export const Subscription = models.Subscription || model<SubscriptionDocument>('Subscription', subscriptionSchema);