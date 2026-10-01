"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = void 0;
const mongoose_1 = require("mongoose");
const template_validator_1 = require("../validators/template.validator");
const templateSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 120 },
    description: { type: String, maxlength: 1000 },
    category: { type: String, enum: template_validator_1.TEMPLATE_CATEGORIES, required: true },
    previewImage: { type: String, maxlength: 2048 },
    templateSpec: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
        validate: {
            validator: (value) => template_validator_1.templateSpecSchema.safeParse(value).success,
            message: 'Template specification is invalid',
        },
    },
    supportedSections: { type: [String], default: [] },
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', alias: 'createdBy', index: true },
}, { timestamps: true });
templateSchema.index({ name: 'text', description: 'text' });
templateSchema.index({ isActive: 1, category: 1, isPremium: 1, createdAt: -1 });
exports.Template = mongoose_1.models.Template || (0, mongoose_1.model)('Template', templateSchema);
