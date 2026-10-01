"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../models/User");
const user_service_1 = require("../services/user.service");
const api_error_1 = require("../utils/api-error");
const jwt_1 = require("../utils/jwt");
const authMiddleware = async (req, _res, next) => {
    const authorization = req.get('authorization');
    const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
    if (!match)
        return next(new api_error_1.ApiError(401, 'Authentication is required'));
    const claims = (0, jwt_1.verifyAccessToken)(match[1]);
    if (!mongoose_1.default.isValidObjectId(claims.sub)) {
        return next(new api_error_1.ApiError(401, 'Invalid or expired authentication token'));
    }
    const user = await user_model_1.User.findById(claims.sub).select('+tokenVersion');
    if (!user || user.tokenVersion !== claims.tokenVersion) {
        return next(new api_error_1.ApiError(401, 'Invalid or expired authentication token'));
    }
    req.authUser = (0, user_service_1.toSafeUser)(user);
    next();
};
exports.authMiddleware = authMiddleware;
