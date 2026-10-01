import type { RequestHandler } from 'express';
import { authMiddleware } from './auth.middleware';

export const optionalAuthMiddleware: RequestHandler = (req, res, next) => {
  if (!req.get('authorization')) return next();
  return authMiddleware(req, res, next);
};