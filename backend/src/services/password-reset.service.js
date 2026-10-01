"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetDeliveryError = void 0;
exports.requestPasswordReset = requestPasswordReset;
exports.resetPassword = resetPassword;
const node_crypto_1 = require("node:crypto");
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const user_model_1 = require("../models/User");
const email_service_1 = require("./email.service");
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
class PasswordResetDeliveryError extends Error {
    constructor() {
        super('Password reset email could not be delivered');
        this.name = 'PasswordResetDeliveryError';
    }
}
exports.PasswordResetDeliveryError = PasswordResetDeliveryError;
function hashResetToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
async function requestPasswordReset(email) {
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        return;
    const token = (0, node_crypto_1.randomBytes)(32).toString('hex');
    user.resetPasswordTokenHash = hashResetToken(token);
    user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();
    const separator = env_1.env.PASSWORD_RESET_URL.includes('?') ? '&' : '?';
    const resetUrl = `${env_1.env.PASSWORD_RESET_URL}${separator}token=${encodeURIComponent(token)}`;
    try {
        await (0, email_service_1.sendPasswordResetEmail)(user.email, user.name, resetUrl);
    }
    catch (error) {
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpiresAt = null;
        await user.save();
        throw new PasswordResetDeliveryError();
    }
}
async function resetPassword(token, password) {
    const tokenHash = hashResetToken(token);
    const user = await user_model_1.User.findOne({
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: mongoose_1.default.trusted({ $gt: new Date() }),
    }).select('+resetPasswordTokenHash +resetPasswordExpiresAt +tokenVersion');
    if (!user)
        return false;
    user.password = password;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    user.tokenVersion += 1;
    await user.save();
    return true;
}
