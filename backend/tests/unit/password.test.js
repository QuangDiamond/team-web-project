import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../../src/models/User.js';
import { PasswordResetToken } from '../../src/models/PasswordResetToken.js';
import { issueToken, passwordVersion } from '../../src/common/utils/authSession.js';
import { authentication } from '../../src/common/middlewares/auth.middleware.js';
import { forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../../src/common/validator/authSchema.js';

// Prevent config imports from loading a developer's .env during these isolated tests.
process.env.DOTENV_CONFIG_PATH = 'tests/fixtures/no-password-test-env';
process.env.JWT_SECRET = 'password-unit-test-signing-key';
const transport = { sendMail: async () => {} };
const transportMock = mock.method(nodemailer, 'createTransport', () => transport);
const service = await import('../../src/services/password.service.js');
const authService = await import('../../src/services/auth.service.js');
const controller = await import('../../src/controllers/auth.controller.js');
const { authRoute } = await import('../../src/routes/auth.routes.js');
const { env } = await import('../../src/config/environment.js');
transportMock.mock.restore();

const OLD_PASSWORD = 'OldPassword1';
const NEW_PASSWORD = 'NewPassword2';
const originalHash = await bcrypt.hash(OLD_PASSWORD, 4);
const digest = (value) => createHash('sha256').update(value).digest('hex');
const query = (value) => ({ select: async () => value });

function matches(document, filter) {
  if (!document) return false;
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some((entry) => matches(document, entry));
    if (value instanceof RegExp) return value.test(document[key]);
    if (value && value.$gt) return document[key] > value.$gt;
    if (value && value.$lte) return document[key] <= value.$lte;
    return String(document[key]) === String(value);
  });
}

function setup(t, overrides = {}) {
  const state = {
    user: new User({
      full_name: 'Test User', email: 'user@example.com', role: 'STUDENT',
      password_hash: originalHash, account_status: 'ACTIVE', email_verify_status: true,
      failed_login_attempts: 5, is_login_locked: true, ...overrides,
    }),
    record: null, mails: [], writes: [], failWrite: false, failCleanup: false,
  };
  t.mock.method(transport, 'sendMail', async (mail) => { state.mails.push(mail); });
  t.mock.method(User, 'findOne', async (filter) => {
    if (matches(state.user, filter)) return new User(state.user.toObject());
    return null;
  });
  t.mock.method(User, 'findById', () => query(state.user && new User(state.user.toObject())));
  t.mock.method(User, 'findOneAndUpdate', async (filter, update) => {
    state.writes.push({ filter, update });
    if (state.failWrite) throw new Error('Simulated write failure');
    if (!matches(state.user, filter)) return null;
    Object.assign(state.user, update.$set);
    return new User(state.user.toObject());
  });
  t.mock.method(PasswordResetToken, 'findOne', async (filter) => {
    if (matches(state.record, filter)) return { ...state.record };
    return null;
  });
  t.mock.method(PasswordResetToken, 'findOneAndUpdate', async (filter, update, options) => {
    if (matches(state.record, filter)) {
      Object.assign(state.record, update.$set);
      return { ...state.record };
    }
    if (!options.upsert) return null;
    if (state.record) throw Object.assign(new Error('Duplicate'), { code: 11000 });
    state.record = { _id: filter._id, ...update.$set };
    return { ...state.record };
  });
  t.mock.method(PasswordResetToken, 'deleteOne', async (filter) => {
    if (matches(state.record, filter)) state.record = null;
  });
  t.mock.method(PasswordResetToken, 'deleteMany', async (filter) => {
    if (state.failCleanup) throw new Error('Simulated cleanup failure');
    if (matches(state.record, filter)) state.record = null;
  });
  return state;
}

async function requestLink(state) {
  service.forgotPassword(state.user.email);
  await setImmediate();
  await setImmediate();
  const html = state.mails.at(-1).html;
  return /token=([a-f0-9]{64})/.exec(html)[1];
}

async function authenticate(token) {
  const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
  let result;
  await authentication(req, {}, (error) => { result = error; });
  return { error: result, user: req.user };
}

