"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    errors;
    expose;
    constructor(statusCode, message, errors = [], expose = true) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.errors = errors;
        this.expose = expose;
    }
}
exports.AppError = AppError;
class ApiError extends AppError {
    constructor(statusCode, message, errors = [], expose = true) {
        super(statusCode, message, errors, expose);
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
