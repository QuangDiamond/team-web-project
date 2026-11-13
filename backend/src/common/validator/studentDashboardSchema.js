import { z } from 'zod';

// Query phân trang dùng chung cho các API danh sách của Student Dashboard (UC36)
export const paginationQuerySchema = z.object({
  page: z.coerce
    .number('Page must be a number')
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number('Limit must be a number')
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(10),
});

// Query cho danh sách tất cả bài tập của học sinh
export const studentAssignmentsQuerySchema = paginationQuerySchema.extend({
  status: z
    .enum(['ALL', 'PENDING', 'SUBMITTED', 'GRADED', 'OVERDUE'])
    .optional()
    .default('ALL'),
  classId: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

// Query cho hoạt động học tập (Line chart)
export const activityQuerySchema = z.object({
  weeks: z.coerce
    .number('Weeks must be a number')
    .int('Weeks must be an integer')
    .min(4, 'Minimum 4 weeks')
    .max(12, 'Maximum 12 weeks')
    .optional()
    .default(6),
});

// Query cho lịch sử làm bài của học sinh
export const submissionHistoryQuerySchema = paginationQuerySchema.extend({
  classId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  status: z.enum(['ALL', 'GRADED', 'SUBMITTED']).optional().default('ALL'),
});

// Query cho lịch học của học sinh (UC30 / UC32)
export const studentScheduleQuerySchema = z.object({
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  status: z.enum(['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED']).optional().default('ALL'),
});
