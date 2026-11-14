import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'A valid session ID is required');
const dateTimeSchema = z
  .string('Time must be an ISO datetime string')
  .datetime({ offset: true, message: 'Time must be a valid ISO datetime with timezone' })
  .transform((value) => new Date(value));

export const createScheduleChangeRequestSchema = z
  .strictObject({
    session_id: objectIdSchema,
    proposed_start_time: dateTimeSchema,
    proposed_end_time: dateTimeSchema,
    reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500, 'Reason must be at most 500 characters'),
  })
  .refine((data) => data.proposed_end_time > data.proposed_start_time, {
    path: ['proposed_end_time'],
    message: 'End time must be after start time',
  });

export const respondScheduleChangeRequestSchema = z
  .strictObject({
    decision: z.enum(['APPROVE', 'REJECT'], 'Choose whether to approve or reject the request'),
    response_comment: z.string().trim().max(500, 'Response comment must be at most 500 characters').optional().default(''),
  })
  .refine((data) => data.decision !== 'REJECT' || data.response_comment.length >= 3, {
    path: ['response_comment'],
    message: 'A reason is required when rejecting a schedule change request',
  });

export const updateScheduleChangeRequestSchema = z
  .strictObject({
    proposed_start_time: dateTimeSchema,
    proposed_end_time: dateTimeSchema,
    reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500, 'Reason must be at most 500 characters'),
  })
  .refine((data) => data.proposed_end_time > data.proposed_start_time, {
    path: ['proposed_end_time'],
    message: 'End time must be after start time',
  });
