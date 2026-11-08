import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { parentRequestBodySchema, parentRequestListQuerySchema } from '../../src/common/validator/parentRequestSchema.js';
import { tutorRequestListQuerySchema } from '../../src/common/validator/tutorRequestSchema.js';
import { createApplicationSchema } from '../../src/common/validator/applicationSchema.js';
import { createInvitationSchema } from '../../src/common/validator/invitationSchema.js';
import { assertRole } from '../../src/common/utils/assertRole.js';
import { buildPagination, parseQuery } from '../../src/common/utils/pagination.js';
import { decimalToNumber, escapeRegex, getRequestCutoff, isRequestAvailable } from '../../src/common/utils/requestRules.js';
import { toParentRequestDto } from '../../src/services/parentRequest.service.js';
import { buildBrowseFilter, scoreRequestForTutor, toTutorRequestDto } from '../../src/services/tutorRequest.service.js';

const newId = () => new mongoose.Types.ObjectId().toString();

const validRequestBody = {
  title: 'Tìm gia sư Toán lớp 9',
  student_id: null,
  subject_name: 'Toán',
  grade_level: 'Lớp 9',
  description: 'Ôn thi vào 10',
  schedule: 'Tối thứ 3, thứ 5',
  budget: '250000',
  teaching_mode: 'ONLINE',
  location_address: '',
  tutor_requirements: '',
};

test('parent request body: valid input is normalised', () => {
  const result = parentRequestBodySchema.safeParse(validRequestBody);
  assert.equal(result.success, true);
  assert.equal(result.data.budget, 250000);
  assert.equal(result.data.location_address, null);
});

test('parent request body: rejects system fields', () => {
  for (const extra of [{ parent_user_id: newId() }, { status: 'CLOSED' }, { created_at: 'x' }, { image_urls: [] }]) {
    assert.equal(parentRequestBodySchema.safeParse({ ...validRequestBody, ...extra }).success, false);
  }
});

test('parent request body: location is required for OFFLINE and HYBRID only', () => {
  for (const mode of ['OFFLINE', 'HYBRID']) {
    const result = parentRequestBodySchema.safeParse({ ...validRequestBody, teaching_mode: mode });
    assert.equal(result.success, false);
    assert.deepEqual(result.error.issues[0].path, ['location_address']);
  }
  assert.equal(parentRequestBodySchema.safeParse({ ...validRequestBody, teaching_mode: 'OFFLINE', location_address: 'Cầu Giấy' }).success, true);
});

test('parent request body: rejects blank text, bad budget, bad mode, bad student id', () => {
  assert.equal(parentRequestBodySchema.safeParse({ ...validRequestBody, title: '  ' }).success, false);
  assert.equal(parentRequestBodySchema.safeParse({ ...validRequestBody, budget: '0' }).success, false);
  assert.equal(parentRequestBodySchema.safeParse({ ...validRequestBody, budget: 'abc' }).success, false);
  assert.equal(parentRequestBodySchema.safeParse({ ...validRequestBody, teaching_mode: 'EITHER' }).success, false);
  assert.equal(parentRequestBodySchema.safeParse({ ...validRequestBody, student_id: 'nope' }).success, false);
});

test('list query schemas: defaults, limits and status', () => {
  assert.deepEqual(parentRequestListQuerySchema.parse({}), { page: 1, limit: 10 });
  assert.equal(parentRequestListQuerySchema.safeParse({ status: 'DONE' }).success, false);
  assert.equal(parentRequestListQuerySchema.safeParse({ limit: '101' }).success, false);
  assert.equal(tutorRequestListQuerySchema.safeParse({ mode: 'EITHER' }).success, false);
  assert.equal(tutorRequestListQuerySchema.safeParse({ minBudget: '500', maxBudget: '100' }).success, false);
  assert.equal(tutorRequestListQuerySchema.parse({ minBudget: '100', maxBudget: '500', q: ' toán ' }).q, 'toán');
});

