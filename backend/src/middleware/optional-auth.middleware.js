"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = void 0;
const auth_middleware_1 = require("./auth.middleware");
const optionalAuthMiddleware = (req, res, next) => {
    if (!req.get('authorization'))
        return next();
    return (0, auth_middleware_1.authMiddleware)(req, res, next);
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
