"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettings = void 0;
const mongoose_1 = require("mongoose");
const userSettingsSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    preferences: { type: mongoose_1.Schema.Types.Mixed },
    theme: { type: String, enum: ['SYSTEM', 'LIGHT', 'DARK'], default: 'SYSTEM' },
    language: { type: String, default: 'en' },
    emailNotifications: { type: Boolean, default: true },
    aiNotifications: { type: Boolean, default: true },
}, { timestamps: true });
exports.UserSettings = mongoose_1.models.UserSettings || (0, mongoose_1.model)('UserSettings', userSettingsSchema);
