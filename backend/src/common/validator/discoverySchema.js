import { z } from 'zod';
import { paginationQuerySchema } from './studentDashboardSchema.js';

const textFilter = z.string().trim().max(100).optional();
export const tutorSearchSchema = paginationQuerySchema.extend({
  q: textFilter,
  subject: textFilter,
  grade: textFilter,
  area: textFilter,
  mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).optional(),
  availability: z.enum(['AVAILABLE', 'NOT_AVAILABLE']).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  min_price: z.coerce.number().min(0).max(1000000000).optional(),
  max_price: z.coerce.number().min(0).max(1000000000).optional(),
}).refine((data) => data.min_price === undefined || data.max_price === undefined || data.min_price <= data.max_price, {
  path: ['max_price'], message: 'Maximum price must be greater than or equal to minimum price',
});
