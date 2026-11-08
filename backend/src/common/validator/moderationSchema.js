import { z } from 'zod';

export const resolveReportSchema = z
  .object({
    action: z.enum(['NONE', 'WARNING_SENT', 'CONTENT_HIDDEN', 'CONTENT_REMOVED', 'USER_BANNED']),
    admin_note: z
      .string({ required_error: 'Quy tắc BR-20: Vui lòng nhập lý do/ghi chú xử lý của Admin.' })
      .trim()
      .min(1, 'Quy tắc BR-20: Vui lòng nhập lý do/ghi chú xử lý của Admin.')
      .max(1000),
    ban_user_id: z.string().optional().nullable(),
  })
  .strict();

