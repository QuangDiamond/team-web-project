import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  activityQuerySchema,
  paginationQuerySchema,
  studentAssignmentsQuerySchema,
  studentScheduleQuerySchema,
  submissionHistoryQuerySchema,
} from '../../src/common/validator/studentDashboardSchema.js';
import {
  assertStudent,
  getAssignmentProgress,
} from '../../src/services/studentDashboard.service.js';
import { buildPagination } from '../../src/common/utils/pagination.js';

test('pagination query uses defaults and coerces strings', () => {
  assert.deepEqual(paginationQuerySchema.parse({}), { page: 1, limit: 10 });
  assert.deepEqual(paginationQuerySchema.parse({ page: '2', limit: '5' }), { page: 2, limit: 5 });
});

test('pagination query rejects invalid values', () => {
  assert.equal(paginationQuerySchema.safeParse({ page: '0' }).success, false);
  assert.equal(paginationQuerySchema.safeParse({ limit: '101' }).success, false);
  assert.equal(paginationQuerySchema.safeParse({ limit: 'abc' }).success, false);
  assert.equal(paginationQuerySchema.safeParse({ page: '1.5' }).success, false);
});

test('studentAssignmentsQuerySchema validates status enum and defaults', () => {
  const parsed = studentAssignmentsQuerySchema.parse({});
  assert.equal(parsed.status, 'ALL');
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 10);

  const custom = studentAssignmentsQuerySchema.parse({
    status: 'SUBMITTED',
    classId: '507f1f77bcf86cd799439011',
    search: 'Toán học',
  });
  assert.equal(custom.status, 'SUBMITTED');
  assert.equal(custom.classId, '507f1f77bcf86cd799439011');
  assert.equal(custom.search, 'Toán học');

  assert.equal(studentAssignmentsQuerySchema.safeParse({ status: 'INVALID' }).success, false);
});

test('activityQuerySchema validates weeks boundaries and defaults', () => {
  assert.deepEqual(activityQuerySchema.parse({}), { weeks: 6 });
  assert.deepEqual(activityQuerySchema.parse({ weeks: '8' }), { weeks: 8 });
  assert.equal(activityQuerySchema.safeParse({ weeks: '3' }).success, false);
  assert.equal(activityQuerySchema.safeParse({ weeks: '13' }).success, false);
  assert.equal(activityQuerySchema.safeParse({ weeks: 'abc' }).success, false);
});

test('submissionHistoryQuerySchema validates status enum and defaults', () => {
  const parsed = submissionHistoryQuerySchema.parse({});
  assert.equal(parsed.status, 'ALL');
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 10);

  const custom = submissionHistoryQuerySchema.parse({
    status: 'GRADED',
    classId: '507f1f77bcf86cd799439011',
    search: 'Hóa 10',
  });
  assert.equal(custom.status, 'GRADED');
  assert.equal(custom.classId, '507f1f77bcf86cd799439011');
  assert.equal(custom.search, 'Hóa 10');

  assert.equal(submissionHistoryQuerySchema.safeParse({ status: 'PENDING' }).success, false);
});

test('studentScheduleQuerySchema validates fields and status enum', () => {
  const parsed = studentScheduleQuerySchema.parse({});
  assert.equal(parsed.status, 'ALL');
  assert.equal(parsed.startDate, undefined);
  assert.equal(parsed.endDate, undefined);

  const custom = studentScheduleQuerySchema.parse({
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    classId: '507f1f77bcf86cd799439011',
    status: 'SCHEDULED',
  });
  assert.equal(custom.startDate, '2026-11-01');
  assert.equal(custom.endDate, '2026-11-30');
  assert.equal(custom.classId, '507f1f77bcf86cd799439011');
  assert.equal(custom.status, 'SCHEDULED');

  assert.equal(studentScheduleQuerySchema.safeParse({ status: 'INVALID' }).success, false);
});

test('buildPagination follows the AGENTS.md format', () => {
  assert.deepEqual(buildPagination(1, 10, 0), { page: 1, limit: 10, total: 0, totalPages: 0 });
  assert.deepEqual(buildPagination(2, 5, 11), { page: 2, limit: 5, total: 11, totalPages: 3 });
});

test('assertStudent only allows STUDENT', () => {
  assert.doesNotThrow(() => assertStudent({ id: 'x', role: 'STUDENT' }));
  for (const role of ['PARENT', 'TUTOR', 'ADMIN', undefined]) {
    assert.throws(() => assertStudent({ id: 'x', role: role }), (error) => error.status === 403);
  }
});

test('getAssignmentProgress handles pending, in progress and overdue', () => {
  const now = new Date('2026-10-29T12:00:00Z');
  const future = new Date('2026-10-30T12:00:00Z');
  const past = new Date('2026-10-28T12:00:00Z');

  assert.deepEqual(getAssignmentProgress({ due_date: future }, false, now), { status: 'PENDING', can_submit: true });
  assert.deepEqual(getAssignmentProgress({ due_date: null }, false, now), { status: 'PENDING', can_submit: true });
  assert.deepEqual(getAssignmentProgress({ due_date: future }, true, now), { status: 'IN_PROGRESS', can_submit: true });
  assert.deepEqual(getAssignmentProgress({ due_date: past, allow_late_submission: true }, true, now), { status: 'OVERDUE', can_submit: true });
  assert.deepEqual(getAssignmentProgress({ due_date: past, allow_late_submission: false }, false, now), { status: 'OVERDUE', can_submit: false });
  assert.deepEqual(getAssignmentProgress({ due_date: past, allow_late_submission: null }, false, now), { status: 'OVERDUE', can_submit: false });
});
