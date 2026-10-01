"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.notFoundMiddleware = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const api_error_1 = require("../utils/api-error");
function isDuplicateKeyError(error) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
const notFoundMiddleware = (req, _res, next) => {
    next(new api_error_1.ApiError(404, 'Route not found'));
};
exports.notFoundMiddleware = notFoundMiddleware;
const errorMiddleware = (error, req, res, _next) => {
    let statusCode = 500;
    let message = 'An unexpected error occurred';
    let errors = [];
    if (error instanceof api_error_1.AppError) {
        statusCode = error.statusCode;
        message = error.expose ? error.message : message;
        errors = error.expose ? error.errors : [];
    }
    else if (error instanceof mongoose_1.default.Error.ValidationError) {
        statusCode = 400;
        message = 'Request validation failed';
        errors = Object.values(error.errors).map((issue) => ({ field: issue.path, message: issue.message }));
    }
    else if (error instanceof mongoose_1.default.Error.CastError) {
        statusCode = 400;
        message = 'Invalid request value';
    }
    else if (error instanceof mongoose_1.default.Error.MongooseServerSelectionError || error instanceof mongoose_1.default.mongo.MongoNetworkError) {
        statusCode = 503;
        message = 'Database service is temporarily unavailable';
    }
    else if (error instanceof mongoose_1.default.Error.StrictModeError) {
        statusCode = 400;
        message = 'Request contains unsupported fields';
    }
    else if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError')) {
        statusCode = 401;
        message = 'Invalid or expired authentication token';
    }
    else if (isDuplicateKeyError(error)) {
        statusCode = 409;
        message = error.keyPattern?.email ? 'An account with this email already exists' : 'A record with this value already exists';
    }
    else if (error instanceof SyntaxError && 'body' in error) {
        statusCode = 400;
        message = 'Malformed JSON request body';
    }
    else if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Request body is too large';
    }
    if (statusCode >= 500) {
        console.error('API request failed', { method: req.method, path: req.path, errorName: error instanceof Error ? error.name : 'UnknownError' });
    }
    res.status(statusCode).json({ success: false, message, errors });
};
exports.errorMiddleware = errorMiddleware;
