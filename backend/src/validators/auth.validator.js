"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettingsSchema = exports.passwordChangeSchema = exports.profileDetailsSchema = exports.profileUpdateSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.resendVerificationSchema = exports.verifyEmailSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
const email = zod_1.z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = zod_1.z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password cannot exceed 72 characters')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long when encoded');
const strongPassword = password
    .refine((value) => /[a-z]/.test(value), 'Include a lowercase letter')
    .refine((value) => /[A-Z]/.test(value), 'Include an uppercase letter')
    .refine((value) => /\d/.test(value), 'Include a number')
    .refine((value) => /[^A-Za-z0-9]/.test(value), 'Include a symbol');
const captchaToken = zod_1.z.string().trim().min(1, 'Complete the security check').max(2048);
const code = zod_1.z.string().regex(/^\d{4}$/, 'Enter the 4-digit code');
const passwordPair = (schema) => schema.refine((input) => input.password === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
});
exports.signupSchema = passwordPair(zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    email,
    password: strongPassword,
    confirmPassword: zod_1.z.string().max(72),
    captchaToken,
}).strict());
exports.loginSchema = zod_1.z.object({ email, password, captchaToken, rememberMe: zod_1.z.boolean().default(false) }).strict();
exports.verifyEmailSchema = zod_1.z.object({ email, code, captchaToken }).strict();
exports.resendVerificationSchema = zod_1.z.object({ email, captchaToken }).strict();
exports.forgotPasswordSchema = zod_1.z.object({ email, captchaToken }).strict();
exports.resetPasswordSchema = passwordPair(zod_1.z.object({ email, code, password: strongPassword, confirmPassword: zod_1.z.string().max(72), captchaToken }).strict());
const profileImage = zod_1.z.string().url().max(2048).refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
}, 'Profile image URL must use HTTP or HTTPS');
exports.profileUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    profileImage: profileImage.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one profile field to update');
exports.profileDetailsSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    email: email.optional(),
    profileImage: profileImage.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one profile field to update');
exports.passwordChangeSchema = zod_1.z.object({
    currentPassword: password,
    newPassword: strongPassword,
}).strict().refine((input) => input.currentPassword !== input.newPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current password',
});
exports.userSettingsSchema = zod_1.z.object({
    theme: zod_1.z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
    notifications: zod_1.z.object({ weeklySummary: zod_1.z.boolean().optional(), productNews: zod_1.z.boolean().optional() }).strict().optional(),
    ai: zod_1.z.object({ suggestions: zod_1.z.boolean().optional(), considerJobDescriptions: zod_1.z.boolean().optional(), requireReview: zod_1.z.boolean().optional() }).strict().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one settings field to update');
