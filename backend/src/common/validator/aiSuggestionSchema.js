import { z } from 'zod';

const weightValue = z
  .number('Weight must be a number')
  .min(0, 'Weight must be at least 0')
  .max(100, 'Weight must be at most 100');

// Body của POST /refresh (UC09 A1): parent chỉnh trọng số, không gửi gì thì dùng trọng số mặc định
export const refreshSuggestionsSchema = z
  .strictObject({
    weights: z
      .strictObject({
        budget: weightValue.optional(),
        rating: weightValue.optional(),
        schedule: weightValue.optional(),
        area: weightValue.optional(),
      })
      .optional(),
  })
  .superRefine((data, context) => {
    if (!data.weights) {
      return;
    }
    const total = Object.values(data.weights).reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['weights'],
        message: 'At least one weight must be greater than 0',
      });
    }
  });
