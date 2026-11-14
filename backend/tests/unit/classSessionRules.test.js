import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createClassSessionSchema,
  updateClassSessionSchema,
  markAttendanceSchema,
  createScheduleChangeRequestSchema,
  respondScheduleChangeRequestSchema,
} from '../../src/common/validator/classSessionSchema.js';

test('createClassSessionSchema accepts valid 15-300 min sessions', () => {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end60m = new Date(start.getTime() + 60 * 60 * 1000);

  const parsed = createClassSessionSchema.parse({
    title: 'Toán 12 Đạo hàm',
    start_time: start.toISOString(),
    end_time: end60m.toISOString(),
  });
  assert.equal(parsed.title, 'Toán 12 Đạo hàm');
  assert.equal(parsed.status, 'SCHEDULED');
});

test('createClassSessionSchema rejects sessions shorter than 15 mins or longer than 300 mins', () => {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tooShort = new Date(start.getTime() + 10 * 60 * 1000); // 10 mins
  const tooLong = new Date(start.getTime() + 360 * 60 * 1000); // 6 hours

  assert.equal(
    createClassSessionSchema.safeParse({
      title: 'Quá ngắn',
      start_time: start.toISOString(),
      end_time: tooShort.toISOString(),
    }).success,
    false
  );

  assert.equal(
    createClassSessionSchema.safeParse({
      title: 'Quá dài',
      start_time: start.toISOString(),
      end_time: tooLong.toISOString(),
    }).success,
    false
  );
});

test('updateClassSessionSchema allows partial updates without repeat config', () => {
  const parsed = updateClassSessionSchema.parse({
    title: 'Tiêu đề buổi học mới',
  });
  assert.equal(parsed.title, 'Tiêu đề buổi học mới');
});

test('createClassSessionSchema validates repeat rules and max 6 months constraint', () => {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const validRepeatEnd = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
  const invalidRepeatEnd = new Date(start.getTime() + 200 * 24 * 60 * 60 * 1000); // > 6 months

  const validRepeat = createClassSessionSchema.parse({
    title: 'Học định kỳ',
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    repeat: {
      days_of_week: ['MON', 'THU'],
      end_date: validRepeatEnd.toISOString(),
    },
  });
  assert.deepEqual(validRepeat.repeat.days_of_week, ['MON', 'THU']);

  assert.equal(
    createClassSessionSchema.safeParse({
      title: 'Quá 6 tháng',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      repeat: {
        days_of_week: ['MON'],
        end_date: invalidRepeatEnd.toISOString(),
      },
    }).success,
    false
  );
});

test('markAttendanceSchema validates attendance items and statuses', () => {
  const parsed = markAttendanceSchema.parse({
    items: [
      { student_user_id: '507f1f77bcf86cd799439011', status: 'PRESENT' },
      { student_user_id: '507f1f77bcf86cd799439012', status: 'ABSENT', comment: 'Nghỉ ốm' },
      { student_user_id: '507f1f77bcf86cd799439013', status: 'LATE' },
    ],
  });
  assert.equal(parsed.items.length, 3);
  assert.equal(parsed.items[1].comment, 'Nghỉ ốm');

  assert.equal(
    markAttendanceSchema.safeParse({
      items: [{ student_user_id: '507f1f77bcf86cd799439011', status: 'UNKNOWN' }],
    }).success,
    false
  );

  assert.equal(markAttendanceSchema.safeParse({ items: [] }).success, false);
});

test('createScheduleChangeRequestSchema validates request types and duration', () => {
  const cancelReq = createScheduleChangeRequestSchema.parse({
    request_type: 'CANCEL',
    reason: 'Gia đình bận việc đột xuất',
  });
  assert.equal(cancelReq.request_type, 'CANCEL');

  const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  const moveReq = createScheduleChangeRequestSchema.parse({
    request_type: 'MOVE',
    proposed_start_time: start.toISOString(),
    proposed_end_time: end.toISOString(),
    reason: 'Trùng lịch thi học kỳ ở trường',
  });
  assert.equal(moveReq.request_type, 'MOVE');

  // MOVE thiếu giờ kết thúc
  assert.equal(
    createScheduleChangeRequestSchema.safeParse({
      request_type: 'MOVE',
      proposed_start_time: start.toISOString(),
      reason: 'Đổi giờ',
    }).success,
    false
  );
});

test('respondScheduleChangeRequestSchema allows APPROVED or REJECTED only', () => {
  assert.equal(
    respondScheduleChangeRequestSchema.parse({ status: 'APPROVED', response_comment: 'Đồng ý dời lịch' }).status,
    'APPROVED'
  );
  assert.equal(
    respondScheduleChangeRequestSchema.parse({ status: 'REJECTED', response_comment: 'Gia sư bận khung giờ đó' }).status,
    'REJECTED'
  );
  assert.equal(
    respondScheduleChangeRequestSchema.safeParse({ status: 'PENDING' }).success,
    false
  );
});

