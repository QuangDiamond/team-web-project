import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginationQuerySchema } from '../../src/common/validator/studentDashboardSchema.js';
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
