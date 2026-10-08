"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSessionCookie = clearSessionCookie;
exports.createSession = createSession;
exports.hashSessionToken = hashSessionToken;
exports.readSessionToken = readSessionToken;
exports.revokeAllUserSessions = revokeAllUserSessions;
exports.revokeSession = revokeSession;
exports.setSessionCookie = setSessionCookie;
const node_crypto_1 = require("node:crypto");
const env_1 = require("../config/env");
const session_model_1 = require("../models/Session");
function hashSessionToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
function readSessionToken(req) {
    const prefix = `${env_1.env.SESSION_COOKIE_NAME}=`;
    return (req.get('cookie') ?? '').split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length) || null;
}
function cookieOptions(maxAge) {
    return {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === 'production' || env_1.env.SESSION_COOKIE_SAME_SITE === 'none',
        sameSite: env_1.env.SESSION_COOKIE_SAME_SITE,
        path: '/',
        ...(maxAge ? { maxAge } : {}),
    };
}
function setSessionCookie(res, token, maxAge) {
    res.cookie(env_1.env.SESSION_COOKIE_NAME, token, cookieOptions(maxAge));
}
function clearSessionCookie(res) {
    res.clearCookie(env_1.env.SESSION_COOKIE_NAME, cookieOptions());
}
async function createSession(userId, tokenVersion, rememberMe, res) {
    const token = (0, node_crypto_1.randomBytes)(32).toString('base64url');
    const lifetime = rememberMe
        ? env_1.env.REMEMBER_ME_TTL_DAYS * 24 * 60 * 60 * 1000
        : env_1.env.SESSION_TTL_HOURS * 60 * 60 * 1000;
    await session_model_1.Session.create({
        userId,
        tokenVersion,
        tokenHash: hashSessionToken(token),
        expiresAt: new Date(Date.now() + lifetime),
    });
    setSessionCookie(res, token, rememberMe ? lifetime : undefined);
}
async function revokeSession(token) {
    if (!token)
        return;
    await session_model_1.Session.updateOne({ tokenHash: hashSessionToken(token), revokedAt: null }, { $set: { revokedAt: new Date() } });
}
async function revokeAllUserSessions(userId) {
    await session_model_1.Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}
