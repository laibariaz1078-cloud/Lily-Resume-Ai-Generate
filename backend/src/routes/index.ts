import { Router } from 'express';
import { health } from '../controllers/health.controller';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';

export const apiRouter = Router();
apiRouter.get('/health', health);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
