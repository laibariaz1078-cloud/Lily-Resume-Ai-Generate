import type { RequestHandler } from 'express';
import { User } from '../models/user.model';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { createAccessToken } from '../utils/jwt';
import { toSafeUser } from '../services/user.service';
import { requestPasswordReset, resetPassword, PasswordResetDeliveryError } from '../services/password-reset.service';
import type { LoginInput, ResetPasswordInput, SignupInput } from '../validators/auth.validator';

export const signup: RequestHandler = async (req, res) => {
  const { name, email, password } = req.body as SignupInput;
  const user = await User.create({ name, email, password });
  const token = createAccessToken(user);
  sendSuccess(res, 201, 'Account created successfully', { user: toSafeUser(user), token });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body as LoginInput;
  const user = await User.findOne({ email }).select('+password +tokenVersion');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();
  const token = createAccessToken(user);
  sendSuccess(res, 200, 'Login successful', { user: toSafeUser(user), token });
};

export const currentUser: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  sendSuccess(res, 200, 'Current user retrieved', { user: req.authUser });
};

export const logout: RequestHandler = async (req, res) => {
  if (!req.authUser) throw new ApiError(401, 'Authentication is required');
  const user = await User.findByIdAndUpdate(req.authUser.id, { $inc: { tokenVersion: 1 } });
  if (!user) throw new ApiError(401, 'Authentication is required');
  sendSuccess(res, 200, 'Logged out successfully', {});
};

export const forgotPassword: RequestHandler = async (req, res) => {
  const { email } = req.body as { email: string };

  try {
    await requestPasswordReset(email);
  } catch (error) {
    if (!(error instanceof PasswordResetDeliveryError)) throw error;
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Password reset email could not be delivered; SMTP configuration is required.');
    }
  }

  sendSuccess(res, 200, 'If an account exists for that email, password-reset instructions will be sent.', {});
};

export const resetPasswordHandler: RequestHandler = async (req, res) => {
  const { token, password } = req.body as ResetPasswordInput;
  const reset = await resetPassword(token, password);
  if (!reset) throw new ApiError(400, 'Password reset token is invalid or expired');
  sendSuccess(res, 200, 'Password reset successfully. Please log in again.', {});
};
