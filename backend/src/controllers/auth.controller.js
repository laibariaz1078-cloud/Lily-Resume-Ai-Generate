"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordHandler = exports.forgotPassword = exports.logout = exports.currentUser = exports.login = exports.signup = void 0;
const user_model_1 = require("../models/User");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
const jwt_1 = require("../utils/jwt");
const user_service_1 = require("../services/user.service");
const password_reset_service_1 = require("../services/password-reset.service");
const signup = async (req, res) => {
    const { name, email, password } = req.body;
    const user = await user_model_1.User.create({ name, email, password });
    const token = (0, jwt_1.createAccessToken)(user);
    (0, api_response_1.sendSuccess)(res, 201, 'Account created successfully', { user: (0, user_service_1.toSafeUser)(user), token });
};
exports.signup = signup;
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await user_model_1.User.findOne({ email }).select('+password +tokenVersion');
    if (!user || !(await user.comparePassword(password))) {
        throw new api_error_1.ApiError(401, 'Invalid email or password');
    }
    user.lastLoginAt = new Date();
    await user.save();
    const token = (0, jwt_1.createAccessToken)(user);
    (0, api_response_1.sendSuccess)(res, 200, 'Login successful', { user: (0, user_service_1.toSafeUser)(user), token });
};
exports.login = login;
const currentUser = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    (0, api_response_1.sendSuccess)(res, 200, 'Current user retrieved', { user: req.authUser });
};
exports.currentUser = currentUser;
const logout = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const user = await user_model_1.User.findByIdAndUpdate(req.authUser.id, { $inc: { tokenVersion: 1 } });
    if (!user)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    (0, api_response_1.sendSuccess)(res, 200, 'Logged out successfully', {});
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        await (0, password_reset_service_1.requestPasswordReset)(email);
    }
    catch (error) {
        if (!(error instanceof password_reset_service_1.PasswordResetDeliveryError))
            throw error;
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Password reset email could not be delivered; SMTP configuration is required.');
        }
    }
    (0, api_response_1.sendSuccess)(res, 200, 'If an account exists for that email, password-reset instructions will be sent.', {});
};
exports.forgotPassword = forgotPassword;
const resetPasswordHandler = async (req, res) => {
    const { token, password } = req.body;
    const reset = await (0, password_reset_service_1.resetPassword)(token, password);
    if (!reset)
        throw new api_error_1.ApiError(400, 'Password reset token is invalid or expired');
    (0, api_response_1.sendSuccess)(res, 200, 'Password reset successfully. Please log in again.', {});
};
exports.resetPasswordHandler = resetPasswordHandler;
