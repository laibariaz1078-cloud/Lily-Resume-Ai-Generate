import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { toSafeUser } from '../services/user.service';
import { ApiError } from '../utils/api-error';
import { verifyAccessToken } from '../utils/jwt';

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) return next(new ApiError(401, 'Authentication is required'));

  const claims = verifyAccessToken(match[1]);
  if (!mongoose.isValidObjectId(claims.sub)) {
    return next(new ApiError(401, 'Invalid or expired authentication token'));
  }

  const user = await User.findById(claims.sub).select('+tokenVersion');
  if (!user || user.tokenVersion !== claims.tokenVersion) {
    return next(new ApiError(401, 'Invalid or expired authentication token'));
  }

  req.authUser = toSafeUser(user);
  next();
};
