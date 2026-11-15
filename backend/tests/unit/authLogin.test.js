import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { User } from '../../src/models/User.js';
import { UserSession } from '../../src/models/UserSession.js';
import { TutorProfile } from '../../src/models/TutorProfile.js';
import { EmailVerificationToken } from '../../src/models/EmailVerificationToken.js';
import { loginSchema, registerSchema, resendVerificationSchema, forgotPasswordSchema } from '../../src/common/validator/authSchema.js';

// Prevent config imports from loading a developer's .env during these isolated tests.
process.env.DOTENV_CONFIG_PATH = 'tests/fixtures/no-password-test-env';
process.env.JWT_SECRET = 'auth-login-unit-test-signing-key';
const transport = { sendMail: async () => {} };
const transportMock = mock.method(nodemailer, 'createTransport', () => transport);
const authService = await import('../../src/services/auth.service.js');
const controller = await import('../../src/controllers/auth.controller.js');
transportMock.mock.restore();

const PASSWORD = 'Password1';
const passwordHash = await bcrypt.hash(PASSWORD, 4);
const digest = (value) => createHash('sha256').update(value).digest('hex');

// In-memory User + UserSession so the service runs without MongoDB
function setup(t, overrides = {}) {
  const state = {
    user: new User({
      full_name: 'Login User', email: 'login@example.com', role: 'STUDENT', password_hash: passwordHash,
      account_status: 'ACTIVE', email_verify_status: true, failed_login_attempts: 0, is_login_locked: false,
      ...overrides,
    }),
    sessions: [],
  };
  const copy = () => new User(state.user.toObject());
  t.mock.method(User, 'findOne', (filter) => {
    let found = null;
    if (filter.email === state.user.email) found = copy();
    const promise = Promise.resolve(found);
    promise.select = async () => found;
    return promise;
  });
  t.mock.method(User, 'findById', () => ({ select: async () => copy() }));
  t.mock.method(User, 'findOneAndUpdate', async (filter, update) => {
    state.user.failed_login_attempts += update.$inc.failed_login_attempts;
    return copy();
  });
  t.mock.method(User, 'updateOne', async (filter, update) => {
    Object.assign(state.user, update.$set);
  });
  t.mock.method(User, 'findByIdAndUpdate', (id, update) => {
    Object.assign(state.user, update);
    return { select: async () => copy() };
  });
  t.mock.method(UserSession, 'create', async (session) => {
    state.sessions.push({ ...session });
    return session;
  });
  t.mock.method(UserSession, 'findOneAndUpdate', async (filter, update) => {
    const session = state.sessions.find((item) => item.refresh_token === filter.refresh_token
      && item.is_revoked === filter.is_revoked && item.expires_at > filter.expires_at.$gt);
    if (!session) return null;
    Object.assign(session, update.$set);
    return { ...session };
  });
  t.mock.method(UserSession, 'updateOne', async (filter, update) => {
    const session = state.sessions.find((item) => item.refresh_token === filter.refresh_token);
    if (session) Object.assign(session, update.$set);
  });
  return state;
}

function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      cookies: {}, cleared: [],
      cookie(name, value, options) { this.cookies[name] = { value, options }; },
      clearCookie(name, options) { this.cleared.push({ name, options }); },
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; resolve(this); return this; },
    };
    handler(req, res, reject);
  });
}

test('auth schemas normalize email to lowercase and login only requires both fields', () => {
  assert.equal(loginSchema.parse({ email: ' An@Example.COM ', password: 'x' }).email, 'an@example.com');
  assert.equal(resendVerificationSchema.parse({ email: 'An@Example.com' }).email, 'an@example.com');
  assert.equal(forgotPasswordSchema.parse({ email: 'An@Example.com' }).email, 'an@example.com');
  const register = registerSchema.parse({
    full_name: 'An', email: ' An@Example.com', password: PASSWORD, confirm_password: PASSWORD,
    role: 'PARENT', agree_terms: true,
  });
  assert.equal(register.email, 'an@example.com');
  for (const body of [{}, { email: '', password: '' }, { email: 'a@b.co', password: '' }, { email: '', password: 'x' }]) {
    assert.equal(loginSchema.safeParse(body).error.issues[0].message, 'Email and password are required');
  }
  assert.equal(loginSchema.parse({ email: 'a@b.co', password: 'short' }).remember_me, false);
});

test('register creates an UNVERIFIED account and an empty draft tutor profile', async (t) => {
  const created = [];
  const profiles = [];
  t.mock.method(User, 'findOne', async () => null);
  t.mock.method(User, 'create', async (doc) => { created.push(doc); return new User(doc); });
  t.mock.method(TutorProfile, 'findOneAndUpdate', async (filter, update) => { profiles.push(update.$setOnInsert); });
  t.mock.method(EmailVerificationToken, 'deleteMany', async () => {});
  t.mock.method(EmailVerificationToken, 'create', async () => {});
  t.mock.method(transport, 'sendMail', async () => {});
  await authService.register({ full_name: 'Tutor', email: 'tutor@example.com', password: PASSWORD, role: 'TUTOR' });
  assert.equal(created[0].account_status, 'UNVERIFIED');
  assert.equal(created[0].email_verify_status, false);
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].is_complete, false);
  assert.equal('headline' in profiles[0], false, 'no placeholder headline/bio');
});

