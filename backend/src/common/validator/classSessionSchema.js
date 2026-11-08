import { z } from 'zod';
import { ENUMS } from '../../models/enums.js';

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

export const createClassSessionSchema = z
  .strictObject({
    title: titleSchema,
    start_time: dateTimeSchema,
    end_time: dateTimeSchema,
    meeting_link: meetingLinkSchema,
    status: sessionStatusSchema.default(ENUMS.ClassSessionsStatus.SCHEDULED),
  })
  .refine((data) => data.end_time > data.start_time, {
    path: ['end_time'],
    message: 'End time must be after start time',
  });

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
  });
