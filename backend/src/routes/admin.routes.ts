import { Router } from 'express';
import { adminStats, adminSubscriptionStats, adminSystemHealth, adminUserCount } from '../controllers/admin.controller';
import { adminMiddleware } from '../middleware/admin.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

export const adminRouter = Router();
adminRouter.use(authMiddleware, adminMiddleware);
adminRouter.get('/stats', asyncHandler(adminStats));
adminRouter.get('/users/count', asyncHandler(adminUserCount));
adminRouter.get('/subscriptions/stats', asyncHandler(adminSubscriptionStats));
adminRouter.get('/system/health', asyncHandler(adminSystemHealth));