test('authentication real Mongoose projection includes password_hash explicitly', async (t) => {
  const user = new User({
    full_name: 'Projection Test', email: 'projection@example.com', role: 'STUDENT',
    account_status: 'ACTIVE', password_hash: originalHash,
  });
  const findById = User.findById.bind(User);
  t.mock.method(User, 'findById', (id) => {
    const realQuery = findById(id);
    t.mock.method(realQuery, 'exec', async () => {
      realQuery._applyPaths();
      assert.deepEqual(realQuery._fieldsForExec(), {
        role: 1, account_status: 1, password_hash: 1,
      });
      return user;
    });
    return realQuery;
  });
  const result = await authenticate(issueToken(user));
  assert.equal(result.error, undefined);
  assert.equal('password_hash' in result.user, false);

  const unrestricted = findById(user._id).select('+password_hash');
  unrestricted._applyPaths();
  assert.equal(unrestricted._fieldsForExec(), null, 'standalone + does not exclude default-selected fields');
});

function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      cookie(name, value, options) { this.authCookie = { name, value, options }; },
      clearCookie(name, options) { this.cleared = { name, options }; },
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; resolve(this); return this; },
    };
    handler(req, res, reject);
  });
}

test('password schemas enforce policy, token shape, confirmation and optional current password', () => {
  assert.equal(forgotPasswordSchema.parse({ email: ' user@example.com ' }).email, 'user@example.com');
  for (const email of ['', 'invalid', { $ne: null }]) {
    assert.equal(forgotPasswordSchema.safeParse({ email }).success, false);
  }
  const valid = { token: 'a'.repeat(64), new_password: NEW_PASSWORD, confirm_password: NEW_PASSWORD };
  assert.equal(resetPasswordSchema.safeParse(valid).success, true);
  for (const password of ['Short1', 'lowercase1', 'UPPERCASE1', 'NoDigitsHere', 'Aa1' + 'a'.repeat(62)]) {
    assert.equal(resetPasswordSchema.safeParse({ ...valid, new_password: password, confirm_password: password }).success, false);
    assert.equal(changePasswordSchema.safeParse({ new_password: password, confirm_password: password }).success, false);
  }
  for (const token of ['', 'x'.repeat(64), 'a'.repeat(65), {}]) {
    assert.equal(resetPasswordSchema.safeParse({ ...valid, token }).success, false);
  }
  assert.equal(resetPasswordSchema.safeParse({ ...valid, confirm_password: 'different' }).success, false);
  assert.equal(changePasswordSchema.safeParse({ new_password: NEW_PASSWORD, confirm_password: 'different' }).success, false);
  assert.equal(changePasswordSchema.safeParse({ new_password: NEW_PASSWORD, confirm_password: NEW_PASSWORD }).success, true);
});

test('forgot response is identical before any lookup for missing, inactive, cooldown and SMTP failure', async (t) => {
  const state = setup(t);
  let lookups = 0;
  const find = t.mock.method(User, 'findOne', async () => { lookups++; return null; });
  const response = await invoke(controller.forgotPassword, { body: { email: 'missing@example.com' } });
  assert.equal(lookups, 0, 'HTTP response precedes recovery database and email work');
  await setImmediate();
  assert.equal(lookups, 1);
  find.mock.restore();
  state.user.account_status = 'SUSPENDED';
  const inactive = await invoke(controller.forgotPassword, { body: { email: state.user.email } });
  await setImmediate();
  assert.deepEqual(inactive.body, response.body);
  assert.equal(state.mails.length, 0);
  state.user.account_status = 'ACTIVE';
  await requestLink(state);
  const first = { ...state.record };
  const cooldown = await invoke(controller.forgotPassword, { body: { email: state.user.email } });
  await setImmediate();
  assert.deepEqual(cooldown.body, response.body);
  assert.equal(state.record.token_value, first.token_value);
  state.record.expired_at = new Date(Date.now() - 1);
  t.mock.method(transport, 'sendMail', async () => { throw new Error('SMTP failed'); });
  const failed = await invoke(controller.forgotPassword, { body: { email: state.user.email } });
  await setImmediate();
  await setImmediate();
  assert.deepEqual(failed.body, response.body);
  assert.equal(state.record, null, 'failed delivery deletes only the newly issued record');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data, null);
});

