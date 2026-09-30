import type { AuthenticatedUser } from '../types/auth';
import type { UserDocument } from '../models/user.model';

export function toSafeUser(user: UserDocument): AuthenticatedUser & {
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    role: user.role,
    plan: user.plan,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
