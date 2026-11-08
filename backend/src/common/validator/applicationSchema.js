import { z } from 'zod';
import mongoose from 'mongoose';
import { ENUMS } from '../../models/enums.js';
import { paginationQuerySchema } from './studentDashboardSchema.js';
import { MAX_CREDITS_PER_ACTION, MIN_CREDITS_PER_ACTION } from '../constants/credits.js';

// Body ứng tuyển (UC12). strictObject chặn tutor_profile_id, status, match_score do client tự gửi
export const createApplicationSchema = z.strictObject({
  request_id: z
    .string('Request is required')
    .refine((value) => mongoose.isValidObjectId(value), 'Invalid request id'),
  note: z
    .string()
    .trim()
    .max(500, 'Note must be at most 500 characters')
    .nullish()
    .transform((value) => (value ? value : null)),
  // Số credit dùng cho đơn này; mặc định 1. Nhiều credit hơn thì đơn được ưu tiên hiện lên đầu
  credits: z
    .number('Credits must be a number')
    .int('Credits must be a whole number')
    .min(MIN_CREDITS_PER_ACTION, `Credits must be at least ${MIN_CREDITS_PER_ACTION}`)
    .max(MAX_CREDITS_PER_ACTION, `Credits must be at most ${MAX_CREDITS_PER_ACTION}`)
    .default(MIN_CREDITS_PER_ACTION),
});

export const applicationListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(ENUMS.ApplyRequestsStatus), 'Invalid status').optional(),
});
