"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = require("mongoose");
const sessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, select: false },
    tokenVersion: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
}, { timestamps: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.Session = mongoose_1.models.Session || (0, mongoose_1.model)('Session', sessionSchema);
