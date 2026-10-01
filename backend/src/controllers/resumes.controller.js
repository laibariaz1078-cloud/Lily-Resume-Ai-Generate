"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportResume = exports.restoreResumeVersion = exports.listResumeVersions = exports.deleteResume = exports.updateResume = exports.createResume = exports.getResume = exports.listResumes = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const resume_analysis_model_1 = require("../models/ResumeAnalysis");
const pdf_service_1 = require("../services/pdf.service");
const resume_service_1 = require("../services/resume.service");
const api_response_1 = require("../utils/api-response");
const api_error_1 = require("../utils/api-error");
const resume_validator_1 = require("../validators/resume.validator");
const zod_1 = require("zod");
const pageQuerySchema = zod_1.z.object({ page: zod_1.z.coerce.number().int().min(1).default(1), limit: zod_1.z.coerce.number().int().min(1).max(100).default(20) });
function userId(req) {
    if (!req.authUser)
        throw new api_error_1.ApiError(401, 'Authentication is required');
    return req.authUser.id;
}
function routeId(value) {
    if (typeof value !== 'string' || !mongoose_1.default.isValidObjectId(value))
        throw new api_error_1.ApiError(400, 'Invalid resume identifier');
    return value;
}
const listResumes = async (req, res) => {
    const parsed = resume_validator_1.resumeListQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw new api_error_1.ApiError(400, 'Request validation failed', parsed.error.issues.map((issue) => ({ field: issue.path.join('.') || 'query', message: issue.message })));
    const result = await resume_service_1.resumeService.list(userId(req), parsed.data);
    (0, api_response_1.sendSuccess)(res, 200, 'Resumes retrieved', result);
};
exports.listResumes = listResumes;
const getResume = async (req, res) => {
    const resume = await resume_service_1.resumeService.get(userId(req), routeId(req.params.id));
    (0, api_response_1.sendSuccess)(res, 200, 'Resume retrieved', { resume });
};
exports.getResume = getResume;
const createResume = async (req, res) => {
    const resume = await resume_service_1.resumeService.create(userId(req), req.body);
    (0, api_response_1.sendSuccess)(res, 201, 'Resume created', { resume });
};
exports.createResume = createResume;
const updateResume = async (req, res) => {
    const resume = await resume_service_1.resumeService.update(userId(req), routeId(req.params.id), req.body);
    (0, api_response_1.sendSuccess)(res, 200, 'Resume updated', { resume });
};
exports.updateResume = updateResume;
const deleteResume = async (req, res) => {
    const id = routeId(req.params.id);
    await resume_service_1.resumeService.remove(userId(req), id);
    await resume_analysis_model_1.ResumeAnalysis.deleteMany({ userId: userId(req), resumeId: id });
    (0, api_response_1.sendSuccess)(res, 200, 'Resume deleted', {});
};
exports.deleteResume = deleteResume;
const listResumeVersions = async (req, res) => {
    const parsed = pageQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw new api_error_1.ApiError(400, 'Request validation failed', parsed.error.issues.map((issue) => ({ field: issue.path.join('.') || 'query', message: issue.message })));
    const result = await resume_service_1.resumeService.versions(userId(req), routeId(req.params.id), parsed.data.page, parsed.data.limit);
    (0, api_response_1.sendSuccess)(res, 200, 'Resume versions retrieved', result);
};
exports.listResumeVersions = listResumeVersions;
const restoreResumeVersion = async (req, res) => {
    const resume = await resume_service_1.resumeService.restoreVersion(userId(req), routeId(req.params.id), routeId(req.params.versionId));
    (0, api_response_1.sendSuccess)(res, 200, 'Resume version restored', { resume });
};
exports.restoreResumeVersion = restoreResumeVersion;
const exportResume = async (req, res) => {
    const result = await (0, pdf_service_1.exportResumePdf)(userId(req), routeId(req.params.id));
    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(result.buffer);
};
exports.exportResume = exportResume;