test('BR-02: 5 wrong passwords lock the account, even the right password is then rejected', async (t) => {
  const state = setup(t);
  for (let attempt = 1; attempt <= 4; attempt++) {
    await assert.rejects(authService.login({ email: state.user.email, password: 'Wrong1234' }), {
      status: 401, message: 'Email or password is incorrect',
    });
  }
  assert.equal(state.user.failed_login_attempts, 4);
  assert.equal(state.user.is_login_locked, false);
  await assert.rejects(authService.login({ email: state.user.email, password: 'Wrong1234' }), {
    status: 403, message: authService.LOGIN_LOCKED_MESSAGE,
  });
  assert.equal(state.user.is_login_locked, true);
  await assert.rejects(authService.login({ email: state.user.email, password: PASSWORD }), {
    status: 403, message: authService.LOGIN_LOCKED_MESSAGE,
  });
  assert.equal(state.sessions.length, 0);
});

test('successful login resets the failed counter and creates one hashed session', async (t) => {
  const state = setup(t, { failed_login_attempts: 3 });
  const result = await authService.login({ email: state.user.email, password: PASSWORD, remember_me: true });
  assert.equal(state.user.failed_login_attempts, 0);
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].refresh_token, digest(result.refreshToken));
  assert.notEqual(state.sessions[0].refresh_token, result.refreshToken, 'only the hash is stored');
  const ttl = state.sessions[0].expires_at.getTime() - Date.now();
  assert.ok(ttl > 6.9 * 24 * 3600 * 1000 && ttl <= 7 * 24 * 3600 * 1000);
  assert.equal(result.user.tutor_profile_complete, null);
});

test('unknown email and unverified accounts are rejected in every environment', async (t) => {
  const state = setup(t, { account_status: 'UNVERIFIED', email_verify_status: false });
  await assert.rejects(authService.login({ email: 'missing@example.com', password: PASSWORD }), {
    status: 401, message: 'Email or password is incorrect',
  });
  await assert.rejects(authService.login({ email: state.user.email, password: PASSWORD }), {
    status: 403, message: 'Account not verified',
  });
  state.user.account_status = 'SUSPENDED';
  state.user.email_verify_status = true;
  await assert.rejects(authService.login({ email: state.user.email, password: PASSWORD }), { status: 403 });
});

test('refresh rotates the session once and keeps the remember-me choice', async (t) => {
  const state = setup(t);
  const login = await invoke(controller.login, { body: { email: state.user.email, password: PASSWORD, remember_me: true } });
  const firstRefresh = login.cookies.refresh_token;
  assert.equal(firstRefresh.options.httpOnly, true);
  assert.equal(firstRefresh.options.path, '/api/auth/v1');
  assert.equal(firstRefresh.options.maxAge, 7 * 24 * 3600 * 1000);
  assert.equal(login.cookies.token.options.maxAge, 30 * 60 * 1000);

  const refreshed = await invoke(controller.refresh, { cookies: { refresh_token: firstRefresh.value } });
  assert.equal(refreshed.statusCode, 200);
  assert.notEqual(refreshed.cookies.refresh_token.value, firstRefresh.value);
  assert.equal(refreshed.cookies.refresh_token.options.maxAge, 7 * 24 * 3600 * 1000);
  assert.equal(state.sessions[0].is_revoked, true);
  assert.equal(state.sessions[1].is_revoked, false);
  await assert.rejects(authService.refreshSession(firstRefresh.value), { status: 401 });
  await assert.rejects(authService.refreshSession(undefined), { status: 401 });

  state.sessions[1].expires_at = new Date(Date.now() - 1);
  await assert.rejects(authService.refreshSession(refreshed.cookies.refresh_token.value), { status: 401 });
});

test('session cookies without remember-me, refresh rejects inactive users, logout revokes', async (t) => {
  const state = setup(t);
  const login = await invoke(controller.login, { body: { email: state.user.email, password: PASSWORD, remember_me: false } });
  assert.equal('maxAge' in login.cookies.refresh_token.options, false);
  assert.equal('maxAge' in login.cookies.token.options, false);

  const refreshed = await invoke(controller.refresh, { cookies: { refresh_token: login.cookies.refresh_token.value } });
  assert.equal('maxAge' in refreshed.cookies.refresh_token.options, false);

  const logout = await invoke(controller.logout, { cookies: { refresh_token: refreshed.cookies.refresh_token.value } });
  assert.equal(logout.statusCode, 200);
  assert.deepEqual(logout.cleared.map((cookie) => cookie.name), ['refresh_token', 'token']);
  assert.equal(state.sessions.every((session) => session.is_revoked), true);

  const again = await authService.login({ email: state.user.email, password: PASSWORD });
  state.user.account_status = 'BANNED';
  await assert.rejects(authService.refreshSession(again.refreshToken), { status: 403 });
});
