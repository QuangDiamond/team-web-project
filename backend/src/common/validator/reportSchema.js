import mongoose from 'mongoose';
import { z } from 'zod';

// UC38 – người dùng gửi báo cáo vi phạm (SDS 9.2 ReportSchema.reportSchema).
// Hiện hỗ trợ bài đăng gia sư (POST) và yêu cầu tìm gia sư (REQUEST); tin nhắn được báo cáo từ chat (UC32 A3).
export const reportSchema = z
  .object({
    target_type: z.enum(['POST', 'REQUEST'], {
      errorMap: () => ({ message: 'Loại nội dung báo cáo không hợp lệ' }),
    }),
    target_id: z
      .string({ required_error: 'Thiếu nội dung cần báo cáo' })
      .refine((value) => mongoose.isValidObjectId(value), { message: 'Mã nội dung không hợp lệ' }),
    reason: z
      .string({ required_error: 'Vui lòng nhập lý do báo cáo' })
      .trim()
      .min(5, 'Lý do báo cáo cần ít nhất 5 ký tự')
      .max(500, 'Lý do báo cáo tối đa 500 ký tự'),
  })
  .strict();
