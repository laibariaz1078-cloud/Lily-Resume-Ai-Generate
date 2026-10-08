"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.changePassword = exports.updateProfile = exports.getProfile = exports.updateCurrentUser = void 0;
const user_model_1 = require("../models/User");
const user_service_1 = require("../services/user.service");
const api_error_1 = require("../utils/api-error");
const api_response_1 = require("../utils/api-response");
const session_service_1 = require("../services/session.service");
const auth_code_service_1 = require("../services/auth-code.service");
const updateCurrentUser = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const updates = req.body;
    const user = await user_model_1.User.findByIdAndUpdate(req.authUser.id, { $set: updates }, {
        new: true,
        runValidators: true,
        projection: { password: 0, tokenVersion: 0, resetPasswordTokenHash: 0, resetPasswordExpiresAt: 0 },
    });
    if (!user)
        throw new api_error_1.ApiError(404, 'User account not found');
    (0, api_response_1.sendSuccess)(res, 200, 'Profile updated successfully', { user: (0, user_service_1.toSafeUser)(user) });
};
exports.updateCurrentUser = updateCurrentUser;
const getProfile = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const user = await user_model_1.User.findById(req.authUser.id);
    if (!user)
        throw new api_error_1.ApiError(404, 'User account not found');
    (0, api_response_1.sendSuccess)(res, 200, 'Profile retrieved', { user: (0, user_service_1.toSafeUser)(user) });
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const updates = req.body;
    const user = await user_model_1.User.findById(req.authUser.id);
    if (!user)
        throw new api_error_1.ApiError(404, 'User account not found');
    if (updates.name !== undefined)
        user.name = updates.name;
    if (updates.profileImage !== undefined)
        user.profileImage = updates.profileImage;
    if (updates.email !== undefined && updates.email !== user.email) {
        if (await user_model_1.User.exists({ email: updates.email }))
            throw new api_error_1.ApiError(409, 'An account with this email already exists');
        user.pendingEmail = updates.email;
    }
    await user.save();
    if (updates.email !== undefined && updates.email !== user.email)
        await (0, auth_code_service_1.issueEmailVerificationCode)(user);
    const message = updates.email !== undefined && updates.email !== user.email
        ? 'Profile updated. Verify the new email address to complete the change.'
        : 'Profile updated successfully';
    (0, api_response_1.sendSuccess)(res, 200, message, {
        user: (0, user_service_1.toSafeUser)(user),
        verificationEmail: user.pendingEmail || null,
    });
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const input = req.body;
    const user = await user_model_1.User.findById(req.authUser.id).select('+password +tokenVersion');
    if (!user)
        throw new api_error_1.ApiError(404, 'User account not found');
    if (!(await user.comparePassword(input.currentPassword)))
        throw new api_error_1.ApiError(400, 'Current password is incorrect');
    user.password = input.newPassword;
    user.tokenVersion += 1;
    await user.save();
    await (0, session_service_1.revokeAllUserSessions)(user._id);
    (0, session_service_1.clearSessionCookie)(res);
    (0, api_response_1.sendSuccess)(res, 200, 'Password changed. Please sign in again.', {});
};
exports.changePassword = changePassword;
const updateSettings = async (req, res) => {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    const user = await user_model_1.User.findById(req.authUser.id);
    if (!user)
        throw new api_error_1.ApiError(404, 'User account not found');
    const updates = req.body;
    const current = user.settings ?? {};
    user.settings = {
        ...current,
        ...updates,
        notifications: { ...(current.notifications ?? {}), ...(updates.notifications ?? {}) },
        ai: { ...(current.ai ?? {}), ...(updates.ai ?? {}) },
    };
    await user.save();
    (0, api_response_1.sendSuccess)(res, 200, 'Settings updated', { settings: user.settings });
};
exports.updateSettings = updateSettings;
