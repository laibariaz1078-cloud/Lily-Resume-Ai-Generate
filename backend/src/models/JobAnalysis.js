"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobAnalysis = void 0;
const mongoose_1 = require("mongoose");
const jobAnalysisSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    jobDescription: { type: String, required: true },
    resumeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Resume' },
    jobTitle: { type: String },
    company: { type: String },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    qualifications: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    analysisResult: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
jobAnalysisSchema.index({ userId: 1, createdAt: -1 });
exports.JobAnalysis = mongoose_1.models.JobAnalysis || (0, mongoose_1.model)('JobAnalysis', jobAnalysisSchema);
