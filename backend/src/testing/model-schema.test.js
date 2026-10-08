"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const mongoose_1 = require("mongoose");
const ai_conversation_model_1 = require("../models/AIConversation");
const ai_message_model_1 = require("../models/AIMessage");
const ai_usage_model_1 = require("../models/AIUsage");
const job_analysis_model_1 = require("../models/JobAnalysis");
const resume_model_1 = require("../models/Resume");
const resume_analysis_model_1 = require("../models/ResumeAnalysis");
const resume_version_model_1 = require("../models/ResumeVersion");
const subscription_model_1 = require("../models/Subscription");
const template_model_1 = require("../models/Template");
const user_model_1 = require("../models/User");
const user_settings_model_1 = require("../models/UserSettings");
const session_model_1 = require("../models/Session");
const resume_data_1 = require("../utils/resume-data");
const resume_validator_1 = require("../validators/resume.validator");
const userId = new mongoose_1.Types.ObjectId();
const validTemplateSpec = {
    layout: { columns: 'single', pageSize: 'A4' },
    typography: { headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: 11, headingScale: 1.3, lineHeight: 1.4 },
    spacing: { density: 'standard', sectionGap: 10, lineGap: 4 },
    colors: { primary: '#000000', accent: '#FFFFFF', text: '#111111', muted: '#777777', background: '#FFFFFF' },
    sectionOrder: ['summary'],
    headerStyle: 'classic',
    sidebar: { enabled: false, position: 'left', widthPercent: 25 },
    borders: { style: 'none', color: '#000000' },
    icons: 'none',
};
(0, node_test_1.default)('user model requires credentials, applies account defaults, and protects password', async () => {
    const user = new user_model_1.User({ name: 'Resume User', email: 'resume@example.com', password: 'secret-password' });
    await user.validate();
    strict_1.default.equal(user.role, 'USER');
    strict_1.default.equal(user.plan, 'FREE');
    strict_1.default.equal(user.isEmailVerified, false);
    strict_1.default.equal(user.profileImage, undefined);
    strict_1.default.equal(user.lastLoginAt, undefined);
    strict_1.default.equal(user_model_1.User.schema.path('password').options.select, false);
    strict_1.default.equal(user.toJSON().password, undefined);
    await strict_1.default.rejects(new user_model_1.User({ email: 'missing@example.com' }).validate());
});
(0, node_test_1.default)('resume can start with only userId and title and receives empty section defaults', async () => {
    strict_1.default.equal(resume_validator_1.resumeCreateSchema.safeParse({ title: 'Starter' }).success, true);
    const resume = new resume_model_1.Resume({ userId, title: 'Starter' });
    await resume.validate();
    const data = resume.data;
    strict_1.default.equal(resume.favorite, false);
    strict_1.default.equal(resume.isFavorite, false);
    strict_1.default.equal(resume.isPermanent, false);
    strict_1.default.equal(resume.currentVersion, 1);
    strict_1.default.deepEqual(data.experience, []);
    strict_1.default.deepEqual(data.education, []);
    strict_1.default.deepEqual(data.skills, []);
    strict_1.default.deepEqual(data.projects, []);
    strict_1.default.deepEqual(data.certifications, []);
    strict_1.default.deepEqual(data.languages, []);
    strict_1.default.deepEqual(data.achievements, []);
    strict_1.default.deepEqual(data.customSections, []);
    strict_1.default.equal(data.personalInfo, undefined);
    strict_1.default.equal(data.designSettings, undefined);
    strict_1.default.equal(resume_model_1.Resume.schema.options.timestamps, true);
    strict_1.default.equal(user_model_1.User.schema.options.timestamps, true);
});
(0, node_test_1.default)('resume section requirements stay local to provided entries', async () => {
    const resume = new resume_model_1.Resume({
        userId,
        title: 'Gradual',
        data: { experience: [{ company: 'Example Co', position: 'Engineer', currentlyWorking: true }] },
    });
    await resume.validate();
    strict_1.default.equal(resume.data.experience[0].endDate, undefined);
    const invalid = new resume_model_1.Resume({ userId, title: 'Invalid', data: { experience: [{ company: 'Example Co' }] } });
    await strict_1.default.rejects(invalid.validate(), /position/);
    const incompleteSections = [
        { education: [{}] },
        { skills: [{}] },
        { projects: [{}] },
        { certifications: [{}] },
        { languages: [{}] },
        { achievements: [{}] },
        { customSections: [{}] },
    ];
    for (const data of incompleteSections) {
        await strict_1.default.rejects(new resume_model_1.Resume({ userId, title: 'Incomplete', data }).validate());
    }
    const optionalFieldsOmitted = new resume_model_1.Resume({
        userId,
        title: 'Minimum entries',
        data: {
            personalInfo: {},
            education: [{ institution: 'Example School', degree: 'Degree' }],
            skills: [{ name: 'Writing' }],
            projects: [{ name: 'Project' }],
            certifications: [{ name: 'Certificate' }],
            languages: [{ name: 'English' }],
            achievements: [{ title: 'Award' }],
            customSections: [{ title: 'Additional' }],
            designSettings: { primaryColor: '#123456' },
        },
    });
    await optionalFieldsOmitted.validate();
    strict_1.default.equal(optionalFieldsOmitted.data.designSettings.fontFamily, 'Inter');
    strict_1.default.equal(optionalFieldsOmitted.data.designSettings.primaryColor, '#123456');
});
(0, node_test_1.default)('partial resume data updates preserve omitted sections and explicit values', () => {
    const original = { summary: 'Old', experience: [{ company: 'Example Co' }], personalInfo: { fullName: 'A Person' } };
    const resume = new resume_model_1.Resume({ userId, title: 'Partial', data: original });
    strict_1.default.deepEqual((0, resume_data_1.mergeResumeData)(resume.data, { summary: 'New', personalInfo: { email: null } }), {
        summary: 'New',
        experience: [{ company: 'Example Co', currentlyWorking: false, achievements: [] }],
        personalInfo: { fullName: 'A Person', email: null },
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        achievements: [],
        customSections: [],
    });
});
(0, node_test_1.default)('remaining models apply requested optional and default behavior', async () => {
    const version = new resume_version_model_1.ResumeVersion({ resumeId: new mongoose_1.Types.ObjectId(), userId, snapshot: {} });
    await version.validate();
    strict_1.default.equal(version.versionNumber, 1);
    const template = new template_model_1.Template({ name: 'Minimal', slug: 'minimal', category: 'Modern', templateSpec: validTemplateSpec });
    await template.validate();
    strict_1.default.deepEqual(template.supportedSections, []);
    strict_1.default.equal(template.previewImage, undefined);
    strict_1.default.equal(template.description, undefined);
    strict_1.default.equal(template.isPremium, false);
    strict_1.default.equal(template.isActive, true);
    const subscription = new subscription_model_1.Subscription({ userId });
    await subscription.validate();
    strict_1.default.equal(subscription.plan, 'FREE');
    strict_1.default.equal(subscription.status, 'ACTIVE');
    strict_1.default.equal(subscription.isActive, true);
    strict_1.default.equal(subscription.startDate, undefined);
    strict_1.default.equal(subscription.endDate, undefined);
    const usage = new ai_usage_model_1.AIUsage({ userId, operation: 'analysis' });
    await usage.validate();
    strict_1.default.equal(usage.tokensUsed, 0);
    const usageWithDetails = new ai_usage_model_1.AIUsage({ userId, operation: 'analysis', tokensUsed: null, model: 'example-model' });
    strict_1.default.equal(usageWithDetails.get('tokensUsed'), null);
    strict_1.default.equal(usageWithDetails.get('model'), 'example-model');
    const analysis = new resume_analysis_model_1.ResumeAnalysis({ userId, resumeId: 'resume-id', type: 'GENERAL' });
    await analysis.validate();
    strict_1.default.deepEqual(analysis.suggestions, []);
    strict_1.default.equal(analysis.score, undefined);
    const conversation = new ai_conversation_model_1.AIConversation({ userId });
    await conversation.validate();
    strict_1.default.equal(conversation.title, 'Resume Assistant');
    const message = new ai_message_model_1.AIMessage({ conversationId: new mongoose_1.Types.ObjectId(), userId, role: 'assistant', content: 'Ready' });
    await message.validate();
    strict_1.default.deepEqual(message.actions, []);
    strict_1.default.equal(message.metadata, undefined);
    const settings = new user_settings_model_1.UserSettings({ userId });
    await settings.validate();
    strict_1.default.equal(settings.theme, 'SYSTEM');
    strict_1.default.equal(settings.language, 'en');
    strict_1.default.equal(settings.emailNotifications, true);
    strict_1.default.equal(settings.aiNotifications, true);
    const job = new job_analysis_model_1.JobAnalysis({ userId, jobDescription: 'A role description.' });
    await job.validate();
    strict_1.default.deepEqual(job.requiredSkills, []);
    strict_1.default.deepEqual(job.preferredSkills, []);
    strict_1.default.deepEqual(job.technologies, []);
    strict_1.default.deepEqual(job.responsibilities, []);
    strict_1.default.deepEqual(job.qualifications, []);
    strict_1.default.deepEqual(job.keywords, []);
});
(0, node_test_1.default)('session tokens are hashed and session expiry is required', async () => {
    const session = new session_model_1.Session({
        userId,
        tokenHash: 'a'.repeat(64),
        tokenVersion: 0,
        expiresAt: new Date(Date.now() + 60_000),
    });
    await session.validate();
    strict_1.default.equal(session_model_1.Session.schema.path('tokenHash').options.select, false);
    strict_1.default.equal(session_model_1.Session.schema.indexes().some(([keys, options]) => keys.expiresAt === 1 && options.expireAfterSeconds === 0), true);
    await strict_1.default.rejects(new session_model_1.Session({ userId, tokenHash: 'b'.repeat(64), tokenVersion: 0 }).validate());
});