test('recovery stores only SHA256, expires in 15 minutes and rotates once after 60 seconds', async (t) => {
  const state = setup(t);
  env.corsOrigin = 'https://trusted.example';
  const start = Date.now();
  const raw = await requestLink(state);
  assert.equal(state.record.token_value, `${digest(raw)}:${passwordVersion(originalHash)}`);
  assert.equal(state.record.token_value.includes(raw), false);
  assert.equal(state.record.token_value.includes(originalHash), false);
  assert.equal(String(state.record._id), String(state.user._id));
  assert.ok(state.record.expired_at.getTime() >= start + 900000);
  assert.ok(state.record.expired_at.getTime() <= Date.now() + 900000);
  assert.match(state.mails[0].html, /https:\/\/trusted.example\/reset-password\?token=/);
  service.forgotPassword(state.user.email);
  service.forgotPassword(state.user.email);
  await setImmediate();
  assert.equal(state.mails.length, 1);
  state.record.expired_at = new Date(Date.now() + 900000 - 61000);
  service.forgotPassword(state.user.email);
  service.forgotPassword(state.user.email);
  await setImmediate();
  await setImmediate();
  assert.equal(state.mails.length, 2);
  assert.notEqual(state.record.token_value, `${digest(raw)}:${passwordVersion(originalHash)}`);
  await assert.rejects(service.resetPassword({ token: raw, new_password: NEW_PASSWORD }), { status: 410 });
});

