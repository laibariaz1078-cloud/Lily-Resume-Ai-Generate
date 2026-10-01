"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const template_model_1 = require("../models/Template");
const api_error_1 = require("../utils/api-error");
const template_validator_1 = require("../validators/template.validator");
exports.templateService = {
    async list(options) {
        const filter = { isActive: true, ownerId: null };
        if (options.category) {
            const normalizedCategory = template_validator_1.TEMPLATE_CATEGORIES.find((category) => category.toLowerCase() === options.category?.toLowerCase());
            if (!normalizedCategory)
                throw new api_error_1.ApiError(400, 'Unsupported template category');
            filter.category = normalizedCategory;
        }
        const premium = options.premium ?? (options.free ? (options.free === 'true' ? 'false' : 'true') : undefined);
        if (premium)
            filter.isPremium = premium === 'true';
        if (options.search)
            filter.$text = { $search: options.search };
        const sort = options.sort === 'name-asc'
            ? { name: 1 }
            : options.sort === 'name-desc'
                ? { name: -1 }
                : options.sort === 'relevance' && options.search
                    ? { score: -1 }
                    : { createdAt: -1 };
        const projection = options.sort === 'relevance' && options.search ? {
            name: 1,
            slug: 1,
            description: 1,
            category: 1,
            previewImage: 1,
            templateSpec: 1,
            supportedSections: 1,
            isPremium: 1,
            isActive: 1,
            ownerId: 1,
            createdAt: 1,
            updatedAt: 1,
            score: { $meta: 'textScore' },
        } : undefined;
        const [items, total] = await Promise.all([
            template_model_1.Template.find(filter, projection).sort(sort).skip((options.page - 1) * options.limit).limit(options.limit).lean().exec(),
            template_model_1.Template.countDocuments(filter),
        ]);
        return { items, pagination: { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) } };
    },
    async get(id) {
        const filter = { isActive: true, ownerId: null, ...(mongoose_1.default.isValidObjectId(id) ? { _id: id } : { slug: id }) };
        const template = await template_model_1.Template.findOne(filter).lean().exec();
        if (!template)
            throw new api_error_1.ApiError(404, 'Template not found');
        return template;
    },
    async create(input) {
        const template = await template_model_1.Template.create({ ...input, ownerId: null });
        return template.toObject();
    },
    async update(id, input) {
        const template = await template_model_1.Template.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean().exec();
        if (!template)
            throw new api_error_1.ApiError(404, 'Template not found');
        return template;
    },
    async remove(id) {
        const template = await template_model_1.Template.findByIdAndDelete(id).lean().exec();
        if (!template)
            throw new api_error_1.ApiError(404, 'Template not found');
    },
};
