"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIMessage = void 0;
const mongoose_1 = require("mongoose");
const aiMessageSchema = new mongoose_1.Schema({
    conversationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AIConversation', required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    content: { type: String, required: true },
    actions: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });
aiMessageSchema.index({ conversationId: 1, createdAt: 1 });
aiMessageSchema.index({ userId: 1, createdAt: -1 });
exports.AIMessage = mongoose_1.models.AIMessage || (0, mongoose_1.model)('AIMessage', aiMessageSchema);
