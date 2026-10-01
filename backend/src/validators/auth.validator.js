"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettingsSchema = exports.passwordChangeSchema = exports.profileDetailsSchema = exports.profileUpdateSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
const email = zod_1.z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long when encoded');
exports.signupSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    email,
    password,
}).strict();
exports.loginSchema = zod_1.z.object({ email, password }).strict();
exports.forgotPasswordSchema = zod_1.z.object({ email }).strict();
const profileImage = zod_1.z.string().url().max(2048).refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
}, 'Profile image URL must use HTTP or HTTPS');
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(32).max(256),
    password,
}).strict();
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
    newPassword: password,
}).strict().refine((input) => input.currentPassword !== input.newPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current password',
});
exports.userSettingsSchema = zod_1.z.object({
    theme: zod_1.z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
    notifications: zod_1.z.object({ weeklySummary: zod_1.z.boolean().optional(), productNews: zod_1.z.boolean().optional() }).strict().optional(),
    ai: zod_1.z.object({ suggestions: zod_1.z.boolean().optional(), considerJobDescriptions: zod_1.z.boolean().optional(), requireReview: zod_1.z.boolean().optional() }).strict().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one settings field to update');
