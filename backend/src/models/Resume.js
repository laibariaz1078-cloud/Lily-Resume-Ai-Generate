"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resume = void 0;
const mongoose_1 = require("mongoose");
const personalInfoSchema = new mongoose_1.Schema({
    fullName: String,
    email: String,
    phone: String,
    location: String,
    website: String,
    linkedin: String,
    github: String,
    profileImage: String,
}, { _id: false });
const experienceSchema = new mongoose_1.Schema({
    company: { type: String, required: true },
    position: { type: String, required: true },
    location: String,
    startDate: String,
    endDate: String,
    currentlyWorking: { type: Boolean, default: false },
    description: String,
    achievements: { type: [String], default: [] },
}, { _id: false });
const educationSchema = new mongoose_1.Schema({
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: String,
    startDate: String,
    endDate: String,
    description: String,
}, { _id: false });
const skillSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    category: String,
    proficiency: String,
}, { _id: false });
const projectSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: String,
    technologies: { type: [String], default: [] },
    url: String,
    githubUrl: String,
}, { _id: false });
const certificationSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    issuingOrganization: String,
    issueDate: String,
    expirationDate: String,
    credentialId: String,
    credentialUrl: String,
}, { _id: false });
const languageSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    proficiency: String,
}, { _id: false });
const achievementSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: String,
    date: String,
}, { _id: false });
const customSectionSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    content: String,
    items: { type: [String], default: [] },
}, { _id: false });
const designSettingsSchema = new mongoose_1.Schema({
    fontFamily: { type: String, default: 'Inter' },
    fontSize: { type: Number, default: 14 },
    primaryColor: { type: String, default: '#111827' },
    secondaryColor: { type: String, default: '#6B7280' },
    textColor: { type: String, default: '#111827' },
    backgroundColor: { type: String, default: '#FFFFFF' },
    spacing: { type: String, default: 'normal' },
    sectionSpacing: { type: String, default: 'normal' },
    headingStyle: { type: String, default: 'default' },
    borderStyle: { type: String, default: 'none' },
    lineHeight: { type: Number, default: 1.5 },
    layout: { type: String, default: 'single-column' },
}, { _id: false });
const resumeDataSchema = new mongoose_1.Schema({
    personalInfo: { type: personalInfoSchema, default: undefined },
    summary: String,
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    skills: { type: [skillSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    languages: { type: [languageSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },
    customSections: { type: [customSectionSchema], default: [] },
    designSettings: { type: designSettingsSchema, default: undefined },
}, { _id: false, strict: false });
const resumeSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    data: { type: resumeDataSchema, default: () => ({}) },
    favorite: { type: Boolean, default: false, alias: 'isFavorite' },
    currentVersion: { type: Number, default: 1 },
    templateId: { type: String, maxlength: 120 },
    isPermanent: { type: Boolean, default: false, required: true },
    expiresAt: { type: Date },
}, { timestamps: true });
resumeSchema.index({ userId: 1, updatedAt: -1 });
resumeSchema.index({ userId: 1, title: 1 });
resumeSchema.index({ userId: 1, favorite: 1 });
resumeSchema.index({ userId: 1, expiresAt: 1 });
exports.Resume = mongoose_1.models.Resume || (0, mongoose_1.model)('Resume', resumeSchema);