test('parseQuery throws a 422 AppError with field errors', () => {
  assert.throws(
    () => parseQuery(parentRequestListQuerySchema, { page: '0' }),
    (error) => error.status === 422 && Boolean(error.errors.page)
  );
});

test('application body: optional note, length limit, rejects extra fields', () => {
  const requestId = newId();
  assert.deepEqual(createApplicationSchema.parse({ request_id: requestId }), { request_id: requestId, note: null });
  assert.equal(createApplicationSchema.parse({ request_id: requestId, note: '  hi  ' }).note, 'hi');
  assert.equal(createApplicationSchema.safeParse({ request_id: requestId, note: 'x'.repeat(501) }).success, false);
  assert.equal(createApplicationSchema.safeParse({ request_id: 'bad' }).success, false);
  assert.equal(createApplicationSchema.safeParse({ request_id: requestId, tutor_profile_id: newId() }).success, false);
  assert.equal(createApplicationSchema.safeParse({ request_id: requestId, status: 'CONTINUED' }).success, false);
});

test('invitation body: needs both ids, optional message, rejects extra fields', () => {
  const body = { request_id: newId(), tutor_profile_id: newId() };
  assert.equal(createInvitationSchema.parse(body).message, null);
  assert.equal(createInvitationSchema.safeParse({ request_id: body.request_id }).success, false);
  assert.equal(createInvitationSchema.safeParse({ ...body, parent_user_id: newId() }).success, false);
  assert.equal(createInvitationSchema.safeParse({ ...body, message: 'x'.repeat(501) }).success, false);
});

test('assertRole only lets the required role through', () => {
  assert.doesNotThrow(() => assertRole({ id: 'x', role: 'TUTOR' }, 'TUTOR'));
  assert.throws(() => assertRole({ id: 'x', role: 'PARENT' }, 'TUTOR'), (error) => error.status === 403);
});

test('buildPagination follows the AGENTS.md shape', () => {
  assert.deepEqual(buildPagination(2, 5, 11), { page: 2, limit: 5, total: 11, totalPages: 3 });
});

test('requests expire after 30 days and only OPEN ones are available', () => {
  const now = new Date('2026-11-30T00:00:00Z');
  const fresh = new Date('2026-11-10T00:00:00Z');
  const old = new Date('2026-10-20T00:00:00Z');
  assert.equal(isRequestAvailable({ status: 'OPEN', created_at: fresh }, now), true);
  assert.equal(isRequestAvailable({ status: 'OPEN', created_at: old }, now), false);
  assert.equal(isRequestAvailable({ status: 'CLOSED', created_at: fresh }, now), false);
  assert.equal(isRequestAvailable({ status: 'OPEN', created_at: null }, now), false);
  assert.equal(getRequestCutoff(now).toISOString(), '2026-10-31T00:00:00.000Z');
});

test('decimalToNumber and escapeRegex helpers', () => {
  assert.equal(decimalToNumber(mongoose.Types.Decimal128.fromString('250000')), 250000);
  assert.equal(decimalToNumber(null), null);
  assert.equal(decimalToNumber('abc'), null);
  assert.equal(escapeRegex('a.b*(c)'), 'a\\.b\\*\\(c\\)');
});

test('browse filter: only OPEN + not expired, keyword is escaped, budget range applied', () => {
  const now = new Date('2026-11-30T00:00:00Z');
  const filter = buildBrowseFilter({ q: 'c++ (hard)', subject: 'Toán', mode: 'ONLINE', minBudget: 100, maxBudget: 500 }, now);
  assert.equal(filter.status, 'OPEN');
  assert.equal(filter.created_at.$gte.toISOString(), '2026-10-31T00:00:00.000Z');
  assert.equal(filter.$or.length, 3);
  assert.equal(filter.$or[0].title.test('learn C++ (hard) today'), true);
  assert.equal(filter.$or[0].title.test('learn cxx hard today'), false);
  assert.equal(filter.teaching_mode, 'ONLINE');
  assert.deepEqual(filter.budget, { $gte: 100, $lte: 500 });
  assert.equal('budget' in buildBrowseFilter({}, now), false);
});

