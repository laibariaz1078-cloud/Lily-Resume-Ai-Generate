"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = exports.SUBSCRIPTION_STATUSES = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("./User");
exports.SUBSCRIPTION_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'];
const subscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: user_model_1.USER_PLANS, required: true, default: 'FREE' },
    status: { type: String, enum: exports.SUBSCRIPTION_STATUSES, required: true, default: 'ACTIVE' },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true });
subscriptionSchema.index({ plan: 1, status: 1 });
exports.Subscription = mongoose_1.models.Subscription || (0, mongoose_1.model)('Subscription', subscriptionSchema);
