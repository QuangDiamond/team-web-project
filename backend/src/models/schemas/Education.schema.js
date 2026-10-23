// Subdocument nhúng trong TUTOR_PROFILES.educations (mảng). Bảng gốc: EDUCATIONS. Lý do embed: luôn
// đọc cùng hồ sơ gia sư, số lượng ít
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const educationSchema = new Schema(
  {
    // Tên trường Đại học, Cao đẳng hoặc cơ sở giáo dục mà user từng hoặc đang theo học
    school:          { type: String, required: true },
    // Bằng cấp hoặc chuyên ngành đạt được (Ví dụ: Cử nhân CNTT, Thạc sĩ Toán học...)
    degree:          { type: String, default: null },
    // Năm tốt nghiệp. Có thể để năm trong tương lai (Ví dụ: dự kiến 2027) đối với sinh viên đang học đại học
    graduation_year: { type: Schema.Types.Int32, default: null },
    // Đôi lời chia sẻ, thành tích hoặc mô tả thêm về quá trình học tập tại trường đó
    description:     { type: String, default: null },
  },
  { _id: false }
);
