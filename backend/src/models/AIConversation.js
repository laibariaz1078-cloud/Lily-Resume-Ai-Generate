"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIConversation = void 0;
const mongoose_1 = require("mongoose");
const aiConversationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Resume' },
    title: { type: String, default: 'Resume Assistant' },
}, { timestamps: true });
aiConversationSchema.index({ userId: 1, updatedAt: -1 });
exports.AIConversation = mongoose_1.models.AIConversation || (0, mongoose_1.model)('AIConversation', aiConversationSchema);
