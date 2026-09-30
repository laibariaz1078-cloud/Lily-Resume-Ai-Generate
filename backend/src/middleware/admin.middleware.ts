import type { RequestHandler } from 'express';
import { ApiError } from '../utils/api-error';

export const adminMiddleware: RequestHandler = (req, _res, next) => {
  if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
  if (req.authUser.role !== 'ADMIN') return next(new ApiError(403, 'Administrator access is required'));
  next();
};
