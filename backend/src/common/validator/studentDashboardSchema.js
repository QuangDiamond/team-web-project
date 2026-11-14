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
