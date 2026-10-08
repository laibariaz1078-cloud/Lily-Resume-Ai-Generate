"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const job_validator_1 = require("../validators/job.validator");
const template_validator_1 = require("../validators/template.validator");
const resume_validator_1 = require("../validators/resume.validator");
const auth_validator_1 = require("../validators/auth.validator");
const validTemplateSpec = {
    layout: { columns: 'single', pageSize: 'A4' },
    typography: { headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: 11, headingScale: 1.3, lineHeight: 1.4 },
    spacing: { density: 'standard', sectionGap: 10, lineGap: 4 },
    colors: { primary: '#000000', accent: '#FFFFFF', text: '#111111', muted: '#777777', background: '#FFFFFF' },
    sectionOrder: ['summary', 'experience'],
    headerStyle: 'classic',
    sidebar: { enabled: false, position: 'left', widthPercent: 25 },
    borders: { style: 'none', color: '#000000' },
    icons: 'none',
};
(0, node_test_1.default)('accepts complete renderer-ready template specifications', () => {
    strict_1.default.equal(template_validator_1.templateSpecSchema.safeParse(validTemplateSpec).success, true);
});
(0, node_test_1.default)('rejects malformed renderer tokens and color values', () => {
    const invalid = { ...validTemplateSpec, colors: { ...validTemplateSpec.colors, primary: 'ultraviolet' } };
    strict_1.default.equal(template_validator_1.templateSpecSchema.safeParse(invalid).success, false);
});
(0, node_test_1.default)('requires a useful bounded job description', () => {
    strict_1.default.equal(job_validator_1.analyzeJobSchema.safeParse({ jobDescription: 'Too short' }).success, false);
    strict_1.default.equal(job_validator_1.analyzeJobSchema.safeParse({ jobDescription: 'A '.repeat(30) }).success, true);
    strict_1.default.equal(job_validator_1.analyzeJobSchema.safeParse({ jobDescription: 'x'.repeat(12001) }).success, false);
});
(0, node_test_1.default)('rejects resume data above its storage and processing budget', () => {
    strict_1.default.equal(resume_validator_1.resumeCreateSchema.safeParse({ title: 'Valid', data: { summary: 'x'.repeat(100_001) } }).success, false);
});
(0, node_test_1.default)('requires strong matching passwords and a CAPTCHA token during registration', () => {
    const valid = {
        name: 'Lily User',
        email: 'person@example.com',
        password: 'CareerStory42!',
        confirmPassword: 'CareerStory42!',
        captchaToken: 'turnstile-response',
    };
    strict_1.default.equal(auth_validator_1.signupSchema.safeParse(valid).success, true);
    strict_1.default.equal(auth_validator_1.signupSchema.safeParse({ ...valid, confirmPassword: 'Different42!' }).success, false);
    strict_1.default.equal(auth_validator_1.signupSchema.safeParse({ ...valid, password: 'alllowercase42!' }).success, false);
    strict_1.default.equal(auth_validator_1.signupSchema.safeParse({ ...valid, captchaToken: '' }).success, false);
});
(0, node_test_1.default)('requires a four-digit verification or reset code and a strong reset password', () => {
    const valid = {
        email: 'person@example.com',
        code: '0427',
        password: 'NewCareer42!',
        confirmPassword: 'NewCareer42!',
        captchaToken: 'turnstile-response',
    };
    strict_1.default.equal(auth_validator_1.resetPasswordSchema.safeParse(valid).success, true);
    strict_1.default.equal(auth_validator_1.resetPasswordSchema.safeParse({ ...valid, code: '427' }).success, false);
    strict_1.default.equal(auth_validator_1.resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'Mismatch42!' }).success, false);
    strict_1.default.equal(auth_validator_1.verifyEmailSchema.safeParse({ email: valid.email, code: valid.code, captchaToken: valid.captchaToken }).success, true);
});
