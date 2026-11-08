import { z } from 'zod';
import mongoose from 'mongoose';
import { ENUMS } from '../../models/enums.js';
import { paginationQuerySchema } from './studentDashboardSchema.js';

const objectId = z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid id');

const requiredText = (label, max) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (label, max) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .nullish()
    .transform((value) => (value ? value : null));

// Body tạo / sửa request (UC10). strictObject chặn parent_user_id, status, created_at, image_urls...
export const parentRequestBodySchema = z
  .strictObject({
    title: requiredText('Request title', 150),
    student_id: objectId.nullish().transform((value) => value ?? null),
    subject_name: requiredText('Subject', 100),
    grade_level: requiredText('Grade level', 50),
    description: requiredText('Learning goal', 2000),
    schedule: requiredText('Preferred schedule', 300),
    budget: z.coerce
      .number('Budget must be a number')
      .positive('Budget must be greater than 0')
      .max(100000000, 'Budget is too large'),
    teaching_mode: z.enum(
      Object.values(ENUMS.ParentRequestsTeachingMode),
      'Session mode must be ONLINE, OFFLINE or HYBRID'
    ),
    location_address: optionalText('Location', 255),
    tutor_requirements: optionalText('Tutor requirements', 1000),
  })
  .superRefine((data, context) => {
    // Học trực tiếp / kết hợp thì cần địa điểm để gia sư lọc theo khu vực
    if (data.teaching_mode !== ENUMS.ParentRequestsTeachingMode.ONLINE && !data.location_address) {
      context.addIssue({
        code: 'custom',
        path: ['location_address'],
        message: 'Location is required for in-person or hybrid sessions',
      });
    }
  });

export const parentRequestListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(ENUMS.ParentRequestsStatus), 'Invalid status').optional(),
});
