import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/auth-rate-limit.middleware';
import { validateBody } from '../middleware/validate-body';
import { forgotPassword, currentUser, login, logout, resetPasswordHandler, signup } from '../controllers/auth.controller';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from '../validators/auth.validator';

export const authRouter = Router();

authRouter.post('/signup', authRateLimit, validateBody(signupSchema), signup);
authRouter.post('/login', authRateLimit, validateBody(loginSchema), login);
authRouter.get('/me', authMiddleware, currentUser);
authRouter.post('/logout', authMiddleware, logout);
authRouter.post('/forgot-password', authRateLimit, validateBody(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', authRateLimit, validateBody(resetPasswordSchema), resetPasswordHandler);
