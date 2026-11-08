import { z } from 'zod';

export const statsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y'], { message: 'Khoảng thời gian không hợp lệ.' }).default('30d'),
});
