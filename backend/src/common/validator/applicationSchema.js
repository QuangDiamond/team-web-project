import { z } from 'zod';
import mongoose from 'mongoose';
import { ENUMS } from '../../models/enums.js';
import { paginationQuerySchema } from './studentDashboardSchema.js';

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
});

export const applicationListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(ENUMS.ApplyRequestsStatus), 'Invalid status').optional(),
});