test('reset consumes once, revokes all sessions, clears login lock and sends no password', async (t) => {
  const state = setup(t);
  const oldToken = issueToken(state.user);
  const token = await requestLink(state);
  const results = await Promise.allSettled([
    service.resetPassword({ token, new_password: NEW_PASSWORD }),
    service.resetPassword({ token, new_password: NEW_PASSWORD }),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.find((result) => result.status === 'rejected').reason.status, 410);
  assert.equal(await bcrypt.compare(NEW_PASSWORD, state.user.password_hash), true);
  assert.equal(state.user.failed_login_attempts, 0);
  assert.equal(state.user.is_login_locked, false);
  assert.equal(state.user.account_status, 'ACTIVE');
  assert.equal(state.record, null);
  assert.equal((await authenticate(oldToken)).error.status, 401);
  await assert.rejects(service.resetPassword({ token, new_password: NEW_PASSWORD }), { status: 410 });
  await setImmediate();
  const notification = state.mails.at(-1);
  assert.match(notification.subject, /was changed/);
  assert.equal(notification.html.includes(NEW_PASSWORD), false);
  assert.equal(notification.html.includes(state.user.password_hash), false);
});

test('expired, used, missing-user and inactive recovery links cannot write passwords', async (t) => {
  const state = setup(t);
  const token = await requestLink(state);
  const validRecord = { ...state.record };
  for (const patch of [{ expired_at: new Date(Date.now() - 1) }, { is_used: true }]) {
    state.record = { ...validRecord, ...patch };
    await assert.rejects(service.resetPassword({ token, new_password: NEW_PASSWORD }), { status: 410 });
  }
  state.record = { ...validRecord };
  for (const status of ['BANNED', 'SUSPENDED']) {
    state.user.account_status = status;
    await assert.rejects(service.resetPassword({ token, new_password: NEW_PASSWORD }), { status: 410 });
  }
  state.user = null;
  await assert.rejects(service.resetPassword({ token, new_password: NEW_PASSWORD }), { status: 410 });
  assert.equal(state.writes.length, 0);
});

test('wrong/missing current password and same new password give editable field errors', async (t) => {
  const state = setup(t);
  for (const current_password of [undefined, '', 'WrongPassword1']) {
    await assert.rejects(service.changePassword(String(state.user._id), { current_password, new_password: NEW_PASSWORD }), (error) => {
      assert.equal(error.status, 400);
      assert.ok(error.errors.current_password);
      return true;
    });
  }
  await assert.rejects(service.changePassword(String(state.user._id), { current_password: OLD_PASSWORD, new_password: OLD_PASSWORD }), (error) => {
    assert.equal(error.status, 400);
    assert.ok(error.errors.new_password);
    return true;
  });
  const token = await requestLink(state);
  await assert.rejects(service.resetPassword({ token, new_password: OLD_PASSWORD }), { status: 400 });
  assert.equal(state.record.is_used, false);
  assert.equal(state.writes.length, 0);
});

test('change replaces only current session, returns safe user, invalidates reset links and rejects legacy JWT', async (t) => {
  const state = setup(t);
  const oldToken = issueToken(state.user);
  await requestLink(state);
  const res = await invoke(controller.changePassword, {
    user: { id: String(state.user._id) }, body: { current_password: OLD_PASSWORD, new_password: NEW_PASSWORD },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.has_password, true);
  assert.equal(res.body.data.id, String(state.user._id));
  assert.equal('user' in res.body.data, false, 'data is the user directly');
  assert.equal('password_hash' in res.body.data, false);
  assert.equal('token' in res.body.data, false);
  assert.equal(state.record, null);
  assert.equal(res.authCookie.options.httpOnly, true);
  assert.equal(res.authCookie.options.sameSite, 'lax');
  assert.equal((await authenticate(oldToken)).error.status, 401);
  assert.equal((await authenticate(res.authCookie.value)).error, undefined);
  const legacy = jwt.sign({ sub: String(state.user._id), role: state.user.role }, process.env.JWT_SECRET);
  assert.equal((await authenticate(legacy)).error.status, 401);
  const payload = jwt.decode(res.authCookie.value);
  assert.equal(payload.password_version, digest(state.user.password_hash));
  assert.equal(JSON.stringify(payload).includes(state.user.password_hash), false);
  assert.equal(JSON.stringify(res.body).includes(state.user.password_hash), false);
});

test('Google-only user sets first password without current password and me derives actual state', async (t) => {
  const state = setup(t, { password_hash: null, has_password: true, google_account: { google_id: 'google-test', google_email: 'user@example.com' } });
  const oldToken = issueToken(state.user);
  assert.equal((await authService.me(String(state.user._id))).has_password, false);
  const result = await service.changePassword(String(state.user._id), { new_password: NEW_PASSWORD });
  assert.equal(result.user.has_password, true);
  assert.equal((await authenticate(oldToken)).error.status, 401);
  assert.equal((await authenticate(result.token)).error, undefined);
  state.user.has_password = false;
  const me = await authService.me(String(state.user._id));
  assert.equal(me.id, String(state.user._id));
  assert.equal(me.has_password, true);
  assert.equal('password_hash' in me, false);
});

test('concurrent change CAS allows only one write, and inactive users cannot change', async (t) => {
  const state = setup(t);
  const data = { current_password: OLD_PASSWORD, new_password: NEW_PASSWORD };
  const results = await Promise.allSettled([
    service.changePassword(String(state.user._id), data),
    service.changePassword(String(state.user._id), data),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.find((result) => result.status === 'rejected').reason.status, 409);
  assert.ok(state.writes.every((write) => write.filter.password_hash === originalHash));
  state.user.account_status = 'BANNED';
  await assert.rejects(service.changePassword(String(state.user._id), data), { status: 403 });
});

test('reset write failure keeps consumed link invalid; cleanup failure commits credential but returns no new session', async (t) => {
  const state = setup(t);
  const token = await requestLink(state);
  state.failWrite = true;
  await assert.rejects(service.resetPassword({ token, new_password: NEW_PASSWORD }), /write failure/);
  assert.equal(state.record.is_used, true);
  assert.equal(state.user.password_hash, originalHash);
  await assert.rejects(service.resetPassword({ token, new_password: NEW_PASSWORD }), { status: 410 });
  state.failWrite = false;
  state.failCleanup = true;
  const oldToken = issueToken(state.user);
  await assert.rejects(service.changePassword(String(state.user._id), { current_password: OLD_PASSWORD, new_password: NEW_PASSWORD }), /cleanup failure/);
  assert.equal(await bcrypt.compare(NEW_PASSWORD, state.user.password_hash), true);
  assert.equal((await authenticate(oldToken)).error.status, 401);
});

test('cleanup failure leaves an unconsumed link unusable against the changed credential', async (t) => {
  const state = setup(t);
  const token = await requestLink(state);
  const storedValue = state.record.token_value;
  state.failCleanup = true;
  await assert.rejects(service.changePassword(String(state.user._id), {
    current_password: OLD_PASSWORD, new_password: NEW_PASSWORD,
  }), /cleanup failure/);
  assert.equal(state.record.is_used, false);
  assert.equal(state.record.token_value, storedValue);
  assert.equal(await bcrypt.compare(NEW_PASSWORD, state.user.password_hash), true);
  const writes = state.writes.length;
  await assert.rejects(service.resetPassword({ token, new_password: 'AnotherPassword3' }), { status: 410 });
  assert.equal(state.writes.length, writes, 'stale link cannot overwrite the new credential');
  assert.equal(state.record.is_used, false, 'credential binding rejects before consumption');
});

test('legacy reset digests without credential binding are rejected', async (t) => {
  const state = setup(t);
  const token = await requestLink(state);
  state.record.token_value = digest(token);
  await assert.rejects(service.resetPassword({ token, new_password: NEW_PASSWORD }), { status: 410 });
  assert.equal(state.writes.length, 0);
});

test('reset controller clears cookie without issuing a replacement session', async (t) => {
  const state = setup(t);
  const token = await requestLink(state);
  const response = await invoke(controller.resetPassword, { body: { token, new_password: NEW_PASSWORD } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.cleared.name, 'token');
  assert.equal(response.authCookie, undefined);
  assert.equal(response.body.data, null);
});

test('email and Google login retain original hash when login update excludes it', async (t) => {
  const state = setup(t, { google_account: { google_id: 'google-test', google_email: 'user@example.com' } });
  t.mock.method(User, 'findOne', () => {
    const document = new User(state.user.toObject());
    const promise = Promise.resolve(document);
    promise.select = async () => document;
    return promise;
  });
  t.mock.method(User, 'findByIdAndUpdate', () => {
    const projected = new User(state.user.toObject()).toObject();
    delete projected.password_hash;
    return { select: async (projection) => {
      assert.equal(projection, '-password_hash');
      return { ...projected, toObject: () => ({ ...projected }) };
    } };
  });
  t.mock.method(OAuth2Client.prototype, 'getToken', async () => ({ tokens: { id_token: 'google-id-token' } }));
  t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => ({
    getPayload: () => ({ sub: 'google-test', email: state.user.email, email_verified: true }),
  }));
  const email = await authService.login({ email: state.user.email, password: OLD_PASSWORD });
  const google = await authService.handleGoogleCallback('authorization-code');
  for (const result of [email, google]) {
    assert.equal(jwt.decode(result.token).password_version, passwordVersion(originalHash));
    assert.equal(result.user.id, String(state.user._id));
    assert.notEqual(jwt.decode(result.token).password_version, passwordVersion(null));
    assert.equal('password_hash' in result.user, false);
    assert.equal((await authenticate(result.token)).error, undefined);
  }
});

test('recovery routes validate public bodies; change authenticates before validation', () => {
  const route = (path) => authRoute.stack.find((layer) => layer.route.path === path).route;
  for (const path of ['/forgot-password', '/reset-password']) {
    assert.equal(route(path).methods.post, true);
    assert.equal(route(path).stack.length, 2);
    assert.notEqual(route(path).stack[0].handle, authentication);
  }
  assert.equal(route('/change-password').stack[0].handle, authentication);
  assert.equal(route('/change-password').stack.length, 3);
});
