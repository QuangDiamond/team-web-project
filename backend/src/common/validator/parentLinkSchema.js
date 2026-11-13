import { z } from 'zod';
import { ENUMS } from '../../models/enums.js';
import { paginationQuerySchema } from './studentDashboardSchema.js';

// Body lời mời liên kết: phụ huynh nhập email tài khoản học sinh. strictObject chặn parent_user_id, status do client tự gửi
export const inviteStudentSchema = z.strictObject({
  student_email: z
    .string('Student email is required')
    .trim()
    .toLowerCase()
    .min(1, 'Student email is required')
    .max(254, 'Student email must be at most 254 characters')
    .email('Invalid email address'),
});

// Học sinh phản hồi lời mời: ACCEPT hoặc DECLINE
export const respondParentLinkSchema = z.strictObject({
  action: z.enum(['ACCEPT', 'DECLINE'], 'Action must be ACCEPT or DECLINE'),
});

export const parentLinkListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(ENUMS.ParentChildLinksStatus), 'Invalid status').optional(),
});
