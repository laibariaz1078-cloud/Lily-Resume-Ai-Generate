"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeAnalysis = exports.RESUME_ANALYSIS_TYPES = void 0;
const mongoose_1 = require("mongoose");
exports.RESUME_ANALYSIS_TYPES = ['GENERAL', 'ATS', 'JOB_MATCH', 'CONTENT'];
const resumeAnalysisSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeId: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: exports.RESUME_ANALYSIS_TYPES, required: true },
    score: { type: Number, min: 0, max: 100 },
    result: { type: mongoose_1.Schema.Types.Mixed },
    suggestions: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
}, { timestamps: { createdAt: true, updatedAt: false } });
resumeAnalysisSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ userId: 1, type: 1, createdAt: -1 });
exports.ResumeAnalysis = mongoose_1.models.ResumeAnalysis || (0, mongoose_1.model)('ResumeAnalysis', resumeAnalysisSchema);
