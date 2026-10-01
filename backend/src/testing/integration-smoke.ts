import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import type { Server } from 'node:http';
import { app } from '../app';
import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';
import { Resume } from '../models/resume.model';
import { ResumeVersion } from '../models/resume-version.model';
import { ResumeAnalysis } from '../models/resume-analysis.model';
import { Subscription } from '../models/subscription.model';
import { AIUsage } from '../models/ai-usage.model';
import { createAccessToken } from '../utils/jwt';
import { Template } from '../models/template.model';

type ApiBody = {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  errors?: Array<{ field: string; message: string }>;
};

async function run(): Promise<void> {
  await connectDatabase();
  let server: Server | undefined;
  let testUserId: string | undefined;
  let secondaryUserId: string | undefined;
  let testTemplateId: string | undefined;

  try {
    server = app.listen(0);
    await new Promise<void>((resolve, reject) => {
      server?.once('listening', resolve);
      server?.once('error', reject);
    });

    const address = server.address();
    assert(address && typeof address !== 'string', 'Expected an ephemeral HTTP server address');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    async function request(path: string, init?: RequestInit): Promise<{ status: number; body: ApiBody }> {
      const response = await fetch(`${baseUrl}${path}`, init);
      return { status: response.status, body: await response.json() as ApiBody };
    }

    async function rawRequest(path: string, init?: RequestInit): Promise<Response> {
      return fetch(`${baseUrl}${path}`, init);
    }

    const email = `smoke-${randomBytes(8).toString('hex')}@example.test`;
    const signup = await request('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Test', email, password: 'InitialSmokePass42' }),
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.body.success, true);
    const signupData = signup.body.data as { token: string; user: { id: string; email: string; password?: string } };
    testUserId = signupData.user.id;
    assert.equal(signupData.user.email, email);
    assert.equal('password' in signupData.user, false);

    const duplicateSignup = await request('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Test', email, password: 'InitialSmokePass42' }),
    });
    assert.equal(duplicateSignup.status, 409);

    const storedUser = await User.findById(testUserId).select('+password');
    assert(storedUser?.password.startsWith('$2'), 'Password must be stored as a bcrypt hash');

    const protectedHeaders = { authorization: `Bearer ${signupData.token}` };
    const currentUser = await request('/api/auth/me', { headers: protectedHeaders });
    assert.equal(currentUser.status, 200);
    assert.equal(currentUser.body.data?.user && (currentUser.body.data.user as { email: string }).email, email);

    const profileUpdate = await request('/api/users/me', {
      method: 'PATCH',
      headers: { ...protectedHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Smoke Name' }),
    });
    assert.equal(profileUpdate.status, 200);
    assert.equal((profileUpdate.body.data?.user as { name: string }).name, 'Updated Smoke Name');

    const profile = await request('/api/users/profile', { headers: protectedHeaders });
    assert.equal(profile.status, 200);
    const settingsUpdate = await request('/api/users/settings', {
      method: 'PATCH', headers: { ...protectedHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'DARK', notifications: { weeklySummary: false } }),
    });
    assert.equal(settingsUpdate.status, 200);
    assert.equal((settingsUpdate.body.data?.settings as { theme: string }).theme, 'DARK');

    const resumeCreate = await request('/api/resumes', {
      method: 'POST', headers: { ...protectedHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Smoke Resume',
        data: { fullName: 'Smoke Person', title: 'Engineer', summary: 'Built verified systems.', order: ['summary'], hidden: {} },
      }),
    });
    assert.equal(resumeCreate.status, 201, resumeCreate.body.message);
    const createdResume = (resumeCreate.body.data as { resume: { _id: string; expiresAt: string; isPermanent: boolean } }).resume;
    assert.equal(createdResume.isPermanent, false);
    assert(Date.parse(createdResume.expiresAt) > Date.now());
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
    const template = await Template.create({
      name: 'Smoke Premium',
      slug: `smoke-premium-${randomBytes(5).toString('hex')}`,
      category: 'Modern',
      templateSpec,
      supportedSections: ['summary', 'experience'],
      isPremium: true,
      isActive: true,
    });
    testTemplateId = template.id;
    const publicTemplate = await request(`/api/templates/${template.slug}`);
    assert.equal(publicTemplate.status, 200);
    assert.equal((publicTemplate.body.data?.template as { templateSpec: unknown }).templateSpec, null);
    const freeTemplate = await request(`/api/templates/${template.slug}`, { headers: protectedHeaders });
    assert.equal((freeTemplate.body.data?.template as { templateSpec: unknown }).templateSpec, null);
    const deniedSelection = await request(`/api/resumes/${resumeId}`, {
      method: 'PUT', headers: { ...protectedHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ templateId: template.slug }),
    });
    assert.equal(deniedSelection.status, 403);

    const versionList = await request(`/api/resumes/${resumeId}/versions`, { headers: protectedHeaders });
    assert.equal(versionList.status, 200);
    const firstVersion = (versionList.body.data as { items: Array<{ _id: string }> }).items[0];
    assert(firstVersion);

    const resumeUpdate = await request(`/api/resumes/${resumeId}`, {
      method: 'PUT', headers: { ...protectedHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Changed Smoke Resume' }),
    });
    assert.equal(resumeUpdate.status, 200);
    const restore = await request(`/api/resumes/${resumeId}/versions/${firstVersion._id}/restore`, {
      method: 'POST', headers: protectedHeaders,
    });
    assert.equal(restore.status, 200);
    assert.equal((restore.body.data?.resume as { title: string }).title, 'Smoke Resume');

    const pdf = await rawRequest(`/api/resumes/${resumeId}/export/pdf`, { method: 'POST', headers: protectedHeaders });
    assert.equal(pdf.status, 200);
    assert.match(pdf.headers.get('content-type') ?? '', /application\/pdf/);
    assert.equal((await pdf.arrayBuffer().then((value) => Buffer.from(value))).subarray(0, 4).toString(), '%PDF');

    const otherUser = await User.create({ name: 'Other User', email: `other-${randomBytes(8).toString('hex')}@example.test`, password: 'OtherSmokePass42' });
    secondaryUserId = otherUser.id;
    const otherToken = createAccessToken(otherUser);
    const crossUserRead = await request(`/api/resumes/${resumeId}`, { headers: { authorization: `Bearer ${otherToken}` } });
    assert.equal(crossUserRead.status, 404);
    const nonAdmin = await request('/api/admin/stats', { headers: { authorization: `Bearer ${otherToken}` } });
    assert.equal(nonAdmin.status, 403);
    const crossUserMatch = await request('/api/jobs/match-resume', {
      method: 'POST', headers: { authorization: `Bearer ${otherToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ resumeId, jobDescription: 'A'.repeat(80) }),
    });
    assert.equal(crossUserMatch.status, 404, crossUserMatch.body.message);

    await Resume.updateOne({ _id: resumeId, userId: testUserId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const expiredResume = await request(`/api/resumes/${resumeId}`, { headers: protectedHeaders });
    assert.equal(expiredResume.status, 200);
    assert.equal((expiredResume.body.data?.resume as { expiration: { state: string } }).expiration.state, 'EXPIRED');
    assert(await Resume.exists({ _id: resumeId, userId: testUserId }), 'Expired resumes must not be automatically deleted');
    const expiredUpdate = await request(`/api/resumes/${resumeId}`, {
      method: 'PUT', headers: { ...protectedHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Expired Update' }),
    });
    assert.equal(expiredUpdate.status, 410);
    const expiredPdf = await rawRequest(`/api/resumes/${resumeId}/export/pdf`, { method: 'POST', headers: protectedHeaders });
    assert.equal(expiredPdf.status, 410);

    const subscriptionBefore = await request('/api/subscription', { headers: protectedHeaders });
    assert.equal(subscriptionBefore.status, 200);
    const upgrade = await request('/api/subscription/upgrade', {
      method: 'POST', headers: { ...protectedHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ plan: 'PREMIUM' }),
    });
    assert.equal(upgrade.status, 200);
    const premiumTemplate = await request(`/api/templates/${template.slug}`, { headers: protectedHeaders });
    assert.equal((premiumTemplate.body.data?.template as { templateSpec: { layout: { pageSize: string } } }).templateSpec.layout.pageSize, 'A4');
    const templateSelection = await request(`/api/resumes/${resumeId}`, {
      method: 'PUT', headers: { ...protectedHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ templateId: template.slug }),
    });
    assert.equal(templateSelection.status, 200);
    const permanentResume = await Resume.findById(resumeId);
    assert.equal(permanentResume?.isPermanent, true);
    const cancel = await request('/api/subscription/cancel', { method: 'POST', headers: protectedHeaders });
    assert.equal(cancel.status, 200);
    const subscriptionAfter = await request('/api/subscription', { headers: protectedHeaders });
    assert.equal((subscriptionAfter.body.data as { effectivePlan: string }).effectivePlan, 'FREE');
    const downgradedResume = await Resume.findById(resumeId);
    assert.equal(downgradedResume?.isPermanent, true, 'Premium resume remains permanent after downgrade');
    assert.equal(downgradedResume?.templateId, template.slug, 'Premium template association remains after downgrade');
    const hiddenAfterDowngrade = await request(`/api/templates/${template.slug}`, { headers: protectedHeaders });
    assert.equal((hiddenAfterDowngrade.body.data?.template as { templateSpec: unknown }).templateSpec, null);
    const renew = await request('/api/subscription/renew', { method: 'POST', headers: protectedHeaders });
    assert.equal(renew.status, 200);
    const renewedSubscription = await request('/api/subscription', { headers: protectedHeaders });
    assert.equal((renewedSubscription.body.data as { effectivePlan: string }).effectivePlan, 'PREMIUM');
    assert.equal((await request('/api/subscription/cancel', { method: 'POST', headers: protectedHeaders })).status, 200);

    await User.updateOne({ _id: testUserId }, { $set: { role: 'ADMIN' } });
    const adminUser = await User.findById(testUserId).select('+tokenVersion');
    assert(adminUser);
    const adminHeaders = { authorization: `Bearer ${createAccessToken(adminUser)}` };
    assert.equal((await request('/api/admin/stats', { headers: adminHeaders })).status, 200);
    const adminTemplateCreate = await request('/api/templates', {
      method: 'POST', headers: { ...adminHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Admin Template', slug: `smoke-admin-${randomBytes(5).toString('hex')}`, category: 'ATS',
        templateSpec, supportedSections: ['summary'], isPremium: false, isActive: true,
      }),
    });
    assert.equal(adminTemplateCreate.status, 201, adminTemplateCreate.body.message);
    const adminTemplate = (adminTemplateCreate.body.data as { template: { _id: string } }).template;
    assert.equal((await request(`/api/templates/${adminTemplate._id}`, {
      method: 'PUT', headers: { ...adminHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'Updated by admin smoke test' }),
    })).status, 200);
    assert.equal((await request(`/api/templates/${adminTemplate._id}`, { method: 'DELETE', headers: adminHeaders })).status, 200);

    const unsafeProfileImage = await request('/api/users/me', {
      method: 'PATCH',
      headers: { ...protectedHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ profileImage: 'javascript:alert(1)' }),
    });
    assert.equal(unsafeProfileImage.status, 400);

    const missingToken = await request('/api/auth/me');
    assert.equal(missingToken.status, 401);
    const invalidToken = await request('/api/auth/me', { headers: { authorization: 'Bearer invalid.token.value' } });
    assert.equal(invalidToken.status, 401);

    const invalidSignup = await request('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', email: 'not-an-email', password: 'short' }),
    });
    assert.equal(invalidSignup.status, 400);
    assert.equal(invalidSignup.body.success, false);
    assert((invalidSignup.body.errors?.length ?? 0) > 0);

    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'InitialSmokePass42' }),
    });
    assert.equal(login.status, 200);
    assert.equal('password' in (login.body.data?.user as object), false);

    const knownForgot = await request('/api/auth/forgot-password', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }),
    });
    const unknownForgot = await request('/api/auth/forgot-password', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'unknown@example.test' }),
    });
    assert.equal(knownForgot.status, 200);
    assert.equal(knownForgot.body.message, unknownForgot.body.message);

    const expiredToken = randomBytes(32).toString('hex');
    const expiredUser = await User.findById(testUserId).select('+tokenVersion');
    assert(expiredUser);
    expiredUser.resetPasswordTokenHash = createHash('sha256').update(expiredToken).digest('hex');
    expiredUser.resetPasswordExpiresAt = new Date(Date.now() - 1000);
    await expiredUser.save();
    const expiredReset = await request('/api/auth/reset-password', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: expiredToken, password: 'ExpiredSmokePass55' }),
    });
    assert.equal(expiredReset.status, 400);

    const resetToken = randomBytes(32).toString('hex');
    const resetUser = await User.findById(testUserId).select('+tokenVersion');
    assert(resetUser);
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    resetUser.resetPasswordTokenHash = resetTokenHash;
    resetUser.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await resetUser.save();

    const persistedReset = await User.findById(testUserId).select('+resetPasswordTokenHash +resetPasswordExpiresAt');
    assert.equal(persistedReset?.resetPasswordTokenHash, resetTokenHash, 'Reset token hash should be persisted');
    assert((persistedReset?.resetPasswordExpiresAt?.getTime() ?? 0) > Date.now(), 'Reset token should have a future expiry');

    const reset = await request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: 'UpdatedSmokePass54' }),
    });
    assert.equal(reset.status, 200, reset.body.message);

    const newLogin = await request('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'UpdatedSmokePass54' }),
    });
    assert.equal(newLogin.status, 200);
    const oldLogin = await request('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'InitialSmokePass42' }),
    });
    assert.equal(oldLogin.status, 401);

    const passwordChange = await request('/api/users/password', {
      method: 'PATCH', headers: { authorization: `Bearer ${(newLogin.body.data as { token: string }).token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'UpdatedSmokePass54', newPassword: 'ChangedThroughProfile56' }),
    });
    assert.equal(passwordChange.status, 200);
    const revokedByPasswordChange = await request('/api/auth/me', { headers: { authorization: `Bearer ${(newLogin.body.data as { token: string }).token}` } });
    assert.equal(revokedByPasswordChange.status, 401);
    const changedUser = await User.findById(testUserId).select('+password +tokenVersion');
    assert(changedUser && await changedUser.comparePassword('ChangedThroughProfile56'));
    const changedToken = createAccessToken(changedUser);

    const logout = await request('/api/auth/logout', {
      method: 'POST', headers: { authorization: `Bearer ${changedToken}` },
    });
    assert.equal(logout.status, 200);
    const revokedToken = await request('/api/auth/me', {
      headers: { authorization: `Bearer ${changedToken}` },
    });
    assert.equal(revokedToken.status, 401);

    const health = await request('/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.data?.database, 'connected');

    console.info('Integration smoke passed: auth, profile/settings, owner-scoped resume CRUD, version restore, PDF export, expiration, premium template access, job/admin BOLA rejection, subscription lifecycle, admin template CRUD, permanent resumes, password/session revocation, and health.');
  } finally {
    if (testUserId) {
      await Promise.all([
        Resume.deleteMany({ userId: testUserId }),
        ResumeVersion.deleteMany({ userId: testUserId }),
        ResumeAnalysis.deleteMany({ userId: testUserId }),
        Subscription.deleteMany({ userId: testUserId }),
        AIUsage.deleteMany({ userId: testUserId }),
      ]);
    }
    if (secondaryUserId) {
      await Promise.all([
        Resume.deleteMany({ userId: secondaryUserId }),
        ResumeVersion.deleteMany({ userId: secondaryUserId }),
        ResumeAnalysis.deleteMany({ userId: secondaryUserId }),
        Subscription.deleteMany({ userId: secondaryUserId }),
        AIUsage.deleteMany({ userId: secondaryUserId }),
      ]);
    }
    if (testTemplateId) await Template.findByIdAndDelete(testTemplateId);
    if (testUserId) await User.findByIdAndDelete(testUserId);
    if (secondaryUserId) await User.findByIdAndDelete(secondaryUserId);
    if (server?.listening) await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
    await mongoose.disconnect();
  }
}

void run().catch((error: unknown) => {
  console.error('Integration smoke failed:', error);
  process.exitCode = 1;
});
