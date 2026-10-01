import { rateLimit } from 'express-rate-limit';

export const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.authUser?.id ?? 'unknown',
  message: { success: false, message: 'Too many AI requests. Please try again later.', errors: [] },
});