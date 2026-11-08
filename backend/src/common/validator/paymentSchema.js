import { z } from 'zod';

const PAYMENT_METHODS = ['VIETQR', 'ATM_CARD', 'CREDIT_CARD'];
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const paymentMethodRule = z.enum(PAYMENT_METHODS, "Payment method must be one of these ['VIETQR', 'ATM_CARD', 'CREDIT_CARD']");

// D9: Pro 1–12 tháng
const planUpgradeOrderSchema = z.object({
  item_type: z.literal('PLAN_UPGRADE'),
  plan_id: z.string({ error: 'Plan is required' }).regex(OBJECT_ID_REGEX, 'Invalid plan id'),
  duration_months: z
    .number({ error: 'Duration must be a number' })
    .int('Duration must be a whole number of months')
    .min(1, 'Duration must be at least 1 month')
    .max(12, 'Duration must be at most 12 months'),
  payment_method: paymentMethodRule,
});

// D9: credit pack số lượng 1–10
const creditPackOrderSchema = z.object({
  item_type: z.literal('CREDIT_PACK'),
  pack_id: z.string({ error: 'Credit pack is required' }).regex(OBJECT_ID_REGEX, 'Invalid credit pack id'),
  quantity: z
    .number({ error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(10, 'Quantity must be at most 10'),
  payment_method: paymentMethodRule,
});

// Số tiền không nhận từ client, server tự tính từ giá hiện tại (D9)
export const createOrderSchema = z.discriminatedUnion(
  'item_type',
  [planUpgradeOrderSchema, creditPackOrderSchema],
  { error: "Item type must be one of these ['PLAN_UPGRADE', 'CREDIT_PACK']" }
);

// Form của trang thanh toán giả (chỉ dùng khi dev)
export const mockCheckoutSchema = z.object({
  result: z.enum(['SUCCESS', 'FAILED'], "Result must be SUCCESS or FAILED"),
});

// ----- UC18: bộ lọc lịch sử (query string). page / limit xử lý riêng bằng getPagination -----

// Ngày có thật (chặn 2026-02-30, Date của JS tự cộng sang tháng sau)
const isRealDay = (value) => {
  const parts = value.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (date.getUTCFullYear() !== parts[0]) {
    return false;
  }
  if (date.getUTCMonth() !== parts[1] - 1) {
    return false;
  }
  return date.getUTCDate() === parts[2];
};

// Ngày dạng YYYY-MM-DD (theo giờ Việt Nam), lọc trọn ngày
export const dayRule = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(isRealDay, 'Date is invalid')
  .optional();

export const dateRangeRefine = (data) => {
  if (!data.from || !data.to) {
    return true;
  }
  return data.from <= data.to;
};
export const dateRangeMessage = { message: "'from' must be before or equal to 'to'", path: ['from'] };

export const creditTransactionQuerySchema = z
  .object({
    type: z
      .enum(
        ['MONTHLY_GRANT', 'PURCHASE', 'USED_APPLY', 'USED_INVITATION', 'EXPIRED_GRANT'],
        "Type must be one of these ['MONTHLY_GRANT', 'PURCHASE', 'USED_APPLY', 'USED_INVITATION', 'EXPIRED_GRANT']"
      )
      .optional(),
    from: dayRule,
    to: dayRule,
  })
  .refine(dateRangeRefine, dateRangeMessage);

export const orderQuerySchema = z
  .object({
    status: z
      .enum(
        ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'],
        "Status must be one of these ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED']"
      )
      .optional(),
    from: dayRule,
    to: dayRule,
  })
  .refine(dateRangeRefine, dateRangeMessage);
