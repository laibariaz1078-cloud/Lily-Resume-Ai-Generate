"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("../app");
const database_1 = require("../config/database");
const user_model_1 = require("../models/User");
const resume_model_1 = require("../models/Resume");
const resume_version_model_1 = require("../models/ResumeVersion");
const resume_analysis_model_1 = require("../models/ResumeAnalysis");
const subscription_model_1 = require("../models/Subscription");
const ai_usage_model_1 = require("../models/AIUsage");
const jwt_1 = require("../utils/jwt");
const template_model_1 = require("../models/Template");
async function run() {
    await (0, database_1.connectDatabase)();
    let server;
    let testUserId;
    let secondaryUserId;
    let testTemplateId;
    try {
        server = app_1.app.listen(0);
        await new Promise((resolve, reject) => {
            server?.once('listening', resolve);
            server?.once('error', reject);
        });
        const address = server.address();
        (0, strict_1.default)(address && typeof address !== 'string', 'Expected an ephemeral HTTP server address');
        const baseUrl = `http://127.0.0.1:${address.port}`;
        async function request(path, init) {
            const response = await fetch(`${baseUrl}${path}`, init);
            return { status: response.status, body: await response.json() };
        }
        async function rawRequest(path, init) {
            return fetch(`${baseUrl}${path}`, init);
        }
        const email = `smoke-${(0, node_crypto_1.randomBytes)(8).toString('hex')}@example.test`;
        const signup = await request('/api/auth/signup', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'Smoke Test', email, password: 'InitialSmokePass42' }),
        });
        strict_1.default.equal(signup.status, 201);
        strict_1.default.equal(signup.body.success, true);
        const signupData = signup.body.data;
        testUserId = signupData.user.id;
        strict_1.default.equal(signupData.user.email, email);
        strict_1.default.equal('password' in signupData.user, false);
        const duplicateSignup = await request('/api/auth/signup', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'Smoke Test', email, password: 'InitialSmokePass42' }),
        });
        strict_1.default.equal(duplicateSignup.status, 409);
        const storedUser = await user_model_1.User.findById(testUserId).select('+password');
        (0, strict_1.default)(storedUser?.password.startsWith('$2'), 'Password must be stored as a bcrypt hash');
        const protectedHeaders = { authorization: `Bearer ${signupData.token}` };
        const currentUser = await request('/api/auth/me', { headers: protectedHeaders });
        strict_1.default.equal(currentUser.status, 200);
        strict_1.default.equal(currentUser.body.data?.user && currentUser.body.data.user.email, email);
        const profileUpdate = await request('/api/users/me', {
            method: 'PATCH',
            headers: { ...protectedHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'Updated Smoke Name' }),
        });
        strict_1.default.equal(profileUpdate.status, 200);
        strict_1.default.equal((profileUpdate.body.data?.user).name, 'Updated Smoke Name');
        const profile = await request('/api/users/profile', { headers: protectedHeaders });
        strict_1.default.equal(profile.status, 200);
        const settingsUpdate = await request('/api/users/settings', {
            method: 'PATCH', headers: { ...protectedHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ theme: 'DARK', notifications: { weeklySummary: false } }),
        });
        strict_1.default.equal(settingsUpdate.status, 200);
        strict_1.default.equal((settingsUpdate.body.data?.settings).theme, 'DARK');
        const resumeCreate = await request('/api/resumes', {
            method: 'POST', headers: { ...protectedHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({
                title: 'Smoke Resume',
                data: { fullName: 'Smoke Person', title: 'Engineer', summary: 'Built verified systems.', order: ['summary'], hidden: {} },
            }),
        });
        strict_1.default.equal(resumeCreate.status, 201, resumeCreate.body.message);
        const createdResume = resumeCreate.body.data.resume;
        strict_1.default.equal(createdResume.isPermanent, false);
        (0, strict_1.default)(Date.parse(createdResume.expiresAt) > Date.now());
        const resumeId = createdResume._id;
        const templateSpec = {
            layout: { columns: 'single', pageSize: 'A4' },
            typography: { headingFont: 'Helvetica', bodyFont: 'Helvetica', baseFontSize: 10, headingScale: 1.3, lineHeight: 1.4 },
            spacing: { density: 'standard', sectionGap: 10, lineGap: 4 },
            colors: { primary: '#205B4B', accent: '#C36E50', text: '#202522', muted: '#5F6963', background: '#FFFFFF' },
            sectionOrder: ['summary', 'experience'],
            headerStyle: 'classic',
            sidebar: { enabled: false, position: 'left', widthPercent: 30 },
            borders: { style: 'subtle', color: '#D7DFDA' },
            icons: 'none',
        };
        const template = await template_model_1.Template.create({
            name: 'Smoke Premium',
            slug: `smoke-premium-${(0, node_crypto_1.randomBytes)(5).toString('hex')}`,
            category: 'Modern',
            templateSpec,
            supportedSections: ['summary', 'experience'],
            isPremium: true,
            isActive: true,
        });
        testTemplateId = template.id;
        const publicTemplate = await request(`/api/templates/${template.slug}`);
        strict_1.default.equal(publicTemplate.status, 200);
        strict_1.default.equal((publicTemplate.body.data?.template).templateSpec, null);
        const freeTemplate = await request(`/api/templates/${template.slug}`, { headers: protectedHeaders });
        strict_1.default.equal((freeTemplate.body.data?.template).templateSpec, null);
        const deniedSelection = await request(`/api/resumes/${resumeId}`, {
            method: 'PUT', headers: { ...protectedHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ templateId: template.slug }),
        });
        strict_1.default.equal(deniedSelection.status, 403);
        const versionList = await request(`/api/resumes/${resumeId}/versions`, { headers: protectedHeaders });
        strict_1.default.equal(versionList.status, 200);
        const firstVersion = versionList.body.data.items[0];
        (0, strict_1.default)(firstVersion);
        const resumeUpdate = await request(`/api/resumes/${resumeId}`, {
            method: 'PUT', headers: { ...protectedHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ title: 'Changed Smoke Resume' }),
        });
        strict_1.default.equal(resumeUpdate.status, 200);
        const restore = await request(`/api/resumes/${resumeId}/versions/${firstVersion._id}/restore`, {
            method: 'POST', headers: protectedHeaders,
        });
        strict_1.default.equal(restore.status, 200);
        strict_1.default.equal((restore.body.data?.resume).title, 'Smoke Resume');
        const pdf = await rawRequest(`/api/resumes/${resumeId}/export/pdf`, { method: 'POST', headers: protectedHeaders });
        strict_1.default.equal(pdf.status, 200);
        strict_1.default.match(pdf.headers.get('content-type') ?? '', /application\/pdf/);
        strict_1.default.equal((await pdf.arrayBuffer().then((value) => Buffer.from(value))).subarray(0, 4).toString(), '%PDF');
        const otherUser = await user_model_1.User.create({ name: 'Other User', email: `other-${(0, node_crypto_1.randomBytes)(8).toString('hex')}@example.test`, password: 'OtherSmokePass42' });
        secondaryUserId = otherUser.id;
        const otherToken = (0, jwt_1.createAccessToken)(otherUser);
        const crossUserRead = await request(`/api/resumes/${resumeId}`, { headers: { authorization: `Bearer ${otherToken}` } });
        strict_1.default.equal(crossUserRead.status, 404);
        const nonAdmin = await request('/api/admin/stats', { headers: { authorization: `Bearer ${otherToken}` } });
        strict_1.default.equal(nonAdmin.status, 403);
        const crossUserMatch = await request('/api/jobs/match-resume', {
            method: 'POST', headers: { authorization: `Bearer ${otherToken}`, 'content-type': 'application/json' },
            body: JSON.stringify({ resumeId, jobDescription: 'A'.repeat(80) }),
        });
        strict_1.default.equal(crossUserMatch.status, 404, crossUserMatch.body.message);
        await resume_model_1.Resume.updateOne({ _id: resumeId, userId: testUserId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
        const expiredResume = await request(`/api/resumes/${resumeId}`, { headers: protectedHeaders });
        strict_1.default.equal(expiredResume.status, 200);
        strict_1.default.equal((expiredResume.body.data?.resume).expiration.state, 'EXPIRED');
        (0, strict_1.default)(await resume_model_1.Resume.exists({ _id: resumeId, userId: testUserId }), 'Expired resumes must not be automatically deleted');
        const expiredUpdate = await request(`/api/resumes/${resumeId}`, {
            method: 'PUT', headers: { ...protectedHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ title: 'Expired Update' }),
        });
        strict_1.default.equal(expiredUpdate.status, 410);
        const expiredPdf = await rawRequest(`/api/resumes/${resumeId}/export/pdf`, { method: 'POST', headers: protectedHeaders });
        strict_1.default.equal(expiredPdf.status, 410);
        const subscriptionBefore = await request('/api/subscription', { headers: protectedHeaders });
        strict_1.default.equal(subscriptionBefore.status, 200);
        const upgrade = await request('/api/subscription/upgrade', {
            method: 'POST', headers: { ...protectedHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ plan: 'PREMIUM' }),
        });
        strict_1.default.equal(upgrade.status, 200);
        const premiumTemplate = await request(`/api/templates/${template.slug}`, { headers: protectedHeaders });
        strict_1.default.equal((premiumTemplate.body.data?.template).templateSpec.layout.pageSize, 'A4');
        const templateSelection = await request(`/api/resumes/${resumeId}`, {
            method: 'PUT', headers: { ...protectedHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ templateId: template.slug }),
        });
        strict_1.default.equal(templateSelection.status, 200);
        const permanentResume = await resume_model_1.Resume.findById(resumeId);
        strict_1.default.equal(permanentResume?.isPermanent, true);
        const cancel = await request('/api/subscription/cancel', { method: 'POST', headers: protectedHeaders });
        strict_1.default.equal(cancel.status, 200);
        const subscriptionAfter = await request('/api/subscription', { headers: protectedHeaders });
        strict_1.default.equal(subscriptionAfter.body.data.effectivePlan, 'FREE');
        const downgradedResume = await resume_model_1.Resume.findById(resumeId);
        strict_1.default.equal(downgradedResume?.isPermanent, true, 'Premium resume remains permanent after downgrade');
        strict_1.default.equal(downgradedResume?.templateId, template.slug, 'Premium template association remains after downgrade');
        const hiddenAfterDowngrade = await request(`/api/templates/${template.slug}`, { headers: protectedHeaders });
        strict_1.default.equal((hiddenAfterDowngrade.body.data?.template).templateSpec, null);
        const renew = await request('/api/subscription/renew', { method: 'POST', headers: protectedHeaders });
        strict_1.default.equal(renew.status, 200);
        const renewedSubscription = await request('/api/subscription', { headers: protectedHeaders });
        strict_1.default.equal(renewedSubscription.body.data.effectivePlan, 'PREMIUM');
        strict_1.default.equal((await request('/api/subscription/cancel', { method: 'POST', headers: protectedHeaders })).status, 200);
        await user_model_1.User.updateOne({ _id: testUserId }, { $set: { role: 'ADMIN' } });
        const adminUser = await user_model_1.User.findById(testUserId).select('+tokenVersion');
        (0, strict_1.default)(adminUser);
        const adminHeaders = { authorization: `Bearer ${(0, jwt_1.createAccessToken)(adminUser)}` };
        strict_1.default.equal((await request('/api/admin/stats', { headers: adminHeaders })).status, 200);
        const adminTemplateCreate = await request('/api/templates', {
            method: 'POST', headers: { ...adminHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({
                name: 'Smoke Admin Template', slug: `smoke-admin-${(0, node_crypto_1.randomBytes)(5).toString('hex')}`, category: 'ATS',
                templateSpec, supportedSections: ['summary'], isPremium: false, isActive: true,
            }),
        });
        strict_1.default.equal(adminTemplateCreate.status, 201, adminTemplateCreate.body.message);
        const adminTemplate = adminTemplateCreate.body.data.template;
        strict_1.default.equal((await request(`/api/templates/${adminTemplate._id}`, {
            method: 'PUT', headers: { ...adminHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ description: 'Updated by admin smoke test' }),
        })).status, 200);
        strict_1.default.equal((await request(`/api/templates/${adminTemplate._id}`, { method: 'DELETE', headers: adminHeaders })).status, 200);
        const unsafeProfileImage = await request('/api/users/me', {
            method: 'PATCH',
            headers: { ...protectedHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ profileImage: 'javascript:alert(1)' }),
        });
        strict_1.default.equal(unsafeProfileImage.status, 400);
        const missingToken = await request('/api/auth/me');
        strict_1.default.equal(missingToken.status, 401);
        const invalidToken = await request('/api/auth/me', { headers: { authorization: 'Bearer invalid.token.value' } });
        strict_1.default.equal(invalidToken.status, 401);
        const invalidSignup = await request('/api/auth/signup', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'x', email: 'not-an-email', password: 'short' }),
        });
        strict_1.default.equal(invalidSignup.status, 400);
        strict_1.default.equal(invalidSignup.body.success, false);
        (0, strict_1.default)((invalidSignup.body.errors?.length ?? 0) > 0);
        const login = await request('/api/auth/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, password: 'InitialSmokePass42' }),
        });
        strict_1.default.equal(login.status, 200);
        strict_1.default.equal('password' in login.body.data?.user, false);
        const knownForgot = await request('/api/auth/forgot-password', {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }),
        });
        const unknownForgot = await request('/api/auth/forgot-password', {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'unknown@example.test' }),
        });
        strict_1.default.equal(knownForgot.status, 200);
        strict_1.default.equal(knownForgot.body.message, unknownForgot.body.message);
        const expiredToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const expiredUser = await user_model_1.User.findById(testUserId).select('+tokenVersion');
        (0, strict_1.default)(expiredUser);
        expiredUser.resetPasswordTokenHash = (0, node_crypto_1.createHash)('sha256').update(expiredToken).digest('hex');
        expiredUser.resetPasswordExpiresAt = new Date(Date.now() - 1000);
        await expiredUser.save();
        const expiredReset = await request('/api/auth/reset-password', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ token: expiredToken, password: 'ExpiredSmokePass55' }),
        });
        strict_1.default.equal(expiredReset.status, 400);
        const resetToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const resetUser = await user_model_1.User.findById(testUserId).select('+tokenVersion');
        (0, strict_1.default)(resetUser);
        const resetTokenHash = (0, node_crypto_1.createHash)('sha256').update(resetToken).digest('hex');
        resetUser.resetPasswordTokenHash = resetTokenHash;
        resetUser.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await resetUser.save();
        const persistedReset = await user_model_1.User.findById(testUserId).select('+resetPasswordTokenHash +resetPasswordExpiresAt');
        strict_1.default.equal(persistedReset?.resetPasswordTokenHash, resetTokenHash, 'Reset token hash should be persisted');
        (0, strict_1.default)((persistedReset?.resetPasswordExpiresAt?.getTime() ?? 0) > Date.now(), 'Reset token should have a future expiry');
        const reset = await request('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ token: resetToken, password: 'UpdatedSmokePass54' }),
        });
        strict_1.default.equal(reset.status, 200, reset.body.message);
        const newLogin = await request('/api/auth/login', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, password: 'UpdatedSmokePass54' }),
        });
        strict_1.default.equal(newLogin.status, 200);
        const oldLogin = await request('/api/auth/login', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, password: 'InitialSmokePass42' }),
        });
        strict_1.default.equal(oldLogin.status, 401);
        const passwordChange = await request('/api/users/password', {
            method: 'PATCH', headers: { authorization: `Bearer ${newLogin.body.data.token}`, 'content-type': 'application/json' },
            body: JSON.stringify({ currentPassword: 'UpdatedSmokePass54', newPassword: 'ChangedThroughProfile56' }),
        });
        strict_1.default.equal(passwordChange.status, 200);
        const revokedByPasswordChange = await request('/api/auth/me', { headers: { authorization: `Bearer ${newLogin.body.data.token}` } });
        strict_1.default.equal(revokedByPasswordChange.status, 401);
        const changedUser = await user_model_1.User.findById(testUserId).select('+password +tokenVersion');
        (0, strict_1.default)(changedUser && await changedUser.comparePassword('ChangedThroughProfile56'));
        const changedToken = (0, jwt_1.createAccessToken)(changedUser);
        const logout = await request('/api/auth/logout', {
            method: 'POST', headers: { authorization: `Bearer ${changedToken}` },
        });
        strict_1.default.equal(logout.status, 200);
        const revokedToken = await request('/api/auth/me', {
            headers: { authorization: `Bearer ${changedToken}` },
        });
        strict_1.default.equal(revokedToken.status, 401);
        const health = await request('/api/health');
        strict_1.default.equal(health.status, 200);
        strict_1.default.equal(health.body.data?.database, 'connected');
        console.info('Integration smoke passed: auth, profile/settings, owner-scoped resume CRUD, version restore, PDF export, expiration, premium template access, job/admin BOLA rejection, subscription lifecycle, admin template CRUD, permanent resumes, password/session revocation, and health.');
    }
    finally {
        if (testUserId) {
            await Promise.all([
                resume_model_1.Resume.deleteMany({ userId: testUserId }),
                resume_version_model_1.ResumeVersion.deleteMany({ userId: testUserId }),
                resume_analysis_model_1.ResumeAnalysis.deleteMany({ userId: testUserId }),
                subscription_model_1.Subscription.deleteMany({ userId: testUserId }),
                ai_usage_model_1.AIUsage.deleteMany({ userId: testUserId }),
            ]);
        }
        if (secondaryUserId) {
            await Promise.all([
                resume_model_1.Resume.deleteMany({ userId: secondaryUserId }),
                resume_version_model_1.ResumeVersion.deleteMany({ userId: secondaryUserId }),
                resume_analysis_model_1.ResumeAnalysis.deleteMany({ userId: secondaryUserId }),
                subscription_model_1.Subscription.deleteMany({ userId: secondaryUserId }),
                ai_usage_model_1.AIUsage.deleteMany({ userId: secondaryUserId }),
            ]);
        }
        if (testTemplateId)
            await template_model_1.Template.findByIdAndDelete(testTemplateId);
        if (testUserId)
            await user_model_1.User.findByIdAndDelete(testUserId);
        if (secondaryUserId)
            await user_model_1.User.findByIdAndDelete(secondaryUserId);
        if (server?.listening)
            await new Promise((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
        await mongoose_1.default.disconnect();
    }
}
void run().catch((error) => {
    console.error('Integration smoke failed:', error);
    process.exitCode = 1;
});
