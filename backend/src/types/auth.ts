import type { UserPlan, UserRole } from '../models/user.model';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  settings: Record<string, unknown>;
  role: UserRole;
  plan: UserPlan;
  isEmailVerified: boolean;
}

export interface AccessTokenClaims {
  tokenVersion: number;
}
