import { z } from 'zod';
import mongoose from 'mongoose';
import { ENUMS } from '../../models/enums.js';
import { paginationQuerySchema } from './studentDashboardSchema.js';
import { MAX_CREDITS_PER_ACTION, MIN_CREDITS_PER_ACTION } from '../constants/credits.js';

const objectId = (label) =>
  z.string(`${label} is required`).refine((value) => mongoose.isValidObjectId(value), `Invalid ${label.toLowerCase()}`);

// Body mời gia sư (UC14). strictObject chặn parent_user_id, status do client tự gửi
export const createInvitationSchema = z.strictObject({
  request_id: objectId('Request id'),
  tutor_profile_id: objectId('Tutor profile id'),
  message: z
    .string()
    .trim()
    .max(500, 'Message must be at most 500 characters')
    .nullish()
    .transform((value) => (value ? value : null)),
  // Số credit dùng cho lời mời; mặc định 1. Nhiều credit hơn thì lời mời được ưu tiên hiện lên đầu
  credits: z
    .number('Credits must be a number')
    .int('Credits must be a whole number')
    .min(MIN_CREDITS_PER_ACTION, `Credits must be at least ${MIN_CREDITS_PER_ACTION}`)
    .max(MAX_CREDITS_PER_ACTION, `Credits must be at most ${MAX_CREDITS_PER_ACTION}`)
    .default(MIN_CREDITS_PER_ACTION),
});

// Query danh sách gia sư để mời: q tìm theo tên
export const invitableTutorsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100, 'Search text must be at most 100 characters').optional(),
});

export const invitationListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(ENUMS.TutorInvitationsStatus), 'Invalid status').optional(),
});
