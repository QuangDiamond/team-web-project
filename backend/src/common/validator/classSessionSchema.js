import { z } from 'zod';
import { ENUMS } from '../../models/enums.js';

const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 300 * 60 * 1000;
const SIX_MONTHS_MS = 185 * 24 * 60 * 60 * 1000;

const titleSchema = z
  .string('Session title is required')
  .trim()
  .min(1, 'Session title is required')
  .max(200, 'Session title must be at most 200 characters');

const dateTimeSchema = z
  .string('Time must be an ISO datetime string')
  .datetime({ offset: true, message: 'Time must be a valid ISO datetime with timezone' })
  .transform((value) => new Date(value));

const meetingLinkSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().trim().max(2048, 'Meeting link must be at most 2048 characters').nullable(),
);

const sessionStatusSchema = z.enum(Object.values(ENUMS.ClassSessionsStatus), 'Choose a valid session status');

const repeatRuleInputSchema = z
  .strictObject({
    days_of_week: z
      .array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']))
      .min(1, 'Chọn ít nhất 1 ngày trong tuần'),
    end_date: dateTimeSchema,
  })
  .optional()
  .nullable();

export const createClassSessionSchema = z
  .strictObject({
    title: titleSchema,
    start_time: dateTimeSchema,
    end_time: dateTimeSchema,
    meeting_link: meetingLinkSchema,
    status: sessionStatusSchema.default(ENUMS.ClassSessionsStatus.SCHEDULED),
    repeat: repeatRuleInputSchema,
  })
  .refine((data) => data.end_time > data.start_time, {
    path: ['end_time'],
    message: 'End time must be after start time',
  })
  .refine(
    (data) => {
      const diff = data.end_time.getTime() - data.start_time.getTime();
      return diff >= MIN_DURATION_MS && diff <= MAX_DURATION_MS;
    },
    {
      path: ['end_time'],
      message: 'Thời lượng buổi học phải từ 15 phút đến 300 phút (5 tiếng)',
    }
  )
  .refine(
    (data) => {
      if (!data.repeat) return true;
      return data.repeat.end_date > data.start_time;
    },
    {
      path: ['repeat', 'end_date'],
      message: 'Ngày kết thúc lặp phải sau ngày bắt đầu',
    }
  )
  .refine(
    (data) => {
      if (!data.repeat) return true;
      const span = data.repeat.end_date.getTime() - data.start_time.getTime();
      return span <= SIX_MONTHS_MS;
    },
    {
      path: ['repeat', 'end_date'],
      message: 'Thời hạn lặp lịch không được vượt quá 6 tháng',
    }
  );

export const updateClassSessionSchema = z
  .strictObject({
    title: titleSchema.optional(),
    start_time: dateTimeSchema.optional(),
    end_time: dateTimeSchema.optional(),
    meeting_link: meetingLinkSchema.optional(),
    status: sessionStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  })
  .refine((data) => Boolean(data.start_time) === Boolean(data.end_time), {
    path: ['end_time'],
    message: 'Provide both start_time and end_time when changing the schedule',
  })
  .refine((data) => !data.start_time || data.end_time > data.start_time, {
    path: ['end_time'],
    message: 'End time must be after start time',
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;
      const diff = data.end_time.getTime() - data.start_time.getTime();
      return diff >= MIN_DURATION_MS && diff <= MAX_DURATION_MS;
    },
    {
      path: ['end_time'],
      message: 'Thời lượng buổi học phải từ 15 phút đến 300 phút (5 tiếng)',
    }
  );

export const sessionAttendanceItemSchema = z.strictObject({
  student_user_id: z.string().trim().min(1, 'Student ID is required'),
  status: z.enum(Object.values(ENUMS.SessionAttendanceStatus)),
  comment: z.string().trim().max(500).optional().nullable(),
});

export const markAttendanceSchema = z.strictObject({
  items: z.array(sessionAttendanceItemSchema).min(1, 'Cần ít nhất một học sinh để điểm danh'),
});

export const createScheduleChangeRequestSchema = z
  .strictObject({
    request_type: z.enum(Object.values(ENUMS.ScheduleChangeRequestsRequestType)),
    proposed_start_time: dateTimeSchema.optional().nullable(),
    proposed_end_time: dateTimeSchema.optional().nullable(),
    reason: z.string().trim().min(3, 'Lý do phải có ít nhất 3 ký tự').max(500, 'Lý do không vượt quá 500 ký tự'),
  })
  .refine(
    (data) => {
      if (data.request_type === ENUMS.ScheduleChangeRequestsRequestType.MOVE) {
        return (
          data.proposed_start_time &&
          data.proposed_end_time &&
          data.proposed_end_time > data.proposed_start_time
        );
      }
      return true;
    },
    {
      path: ['proposed_end_time'],
      message: 'Cần cung cấp giờ bắt đầu và kết thúc hợp lệ khi xin dời lịch',
    }
  )
  .refine(
    (data) => {
      if (data.request_type === ENUMS.ScheduleChangeRequestsRequestType.MOVE && data.proposed_start_time && data.proposed_end_time) {
        const diff = data.proposed_end_time.getTime() - data.proposed_start_time.getTime();
        return diff >= MIN_DURATION_MS && diff <= MAX_DURATION_MS;
      }
      return true;
    },
    {
      path: ['proposed_end_time'],
      message: 'Thời lượng đề xuất phải từ 15 phút đến 300 phút (5 tiếng)',
    }
  );

export const respondScheduleChangeRequestSchema = z.strictObject({
  status: z.enum([ENUMS.ScheduleChangeRequestsStatus.APPROVED, ENUMS.ScheduleChangeRequestsStatus.REJECTED]),
  response_comment: z.string().trim().max(500).optional().nullable(),
});