const request = {
  teaching_mode: 'OFFLINE',
  subject_name: 'Toán',
  grade_level: 'Lớp 9',
  budget: mongoose.Types.Decimal128.fromString('200000'),
  schedule: 'Tối thứ 3',
  location_address: 'Cầu Giấy',
};
const goodPost = { subject_name: 'Toán', grade_level: 'Lớp 9', teaching_mode: 'OFFLINE', price: mongoose.Types.Decimal128.fromString('150000'), schedule: 'tối thứ 3' };

test('scoreRequestForTutor: null without a matching post, best score among matching posts', () => {
  assert.equal(scoreRequestForTutor(request, [], 'Cầu Giấy'), null);
  assert.equal(scoreRequestForTutor(request, [{ ...goodPost, subject_name: 'Tiếng Anh' }], 'Cầu Giấy'), null);
  assert.equal(scoreRequestForTutor(request, [{ ...goodPost, grade_level: 'Lớp 12' }], 'Cầu Giấy'), null);
  assert.equal(scoreRequestForTutor(request, [{ ...goodPost, teaching_mode: 'ONLINE' }], 'Cầu Giấy'), null);

  const perfect = scoreRequestForTutor(request, [goodPost], 'Cầu Giấy');
  assert.equal(perfect, 100);
  const expensive = { ...goodPost, price: mongoose.Types.Decimal128.fromString('600000') };
  const best = scoreRequestForTutor(request, [expensive, goodPost], 'Cầu Giấy');
  assert.equal(best, 100);
  assert.ok(scoreRequestForTutor(request, [expensive], 'Cầu Giấy') < perfect);
});

test('tutor-facing DTO exposes only the parent navigation ID and excludes private parent/student data', () => {
  const parentId = newId();
  const dto = toTutorRequestDto(
    { ...request, _id: newId(), parent_user_id: parentId, student_id: newId(), title: 'T', description: 'D', image_urls: ['a'], created_at: new Date(),
      parent: { email: 'private@example.com' }, parent_user: { phone: '0912345678' }, student: { full_name: 'Private child' },
      email: 'private@example.com', phone: '0912345678', contact: 'Private contact' },
    { applicationCount: 2, isBookmarked: true, hasApplied: false }
  );
  const keys = Object.keys(dto);
  assert.equal(dto.parent_user_id, String(parentId));
  for (const forbidden of ['student_id', 'student', 'parent', 'parent_user', 'email', 'phone', 'contact', 'status']) {
    assert.equal(keys.includes(forbidden), false, forbidden);
  }
  assert.equal(dto.budget, 200000);
  assert.equal(dto.application_count, 2);
  assert.equal(dto.is_bookmarked, true);
  assert.equal(dto.has_applied, false);
});

test('parent-facing DTO: budget number, student summary, can_edit and is_expired flags', () => {
  const now = new Date('2026-11-30T00:00:00Z');
  const studentId = new mongoose.Types.ObjectId();
  const dto = toParentRequestDto(
    { ...request, _id: newId(), status: 'OPEN', created_at: new Date('2026-10-01T00:00:00Z'), student_id: { _id: studentId, full_name: 'An', email: 'an@x.test' } },
    3,
    now
  );
  assert.equal(dto.budget, 200000);
  assert.equal(dto.student_id, String(studentId));
  assert.equal(dto.student.full_name, 'An');
  assert.equal(dto.application_count, 3);
  assert.equal(dto.is_expired, true);
  assert.equal(dto.can_edit, true);
  assert.equal(toParentRequestDto({ ...request, _id: newId(), status: 'IN_PROGRESS', created_at: now }, 0, now).can_edit, false);
});
