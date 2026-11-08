import { z } from 'zod';
import { ENUMS } from '../../models/enums.js';
import { paginationQuerySchema } from './studentDashboardSchema.js';

const filterText = z.string().trim().max(100, 'Filter is too long').optional();

const budgetFilter = (label) => z.coerce.number(`${label} must be a number`).min(0, `${label} must be at least 0`).optional();

// Query duyệt request của gia sư (UC11). Frontend bỏ qua field rỗng
export const tutorRequestListQuerySchema = paginationQuerySchema
  .extend({
    q: filterText,
    subject: filterText,
    grade: filterText,
    area: filterText,
    mode: z.enum(Object.values(ENUMS.ParentRequestsTeachingMode), 'Invalid session mode').optional(),
    minBudget: budgetFilter('Minimum budget'),
    maxBudget: budgetFilter('Maximum budget'),
  })
  .refine(
    (query) => query.minBudget === undefined || query.maxBudget === undefined || query.minBudget <= query.maxBudget,
    { path: ['minBudget'], message: 'Minimum budget must not exceed maximum budget' }
  );
