import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createScheduleChangeRequestSchema,
  updateScheduleChangeRequestSchema,
} from '../../src/common/validator/scheduleChangeRequestSchema.js';

const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
const minutesAfterStart = (minutes) => new Date(start.getTime() + minutes * 60 * 1000).toISOString();
const sessionId = 'a'.repeat(24);

test('schedule change request accepts a 15-300 minute proposal', () => {
  const parsed = createScheduleChangeRequestSchema.parse({
    session_id: sessionId,
    proposed_start_time: start.toISOString(),
    proposed_end_time: minutesAfterStart(90),
    reason: 'Bận việc gia đình',
  });
  assert.equal(parsed.proposed_end_time.getTime() - parsed.proposed_start_time.getTime(), 90 * 60 * 1000);
});

test('schedule change request rejects proposals shorter than 15 or longer than 300 minutes', () => {
  for (const minutes of [10, 301]) {
    const createResult = createScheduleChangeRequestSchema.safeParse({
      session_id: sessionId,
      proposed_start_time: start.toISOString(),
      proposed_end_time: minutesAfterStart(minutes),
      reason: 'Bận việc gia đình',
    });
    const updateResult = updateScheduleChangeRequestSchema.safeParse({
      proposed_start_time: start.toISOString(),
      proposed_end_time: minutesAfterStart(minutes),
      reason: 'Bận việc gia đình',
    });
    assert.equal(createResult.success, false);
    assert.equal(updateResult.success, false);
  }
});
