"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.USER_PLANS = exports.USER_ROLES = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
exports.USER_ROLES = ['USER', 'ADMIN'];
exports.USER_PLANS = ['FREE', 'PREMIUM'];
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, select: false },
    profileImage: { type: String, maxlength: 2048 },
    settings: {
        type: mongoose_1.Schema.Types.Mixed,
        default: () => ({
            theme: 'SYSTEM',
            notifications: { weeklySummary: true, productNews: false },
            ai: { suggestions: true, considerJobDescriptions: true, requireReview: true },
        }),
    },
    role: { type: String, enum: exports.USER_ROLES, default: 'USER', required: true },
    plan: { type: String, enum: exports.USER_PLANS, default: 'FREE', required: true },
    isEmailVerified: { type: Boolean, default: false, required: true },
    lastLoginAt: { type: Date },
    tokenVersion: { type: Number, default: 0, select: false },
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpiresAt: { type: Date, default: null, select: false },
}, {
    timestamps: true,
    toJSON: {
        transform: (_document, value) => {
            delete value.password;
            delete value.tokenVersion;
            delete value.resetPasswordTokenHash;
            delete value.resetPasswordExpiresAt;
            delete value.__v;
            return value;
        },
    },
});
userSchema.pre('save', async function hashPassword() {
    if (!this.isModified('password'))
        return;
    this.password = await bcryptjs_1.default.hash(this.password, 12);
});
userSchema.methods.comparePassword = function comparePassword(candidate) {
    return bcryptjs_1.default.compare(candidate, this.password);
};
exports.User = mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema);
