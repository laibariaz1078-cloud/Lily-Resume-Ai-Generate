import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import type { Server } from 'node:http';
import { app } from '../app';
import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';

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

    const logout = await request('/api/auth/logout', {
      method: 'POST', headers: { authorization: `Bearer ${(newLogin.body.data as { token: string }).token}` },
    });
    assert.equal(logout.status, 200);
    const revokedToken = await request('/api/auth/me', {
      headers: { authorization: `Bearer ${(newLogin.body.data as { token: string }).token}` },
    });
    assert.equal(revokedToken.status, 401);

    const health = await request('/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.data?.database, 'connected');

    console.info('Integration smoke passed: MongoDB, signup, duplicate rejection, login, safe users, bcrypt, /me, JWT rejection, validation, expired and valid reset, logout revocation, health.');
  } finally {
    if (testUserId) await User.findByIdAndDelete(testUserId);
    if (server?.listening) await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
    await mongoose.disconnect();
  }
}

void run().catch((error: unknown) => {
  console.error('Integration smoke failed:', error);
  process.exitCode = 1;
});
