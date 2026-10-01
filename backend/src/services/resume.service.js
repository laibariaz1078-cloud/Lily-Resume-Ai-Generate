"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeService = void 0;
exports.expirationInfo = expirationInfo;
const mongoose_1 = __importDefault(require("mongoose"));
const resume_model_1 = require("../models/Resume");
const resume_version_model_1 = require("../models/ResumeVersion");
const template_model_1 = require("../models/Template");
const api_error_1 = require("../utils/api-error");
const resume_data_1 = require("../utils/resume-data");
const subscription_service_1 = require("./subscription.service");
const FREE_RESUME_LIFETIME_MS = 10 * 24 * 60 * 60 * 1000;
function assertResumeId(id) {
    if (!mongoose_1.default.isValidObjectId(id))
        throw new api_error_1.ApiError(400, 'Invalid resume identifier');
}
function expirationInfo(resume) {
    if (resume.isPermanent)
        return { state: 'PERMANENT', isActive: true, isExpired: false, expiresAt: null };
    const isExpired = !!resume.expiresAt && resume.expiresAt <= new Date();
    return { state: isExpired ? 'EXPIRED' : 'ACTIVE', isActive: !isExpired, isExpired, expiresAt: resume.expiresAt };
}
async function ensureTemplateAccess(userId, templateId, existingTemplateId) {
    if (!templateId || templateId === existingTemplateId)
        return;
    const alternatives = [{ slug: templateId }, ...(mongoose_1.default.isValidObjectId(templateId) ? [{ _id: templateId }] : [])];
    const template = await template_model_1.Template.findOne({ isActive: true, ownerId: null, $or: alternatives }).exec();
    if (!template)
        throw new api_error_1.ApiError(404, 'Template not found');
    if (template.isPremium && await subscription_service_1.subscriptionService.planForUser(userId) !== 'PREMIUM') {
        throw new api_error_1.ApiError(403, 'A premium plan is required to use this template');
    }
}
async function getOwned(userId, id) {
    assertResumeId(id);
    const resume = await resume_model_1.Resume.findOne({ _id: id, userId }).exec();
    if (!resume)
        throw new api_error_1.ApiError(404, 'Resume not found');
    return resume;
}
function snapshot(resume) {
    return {
        resumeId: resume._id,
        userId: resume.userId,
        versionNumber: resume.currentVersion,
        snapshot: {
            title: resume.title,
            data: resume.data,
            favorite: resume.favorite,
            templateId: resume.templateId,
        },
        title: resume.title,
        data: resume.data,
        favorite: resume.favorite,
        templateId: resume.templateId,
    };
}
async function saveVersion(resume) {
    await resume_version_model_1.ResumeVersion.create(snapshot(resume));
}
exports.resumeService = {
    async list(userId, options) {
        const filter = { userId };
        if (options.favorite)
            filter.favorite = options.favorite === 'true';
        const [items, total] = await Promise.all([
            resume_model_1.Resume.find(filter).sort({ updatedAt: -1 }).skip((options.page - 1) * options.limit).limit(options.limit).lean().exec(),
            resume_model_1.Resume.countDocuments(filter),
        ]);
        return {
            items: items.map((item) => ({ ...item, expiration: expirationInfo(item) })),
            pagination: { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) },
        };
    },
    async get(userId, id) {
        const resume = await getOwned(userId, id);
        return { ...resume.toObject(), expiration: expirationInfo(resume) };
    },
    async create(userId, input) {
        await ensureTemplateAccess(userId, input.templateId);
        const plan = await subscription_service_1.subscriptionService.planForUser(userId);
        const now = new Date();
        const resume = await resume_model_1.Resume.create({
            userId,
            title: input.title,
            data: input.data,
            favorite: input.favorite,
            templateId: input.templateId,
            isPermanent: plan === 'PREMIUM',
            expiresAt: plan === 'PREMIUM' ? null : new Date(now.getTime() + FREE_RESUME_LIFETIME_MS),
        });
        await saveVersion(resume);
        return { ...resume.toObject(), expiration: expirationInfo(resume) };
    },
    async update(userId, id, input) {
        const resume = await getOwned(userId, id);
        const expiration = expirationInfo(resume);
        if (expiration.isExpired)
            throw new api_error_1.ApiError(410, 'This resume has expired');
        await ensureTemplateAccess(userId, input.templateId, resume.templateId);
        await saveVersion(resume);
        if (input.title !== undefined)
            resume.title = input.title;
        if (input.data !== undefined)
            resume.data = (0, resume_data_1.mergeResumeData)(resume.data, input.data);
        if (input.favorite !== undefined)
            resume.favorite = input.favorite;
        if (input.templateId !== undefined)
            resume.templateId = input.templateId;
        resume.currentVersion += 1;
        await resume.save();
        return { ...resume.toObject(), expiration: expirationInfo(resume) };
    },
    async remove(userId, id) {
        const resume = await getOwned(userId, id);
        await resume.deleteOne();
        await resume_version_model_1.ResumeVersion.deleteMany({ resumeId: resume._id, userId });
    },
    async versions(userId, id, page, limit) {
        const resume = await getOwned(userId, id);
        const filter = { resumeId: resume._id, userId };
        const [items, total] = await Promise.all([
            resume_version_model_1.ResumeVersion.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
            resume_version_model_1.ResumeVersion.countDocuments(filter),
        ]);
        return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    },
    async restoreVersion(userId, id, versionId) {
        const resume = await getOwned(userId, id);
        assertResumeId(versionId);
        const version = await resume_version_model_1.ResumeVersion.findOne({ _id: versionId, resumeId: resume._id, userId }).exec();
        if (!version)
            throw new api_error_1.ApiError(404, 'Resume version not found');
        if (expirationInfo(resume).isExpired)
            throw new api_error_1.ApiError(410, 'This resume has expired');
        await saveVersion(resume);
        const restored = (version.snapshot ?? {});
        resume.title = restored.title ?? version.title ?? resume.title;
        resume.data = restored.data ?? version.data ?? resume.data;
        resume.favorite = restored.favorite ?? version.favorite ?? resume.favorite;
        if (Object.hasOwn(restored, 'templateId'))
            resume.templateId = restored.templateId;
        else
            resume.templateId = version.templateId;
        resume.currentVersion += 1;
        await resume.save();
        return { ...resume.toObject(), expiration: expirationInfo(resume) };
    },
};
