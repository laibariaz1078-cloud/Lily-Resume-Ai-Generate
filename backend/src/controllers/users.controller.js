"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.changePassword = exports.updateProfile = exports.getProfile = exports.updateCurrentUser = void 0;
const user_model_1 = require("../models/User");
const user_service_1 = require("../services/user.service");
const api_error_1 = require("../utils/api-error");
const api_response_1 = require("../utils/api-response");
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
        user.email = updates.email;
        user.isEmailVerified = false;
    }
    await user.save();
    (0, api_response_1.sendSuccess)(res, 200, 'Profile updated successfully', { user: (0, user_service_1.toSafeUser)(user) });
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
