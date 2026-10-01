"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRateLimit = void 0;
const express_rate_limit_1 = require("express-rate-limit");
exports.aiRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.authUser?.id ?? 'unknown',
    message: { success: false, message: 'Too many AI requests. Please try again later.', errors: [] },
});
