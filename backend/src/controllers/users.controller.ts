import type { RequestHandler } from 'express';
import { User } from '../models/user.model';
import { toSafeUser } from '../services/user.service';
import type { ProfileDetailsInput, ProfileUpdateInput } from '../validators/auth.validator';
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

export const getProfile: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const user = await User.findById(req.authUser.id);
  if (!user) throw new ApiError(404, 'User account not found');
  sendSuccess(res, 200, 'Profile retrieved', { user: toSafeUser(user) });
};

export const updateProfile: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const updates = req.body as ProfileDetailsInput;
  const user = await User.findById(req.authUser.id);
  if (!user) throw new ApiError(404, 'User account not found');
  if (updates.name !== undefined) user.name = updates.name;
  if (updates.profileImage !== undefined) user.profileImage = updates.profileImage;
  if (updates.email !== undefined && updates.email !== user.email) {
    user.email = updates.email;
    user.isEmailVerified = false;
  }
  await user.save();
  sendSuccess(res, 200, 'Profile updated successfully', { user: toSafeUser(user) });
};

export const changePassword: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const input = req.body as { currentPassword: string; newPassword: string };
  const user = await User.findById(req.authUser.id).select('+password +tokenVersion');
  if (!user) throw new ApiError(404, 'User account not found');
  if (!(await user.comparePassword(input.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = input.newPassword;
  user.tokenVersion += 1;
  await user.save();
  sendSuccess(res, 200, 'Password changed. Please sign in again.', {});
};

export const updateSettings: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const user = await User.findById(req.authUser.id);
  if (!user) throw new ApiError(404, 'User account not found');
  const updates = req.body as Record<string, unknown>;
  const current = user.settings ?? {};
  user.settings = {
    ...current,
    ...updates,
    notifications: { ...((current.notifications as Record<string, unknown>) ?? {}), ...((updates.notifications as Record<string, unknown>) ?? {}) },
    ai: { ...((current.ai as Record<string, unknown>) ?? {}), ...((updates.ai as Record<string, unknown>) ?? {}) },
  };
  await user.save();
  sendSuccess(res, 200, 'Settings updated', { settings: user.settings });
};
