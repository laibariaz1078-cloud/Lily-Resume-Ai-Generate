import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { apiRouter } from './routes';
import { ApiError } from './utils/api-error';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === env.CLIENT_URL) return callback(null, true);
    callback(new ApiError(403, 'Origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use('/api', apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
