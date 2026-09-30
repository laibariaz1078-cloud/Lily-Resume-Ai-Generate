import type { RequestHandler } from 'express';
import { User } from '../models/user.model';
import { toSafeUser } from '../services/user.service';
import type { ProfileUpdateInput } from '../validators/auth.validator';
import { ApiError } from '../utils/api-error';
import { sendSuccess } from '../utils/api-response';

export const updateCurrentUser: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const updates = req.body as ProfileUpdateInput;
  const user = await User.findByIdAndUpdate(req.authUser.id, { $set: updates }, {
    new: true,
    runValidators: true,
    projection: { password: 0, tokenVersion: 0, resetPasswordTokenHash: 0, resetPasswordExpiresAt: 0 },
  });

  if (!user) throw new ApiError(404, 'User account not found');
  sendSuccess(res, 200, 'Profile updated successfully', { user: toSafeUser(user) });
};
