import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/user.model';
import { sendPasswordResetEmail } from './email.service';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

export class PasswordResetDeliveryError extends Error {
  constructor() {
    super('Password reset email could not be delivered');
    this.name = 'PasswordResetDeliveryError';
  }
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashResetToken(token);
  user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const separator = env.PASSWORD_RESET_URL.includes('?') ? '&' : '?';
  const resetUrl = `${env.PASSWORD_RESET_URL}${separator}token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  } catch (error) {
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();
    throw new PasswordResetDeliveryError();
  }
}

export async function resetPassword(token: string, password: string): Promise<boolean> {
  const tokenHash = hashResetToken(token);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: mongoose.trusted({ $gt: new Date() }),
  }).select('+resetPasswordTokenHash +resetPasswordExpiresAt +tokenVersion');

  if (!user) return false;

  user.password = password;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  user.tokenVersion += 1;
  await user.save();
  return true;
}
