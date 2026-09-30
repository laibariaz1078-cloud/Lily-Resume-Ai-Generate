import bcrypt from 'bcryptjs';
import { Document, Schema, model, models } from 'mongoose';

export const USER_ROLES = ['USER', 'ADMIN'] as const;
export const USER_PLANS = ['FREE', 'PREMIUM'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type UserPlan = (typeof USER_PLANS)[number];

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  profileImage: string | null;
  role: UserRole;
  plan: UserPlan;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  tokenVersion: number;
  resetPasswordTokenHash: string | null;
  resetPasswordExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, select: false },
    profileImage: { type: String, default: null, maxlength: 2048 },
    role: { type: String, enum: USER_ROLES, default: 'USER', required: true },
    plan: { type: String, enum: USER_PLANS, default: 'FREE', required: true },
    isEmailVerified: { type: Boolean, default: false, required: true },
    lastLoginAt: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0, select: false },
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpiresAt: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_document, value: Record<string, unknown>) => {
        delete value.password;
        delete value.tokenVersion;
        delete value.resetPasswordTokenHash;
        delete value.resetPasswordExpiresAt;
        delete value.__v;
        return value;
      },
    },
  },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = models.User || model<UserDocument>('User', userSchema);
