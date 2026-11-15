import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findProposalConflict } from '../src/utils/scheduleChangeDates.js';

const session = { _id: 's1', title: 'Buổi gốc', start_time: '2026-11-17T03:45:00.000Z', end_time: '2026-11-17T06:45:00.000Z' };
const otherSessions = [
  session,
  { _id: 's2', title: 'Buổi khác', start_time: '2026-11-18T03:00:00.000Z', end_time: '2026-11-18T04:00:00.000Z' },
  { _id: 's3', title: 'Đã hủy', start_time: '2026-11-19T03:00:00.000Z', end_time: '2026-11-19T04:00:00.000Z', status: 'CANCELLED' },
];

test('findProposalConflict flags a proposal equal to the current time', () => {
  assert.equal(findProposalConflict(session, session.start_time, session.end_time, otherSessions), 'SAME_TIME');
});

test('findProposalConflict returns the overlapping session and ignores itself and cancelled ones', () => {
  const overlapping = findProposalConflict(session, '2026-11-18T03:30:00.000Z', '2026-11-18T05:00:00.000Z', otherSessions);
  assert.equal(overlapping._id, 's2');
  assert.equal(findProposalConflict(session, '2026-11-17T04:00:00.000Z', '2026-11-17T07:00:00.000Z', otherSessions), null);
  assert.equal(findProposalConflict(session, '2026-11-19T03:00:00.000Z', '2026-11-19T04:00:00.000Z', otherSessions), null);
});
