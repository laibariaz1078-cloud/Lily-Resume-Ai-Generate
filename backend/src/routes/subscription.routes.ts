import { Router } from 'express';
import { cancelSubscription, getSubscription, renewSubscription, upgradeSubscription } from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate-body';
import { subscriptionUpgradeSchema } from '../validators/subscription.validator';

export const subscriptionRouter = Router();
subscriptionRouter.use(authMiddleware);
subscriptionRouter.get('/', getSubscription);
subscriptionRouter.post('/upgrade', validateBody(subscriptionUpgradeSchema), upgradeSubscription);
subscriptionRouter.post('/cancel', cancelSubscription);
subscriptionRouter.post('/renew', renewSubscription);