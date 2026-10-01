"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const api_error_1 = require("../utils/api-error");
function validateBody(schema) {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.issues.map((issue) => ({
                field: issue.path.join('.') || 'body',
                message: issue.message,
            }));
            return next(new api_error_1.ApiError(400, 'Request validation failed', errors));
        }
        req.body = parsed.data;
        next();
    };
}
