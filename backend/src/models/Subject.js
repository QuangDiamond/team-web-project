// Danh mục môn học dùng cho ô chọn môn khi tạo yêu cầu (phụ huynh) và bài đăng (gia sư)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    // Tên hiển thị, duy nhất (vd: Toán, Ngữ văn, Tiếng Anh)
    name:       { type: String, required: true },
    // Thứ tự hiển thị trong ô chọn, số nhỏ lên trước
    sort_order: { type: Schema.Types.Int32, default: 0 },
    // false = ẩn khỏi ô chọn nhưng không xóa dữ liệu
    is_active:  { type: Boolean, default: true },
  },
  {
    collection: 'SUBJECTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
  }
);

export const Subject = mongoose.model('Subject', subjectSchema);
