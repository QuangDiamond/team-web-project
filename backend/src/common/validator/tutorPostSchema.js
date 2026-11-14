import { z } from 'zod';
import { ENUMS } from '../../models/enums.js';
import { paginationQuerySchema } from './studentDashboardSchema.js';

const requiredText = (label, max) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

// Gia sư chỉ tự chuyển giữa các trạng thái này; PENDING_MODERATION do quản trị viên xử lý, DELETED là xóa mềm
export const TUTOR_SETTABLE_STATUSES = [
  ENUMS.TutorPostsStatus.DRAFT,
  ENUMS.TutorPostsStatus.PUBLISHED,
  ENUMS.TutorPostsStatus.HIDDEN,
];

const postFields = {
  title: requiredText('Title', 150),
  subject_name: requiredText('Subject', 100),
  grade_level: requiredText('Grade level', 50),
  teaching_mode: z.enum(Object.values(ENUMS.TutorPostsTeachingMode), 'Session mode must be ONLINE, OFFLINE or HYBRID'),
  price: z.coerce
    .number('Price must be a number')
    .gt(1000, 'Price must be greater than 1000')
    .max(100000000, 'Price is too large'),
  schedule: requiredText('Available schedule', 300),
  description: requiredText('Description', 2000),
};

// Tạo bài đăng: có thể lưu nháp hoặc đăng ngay (mặc định nháp)
export const createTutorPostSchema = z.strictObject({
  ...postFields,
  status: z
    .enum([ENUMS.TutorPostsStatus.DRAFT, ENUMS.TutorPostsStatus.PUBLISHED], 'Status must be DRAFT or PUBLISHED')
    .default(ENUMS.TutorPostsStatus.DRAFT),
});

// Sửa nội dung bài đăng (không đổi trạng thái ở đây)
export const updateTutorPostSchema = z.strictObject(postFields);

export const tutorPostStatusSchema = z.strictObject({
  status: z.enum(TUTOR_SETTABLE_STATUSES, 'Status must be DRAFT, PUBLISHED or HIDDEN'),
});

export const tutorPostListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(ENUMS.TutorPostsStatus), 'Invalid status').optional(),
});
