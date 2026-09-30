import { z } from 'zod';

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long when encoded');

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
}).strict();

export const loginSchema = z.object({ email, password }).strict();
export const forgotPasswordSchema = z.object({ email }).strict();
const profileImage = z.string().url().max(2048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'Profile image URL must use HTTP or HTTPS');

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password,
}).strict();

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  profileImage: profileImage.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one profile field to update');

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
