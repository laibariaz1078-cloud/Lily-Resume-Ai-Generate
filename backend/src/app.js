"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
const routes_1 = require("./routes");
const api_error_1 = require("./utils/api-error");
exports.app = (0, express_1.default)();
const apiRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.', errors: [] },
});
exports.app.disable('x-powered-by');
exports.app.set('trust proxy', env_1.env.TRUST_PROXY_HOPS);
exports.app.use((0, helmet_1.default)());
exports.app.use((req, res, next) => {
    const startedAt = Date.now();
    res.once('finish', () => console.info('HTTP request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
    }));
    next();
});
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || origin === env_1.env.CLIENT_URL)
            return callback(null, true);
        callback(new api_error_1.ApiError(403, 'Origin is not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
exports.app.use(express_1.default.json({ limit: '256kb' }));
exports.app.use('/api', (req, _res, next) => {
    const hasSessionCookie = (req.get('cookie') ?? '').includes(`${env_1.env.SESSION_COOKIE_NAME}=`);
    if (hasSessionCookie && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
        && req.get('origin') !== env_1.env.CLIENT_URL) {
        return next(new api_error_1.ApiError(403, 'Request origin is not allowed'));
    }
    next();
});
exports.app.use('/api', apiRateLimit, routes_1.apiRouter);
exports.app.use(error_middleware_1.notFoundMiddleware);
exports.app.use(error_middleware_1.errorMiddleware);
