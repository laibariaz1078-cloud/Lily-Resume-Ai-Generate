"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIUsage = void 0;
const mongoose_1 = require("mongoose");
const aiUsageSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    operation: { type: String, required: true, maxlength: 50 },
    tokensUsed: { type: Number, min: 0, default: 0 },
    model: { type: String },
    provider: { type: String },
    requestId: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });
aiUsageSchema.index({ userId: 1, createdAt: -1 });
exports.AIUsage = mongoose_1.models.AIUsage || (0, mongoose_1.model)('AIUsage', aiUsageSchema);
