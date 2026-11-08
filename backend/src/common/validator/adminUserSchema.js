import { z } from 'zod';
import { dayRule, dateRangeRefine, dateRangeMessage } from './paymentSchema.js';

// BR-16: mọi thao tác của Admin phải có lý do
const reasonRule = z
  .string({ error: 'Reason is required' })
  .trim()
  .min(1, 'Reason is required')
  .max(500, 'Reason must be at most 500 characters');

// Bộ lọc danh sách user (query string). page / limit xử lý riêng bằng getPagination
export const userQuerySchema = z
  .object({
    q: z.string().trim().max(100, 'Search text must be at most 100 characters').optional(),
    role: z.enum(['PARENT', 'TUTOR', 'STUDENT', 'ADMIN'], "Role must be one of these ['PARENT', 'TUTOR', 'STUDENT', 'ADMIN']").optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED'], "Status must be one of these ['ACTIVE', 'SUSPENDED', 'BANNED']").optional(),
    from: dayRule,
    to: dayRule,
  })
  .refine(dateRangeRefine, dateRangeMessage);

export const updateUserStatusSchema = z.object({
  account_status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED'], "Account status must be one of these ['ACTIVE', 'SUSPENDED', 'BANNED']"),
  reason: reasonRule,
});

export const createAdminSchema = z.object({
  full_name: z
    .string({ error: 'Full name is required' })
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be at most 100 characters'),
  email: z.string({ error: 'Email is required' }).trim().email('Input must be email'),
  reason: reasonRule,
});
