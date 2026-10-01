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
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like 15m, 1h, or 7d').default('1h'),
    CLIENT_URL: zod_1.z.string().url().default('http://localhost:3000'),
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
exports.env = parsed.data;
