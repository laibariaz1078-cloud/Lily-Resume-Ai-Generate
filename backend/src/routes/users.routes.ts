import { Router } from 'express';
import { updateCurrentUser } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate-body';
import { profileUpdateSchema } from '../validators/auth.validator';

export const usersRouter = Router();
usersRouter.patch('/me', authMiddleware, validateBody(profileUpdateSchema), updateCurrentUser);
