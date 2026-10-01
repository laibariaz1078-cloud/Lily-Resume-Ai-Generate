"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const api_error_1 = require("../utils/api-error");
const adminMiddleware = (req, _res, next) => {
    if (!req.authUser)
        return next(new api_error_1.ApiError(401, 'Authentication is required'));
    if (req.authUser.role !== 'ADMIN')
        return next(new api_error_1.ApiError(403, 'Administrator access is required'));
    next();
};
exports.adminMiddleware = adminMiddleware;
