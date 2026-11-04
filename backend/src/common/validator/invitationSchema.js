import { z } from 'zod';
import mongoose from 'mongoose';
import { ENUMS } from '../../models/enums.js';
import { paginationQuerySchema } from './studentDashboardSchema.js';

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
});

export const invitationListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(ENUMS.TutorInvitationsStatus), 'Invalid status').optional(),
});
