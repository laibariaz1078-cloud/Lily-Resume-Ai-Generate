"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeVersion = void 0;
const mongoose_1 = require("mongoose");
const resumeVersionSchema = new mongoose_1.Schema({
    resumeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Resume', required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    versionNumber: { type: Number, required: true, default: 1 },
    snapshot: { type: mongoose_1.Schema.Types.Mixed, required: true },
    changeDescription: { type: String },
    title: { type: String, maxlength: 120 },
    data: { type: mongoose_1.Schema.Types.Mixed },
    favorite: { type: Boolean, default: false },
    templateId: { type: String, maxlength: 120 },
}, { timestamps: { createdAt: true, updatedAt: false } });
resumeVersionSchema.index({ resumeId: 1, userId: 1, createdAt: -1 });
exports.ResumeVersion = mongoose_1.models.ResumeVersion || (0, mongoose_1.model)('ResumeVersion', resumeVersionSchema);
