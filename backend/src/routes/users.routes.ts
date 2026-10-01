import { Router } from 'express';
import { changePassword, getProfile, updateCurrentUser, updateProfile, updateSettings } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate-body';
import { passwordChangeSchema, profileDetailsSchema, profileUpdateSchema, userSettingsSchema } from '../validators/auth.validator';

export const usersRouter = Router();
usersRouter.patch('/me', authMiddleware, validateBody(profileUpdateSchema), updateCurrentUser);
usersRouter.get('/profile', authMiddleware, getProfile);
usersRouter.put('/profile', authMiddleware, validateBody(profileDetailsSchema), updateProfile);
usersRouter.patch('/password', authMiddleware, validateBody(passwordChangeSchema), changePassword);
usersRouter.patch('/settings', authMiddleware, validateBody(userSettingsSchema), updateSettings);
