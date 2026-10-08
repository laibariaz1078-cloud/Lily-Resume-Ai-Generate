"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const booleanFromEnv = zod_1.z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true');
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(4000),
    TRUST_PROXY_HOPS: zod_1.z.coerce.number().int().min(0).max(5).default(0),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like 15m, 1h, or 7d').default('1h'),
    CLIENT_URL: zod_1.z.string().url().default('http://localhost:3000'),
    SESSION_COOKIE_NAME: zod_1.z.string().regex(/^[A-Za-z0-9_-]+$/).default('lily_session'),
    SESSION_TTL_HOURS: zod_1.z.coerce.number().int().min(1).max(168).default(24),
    REMEMBER_ME_TTL_DAYS: zod_1.z.coerce.number().int().min(1).max(90).default(30),
    SESSION_COOKIE_SAME_SITE: zod_1.z.enum(['strict', 'lax', 'none']).default('lax'),
    TURNSTILE_SITE_KEY: zod_1.z.string().default(''),
    TURNSTILE_SECRET_KEY: zod_1.z.string().default(''),
    SMTP_HOST: zod_1.z.string().default(''),
    SMTP_PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: booleanFromEnv,
    SMTP_USER: zod_1.z.string().default(''),
    SMTP_PASSWORD: zod_1.z.string().default(''),
    SMTP_FROM: zod_1.z.string().default('Lily Studio <no-reply@example.com>'),
    PASSWORD_RESET_URL: zod_1.z.string().url().default('http://localhost:3000/reset-password'),
    AI_PROVIDER: zod_1.z.enum(['openai', 'anthropic']).default('openai'),
    AI_API_KEY: zod_1.z.string().default(''),
    AI_MODEL: zod_1.z.string().default(''),
    FREE_AI_MONTHLY_LIMIT: zod_1.z.coerce.number().int().min(0).default(50),
    PREMIUM_AI_MONTHLY_LIMIT: zod_1.z.coerce.number().int().min(1).default(1000),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const details = parsed.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`);
    throw new Error(`Invalid environment configuration: ${details.join('; ')}`);
}
if (parsed.data.NODE_ENV === 'production'
    && (!parsed.data.JWT_SECRET || /change.?me|placeholder|example/i.test(parsed.data.JWT_SECRET))) {
    throw new Error('JWT_SECRET must be a unique, randomly generated secret in production');
}
exports.env = parsed.data;
