"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordHandler = exports.forgotPassword = exports.resendVerification = exports.verifyEmail = exports.logout = exports.currentUser = exports.login = exports.signup = void 0;
const user_model_1 = require("../models/User");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
const jwt_1 = require("../utils/jwt");
const user_service_1 = require("../services/user.service");
const captcha_service_1 = require("../services/captcha.service");
const auth_code_service_1 = require("../services/auth-code.service");
const session_service_1 = require("../services/session.service");
async function checkCaptcha(req) {
    await (0, captcha_service_1.verifyCaptcha)(req.body.captchaToken, req.ip);
}
const signup = async (req, res) => {
    await checkCaptcha(req);
    const { name, email, password } = req.body;
    if (await user_model_1.User.exists({ email }))
        throw new api_error_1.ApiError(409, 'An account with this email already exists');
    const user = await user_model_1.User.create({ name, email, password });
    await (0, auth_code_service_1.issueEmailVerificationCode)(user);
    (0, api_response_1.sendSuccess)(res, 201, 'Account created. Enter the verification code sent to your email.', { email: user.email });
};
exports.signup = signup;
const login = async (req, res) => {
    await checkCaptcha(req);
    const { email, password, rememberMe } = req.body;
    const user = await user_model_1.User.findOne({ email }).select('+password +tokenVersion');
    if (!user || !(await user.comparePassword(password)))
        throw new api_error_1.ApiError(401, 'Invalid email or password');
    if (!user.isEmailVerified)
        throw new api_error_1.ApiError(403, 'Verify your email before signing in');
    user.lastLoginAt = new Date();
    await user.save();
    await (0, session_service_1.createSession)(user._id, user.tokenVersion, rememberMe, res);
    (0, api_response_1.sendSuccess)(res, 200, 'Login successful', { user: (0, user_service_1.toSafeUser)(user) });
};
exports.login = login;
const currentUser = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    (0, api_response_1.sendSuccess)(res, 200, 'Current user retrieved', { user: req.authUser });
};
exports.currentUser = currentUser;
const logout = async (req, res) => {
    const token = (0, session_service_1.readSessionToken)(req);
    await (0, session_service_1.revokeSession)(token);
    const authorization = req.get('authorization')?.match(/^Bearer\s+([^\s]+)$/i);
    if (authorization) {
        try {
            const claims = (0, jwt_1.verifyAccessToken)(authorization[1]);
            if (claims.sub)
                await user_model_1.User.updateOne({ _id: claims.sub, tokenVersion: claims.tokenVersion }, { $inc: { tokenVersion: 1 } });
        }
        catch {
            // Logout remains idempotent for an expired or invalid credential.
        }
    }
    (0, session_service_1.clearSessionCookie)(res);
    (0, api_response_1.sendSuccess)(res, 200, 'Logged out successfully', {});
};
exports.logout = logout;
const verifyEmail = async (req, res) => {
    await checkCaptcha(req);
    const { email, code } = req.body;
    const verification = await (0, auth_code_service_1.verifyEmailCode)(email, code);
    if (!verification)
        throw new api_error_1.ApiError(400, 'Verification code is invalid or expired');
    (0, api_response_1.sendSuccess)(res, 200, 'Email verified. You can now sign in.', verification);
};
exports.verifyEmail = verifyEmail;
const resendVerification = async (req, res) => {
    await checkCaptcha(req);
    const user = await user_model_1.User.findOne({ email: req.body.email, isEmailVerified: false })
        .select('+emailVerificationCodeHash +emailVerificationExpiresAt +emailVerificationAttempts +emailVerificationLastSentAt');
    if (user) {
        try {
            await (0, auth_code_service_1.issueEmailVerificationCode)(user);
        }
        catch (error) {
            if (!(error instanceof api_error_1.ApiError) || error.statusCode !== 429)
                throw error;
        }
    }
    (0, api_response_1.sendSuccess)(res, 200, 'If this address needs verification, a new code will be sent.', {});
};
exports.resendVerification = resendVerification;
const forgotPassword = async (req, res) => {
    await checkCaptcha(req);
    const { email } = req.body;
    try {
        await (0, auth_code_service_1.issuePasswordResetCode)(email);
    }
    catch (error) {
        if (!(error instanceof api_error_1.ApiError) || error.statusCode !== 429)
            throw error;
    }
    (0, api_response_1.sendSuccess)(res, 200, 'If an account exists for that email, a reset code will be sent.', {});
};
exports.forgotPassword = forgotPassword;
const resetPasswordHandler = async (req, res) => {
    await checkCaptcha(req);
    const { email, code, password } = req.body;
    if (!(await (0, auth_code_service_1.resetPasswordWithCode)(email, code, password)))
        throw new api_error_1.ApiError(400, 'Reset code is invalid or expired');
    (0, session_service_1.clearSessionCookie)(res);
    (0, api_response_1.sendSuccess)(res, 200, 'Password reset successfully. Please sign in again.', {});
};
exports.resetPasswordHandler = resetPasswordHandler;
