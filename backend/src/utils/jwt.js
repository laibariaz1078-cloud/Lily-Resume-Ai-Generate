"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccessToken = createAccessToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const api_error_1 = require("./api-error");
const ISSUER = 'Lily-resume-api';
const AUDIENCE = 'Lily-resume-client';
function expirationInSeconds(value) {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match)
        throw new Error('Invalid JWT expiration configuration');
    const amount = Number(match[1]);
    const multiplier = { s: 1, m: 60, h: 3600, d: 86_400 }[match[2]];
    return amount * multiplier;
}
function createAccessToken(user) {
    const claims = { tokenVersion: user.tokenVersion };
    return jsonwebtoken_1.default.sign(claims, env_1.env.JWT_SECRET, {
        algorithm: 'HS256',
        subject: user.id,
        issuer: ISSUER,
        audience: AUDIENCE,
        expiresIn: expirationInSeconds(env_1.env.JWT_EXPIRES_IN),
    });
}
function verifyAccessToken(token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: ISSUER,
            audience: AUDIENCE,
        });
        if (typeof payload === 'string' || !payload.sub || !Number.isInteger(payload.tokenVersion)) {
            throw new Error('Invalid token claims');
        }
        return payload;
    }
    catch {
        throw new api_error_1.ApiError(401, 'Invalid or expired authentication token');
    }
}
