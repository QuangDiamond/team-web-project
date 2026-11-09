import { z } from 'zod';
import { paginationQuerySchema } from './studentDashboardSchema.js';

export const categoryQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
});
export const categoryBodySchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  sort_order: z.number().int().min(0).max(100000),
  is_active: z.boolean(),
  reason: z.string().trim().min(1).max(500),
});
export const deleteCategorySchema = z.strictObject({
  reason: z.string().trim().min(1).max(500),
});
