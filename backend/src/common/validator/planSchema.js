import { z } from 'zod';

// Giới hạn trên để tránh nhập nhầm số quá lớn (Int32 trong DB tối đa ~2.1 tỷ)
const MAX_PRICE = 1000000000;
const MAX_CREDITS = 1000000;
const MAX_AI_QUOTA = 1000000;
const MAX_CLASSROOMS = 1000;
const MAX_ANNUAL_DISCOUNT_PERCENT = 99;

const PACK_TARGET_ROLES = ['TUTOR', 'PARENT'];

// BR-16: mọi thao tác của Admin phải có lý do
const reasonRule = z
  .string({ error: 'Reason is required' })
  .trim()
  .min(1, 'Reason is required')
  .max(500, 'Reason must be at most 500 characters');

const packNameRule = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters');

// E1: giá âm không hợp lệ (tiền VND nên là số nguyên)
const planPriceRule = z
  .number({ error: 'Monthly price must be a number' })
  .int('Monthly price must be a whole number (VND)')
  .min(0, 'Monthly price cannot be negative')
  .max(MAX_PRICE, 'Monthly price is too large');

const packPriceRule = z
  .number({ error: 'Price must be a number' })
  .int('Price must be a whole number (VND)')
  .min(1, 'Price must be greater than 0')
  .max(MAX_PRICE, 'Price is too large');

// E1: gói credit có 0 credit không hợp lệ
const creditAmountRule = z
  .number({ error: 'Credit amount must be a number' })
  .int('Credit amount must be a whole number')
  .min(1, 'Credit amount must be at least 1')
  .max(MAX_CREDITS, 'Credit amount is too large');

const planFieldsSchema = z.object({
  name: packNameRule.optional(),
  monthly_price: planPriceRule,
  billing_period: z.enum(['MONTHLY', 'YEARLY'], 'Billing period must be MONTHLY or YEARLY').optional(),
  annual_discount_percent: z
    .number({ error: 'Annual discount must be a number' })
    .int('Annual discount must be a whole percentage')
    .min(0, 'Annual discount cannot be negative')
    .max(MAX_ANNUAL_DISCOUNT_PERCENT, `Annual discount cannot exceed ${MAX_ANNUAL_DISCOUNT_PERCENT}%`)
    .optional(),
  // D1: mọi gói (kể cả Free) phải có ít nhất 1 credit/tháng
  monthly_credits: z
    .number({ error: 'Monthly credits must be a number' })
    .int('Monthly credits must be a whole number')
    .min(1, 'Monthly credits must be at least 1')
    .max(MAX_CREDITS, 'Monthly credits is too large'),
  ai_quota: z
    .number({ error: 'AI quota must be a number' })
    .int('AI quota must be a whole number')
    .min(0, 'AI quota cannot be negative')
    .max(MAX_AI_QUOTA, 'AI quota is too large'),
  // null = không giới hạn số lớp
  max_classrooms: z
    .number({ error: 'Class limit must be a number or null (unlimited)' })
    .int('Class limit must be a whole number')
    .min(1, 'Class limit must be at least 1')
    .max(MAX_CLASSROOMS, 'Class limit is too large')
    .nullable(),
  sms_reminders_enabled: z.boolean({ error: 'SMS reminders must be true or false' }),
  is_active: z.boolean({ error: 'Availability must be true or false' }).optional(),
  reason: reasonRule,
});

const validatePlanBilling = (data, context) => {
  if (data.billing_period === 'MONTHLY' && data.annual_discount_percent > 0) {
    context.addIssue({
      code: 'custom',
      path: ['annual_discount_percent'],
      message: 'Annual discount is only available for yearly plans',
    });
  }
  if (data.name === 'FREE_DEFAULT' && data.billing_period === 'YEARLY') {
    context.addIssue({
      code: 'custom',
      path: ['billing_period'],
      message: 'Free plan must use the monthly period',
    });
  }
};

export const updatePlanSchema = planFieldsSchema.superRefine(validatePlanBilling);

export const createPlanSchema = planFieldsSchema.extend({
  target_role: z.enum(PACK_TARGET_ROLES, 'Target role must be TUTOR or PARENT'),
  name: packNameRule,
  billing_period: z.enum(['MONTHLY', 'YEARLY'], 'Billing period must be MONTHLY or YEARLY').default('MONTHLY'),
  annual_discount_percent: z
    .number({ error: 'Annual discount must be a number' })
    .int('Annual discount must be a whole percentage')
    .min(0, 'Annual discount cannot be negative')
    .max(MAX_ANNUAL_DISCOUNT_PERCENT, `Annual discount cannot exceed ${MAX_ANNUAL_DISCOUNT_PERCENT}%`)
    .default(0),
  is_active: z.boolean({ error: 'Availability must be true or false' }).default(true),
}).superRefine((data, context) => {
  validatePlanBilling(data, context);
  if (data.name === 'FREE_DEFAULT' && data.monthly_price !== 0) {
    context.addIssue({
      code: 'custom',
      path: ['monthly_price'],
      message: 'Free plan price must be 0',
    });
  }
  if (data.name === 'FREE_DEFAULT' && data.annual_discount_percent > 0) {
    context.addIssue({
      code: 'custom',
      path: ['annual_discount_percent'],
      message: 'Free plan cannot have an annual discount',
    });
  }
});

export const createCreditPackSchema = z.object({
  target_role: z.enum(PACK_TARGET_ROLES, "Target role must be one of these ['TUTOR', 'PARENT']"),
  name: packNameRule,
  credit_amount: creditAmountRule,
  price: packPriceRule,
  reason: reasonRule,
});

export const updateCreditPackSchema = z.object({
  name: packNameRule,
  credit_amount: creditAmountRule,
  price: packPriceRule,
  reason: reasonRule,
});

export const updateCreditPackStatusSchema = z.object({
  is_active: z.boolean({ error: 'is_active must be true or false' }),
  reason: reasonRule,
});
