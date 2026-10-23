// Subdocument nhúng trong TUTOR_PROFILES.achievements (mảng). Bảng gốc: ACHIEVEMENTS. Lý do embed:
// luôn đọc cùng hồ sơ gia sư, số lượng ít
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const achievementSchema = new Schema(
  {
    // Tên thành tích / giải thưởng (VD: "Giải Nhất HSG Toán cấp Tỉnh 2022", "IELTS 8.0"). Bắt buộc nhập vì là thông…
    title:       { type: String, required: true },
    // Mô tả chi tiết thêm về thành tích (năm đạt, đơn vị cấp, ý nghĩa...). Không bắt buộc nên để NULLABLE
    description: { type: String, default: null },
  },
  { _id: false }
);
