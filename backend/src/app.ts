import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { apiRouter } from './routes';
import { ApiError } from './utils/api-error';

export const app = express();

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.', errors: [] },
});

app.disable('x-powered-by');
app.use(helmet());
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.once('finish', () => console.info('HTTP request', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    durationMs: Date.now() - startedAt,
  }));
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === env.CLIENT_URL) return callback(null, true);
    callback(new ApiError(403, 'Origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '256kb' }));
app.use('/api', apiRateLimit, apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
