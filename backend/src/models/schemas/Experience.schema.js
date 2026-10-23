// Subdocument nhúng trong TUTOR_PROFILES.experiences (mảng). Bảng gốc: EXPERIENCES. Lý do embed: luôn
// đọc cùng hồ sơ gia sư, số lượng ít
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const experienceSchema = new Schema(
  {
    // Chức danh công việc hoặc tiêu đề công việc gia sư (Job or tutoring title)
    title:      { type: String, required: true },
    // Nơi làm việc, trung tâm hoặc hình thức Freelance
    company:    { type: String, default: null },
    // Mốc thời gian bắt đầu và kết thúc công việc
    start_date: { type: Date, default: null },
    // Mốc thời gian bắt đầu và kết thúc công việc
    end_date:   { type: Date, default: null },
  },
  { _id: false }
);
